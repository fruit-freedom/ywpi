import warnings
warnings.simplefilter("ignore", UserWarning)

import dataclasses
import json
import pydantic
import typing
import uuid
import traceback
import asyncio

import grpc
import aiochannel

from . import hub_pb2_grpc
from . import hub_pb2
from . import hub_models
from .logger import logger
from hub.events.repository import repository as events
from hub.agents_repository import repository as agents, AgentDescription
from hub.tasks_respository import repository as tasks


def with_exception_logging(func):
    async def decorated(*args, **kwargs):
        try:
            return await func(*args, **kwargs)
        except BaseException as e:
            print(traceback.format_exc())
            raise e
    return decorated


class AgentProtocolError(Exception):
    def __init__(self, *args: object) -> None:
        super().__init__(*args)


class Exchanger:
    def __init__(self, input_channel) -> None:
        self._outgoings_requests: dict[str, asyncio.Future] = {}

        self._input_channel = input_channel
        self.output_channel: aiochannel.Channel[hub_pb2.Message] = aiochannel.Channel()
        self._reader_task = asyncio.create_task(self._reader())
        self._agent_description: AgentDescription | None = None

    @property
    def agent_id(self):
        return self._agent_description.id if self._agent_description else 'undefined'

    async def close(self):
        await agents.remove(self.agent_id)
        self._reader_task.cancel()

    async def _write_request_message(self, rpc: hub_pb2.Rpc, payload: str, reply_to: str):
        self.output_channel.put_nowait(
            hub_pb2.Message(
                reply_to=reply_to,
                request=hub_pb2.RequestMessage(
                    rpc=rpc,
                    payload=payload
                )
            )
        )
        logger.debug(f'Write request message "{reply_to}"')

    async def _write_response_message(
            self,
            reply_to: str,
            payload: str | None = None,
            error: str | None = 'undefined'
        ):
        args = { 'payload': payload } if payload else { 'error': error }
        self.output_channel.put_nowait(
            hub_pb2.Message(
                reply_to=reply_to,
                response=hub_pb2.ResponseMessage(
                    **args
                )
            )
        )
        logger.debug(f'Write response message "{reply_to}"')

    async def _handle_request(self, reply_to: str, request: hub_pb2.RequestMessage):
        try:
            if request.rpc == hub_pb2.Rpc.RPC_REGISTER_AGENT:
                response = await self._rpc_register_agent(
                    hub_models.RegisterAgentRequest.model_validate_json(request.payload)
                )
            elif request.rpc == hub_pb2.Rpc.RPC_UPDATE_TASK:
                response = await self._rpc_update_task(
                    hub_models.UpdateTaskRequest.model_validate_json(request.payload)
                )
            elif request.rpc == hub_pb2.Rpc.RPC_START_TASK:
                # Start self task (tracking)
                response = await self._rpc_start_task(
                    hub_models.StartTaskRequest.model_validate_json(request.payload)
                )
            else:
                raise NotImplementedError(f'rpc {hub_pb2.Rpc.Name(request.rpc)} not implemented')
            
            await self._write_response_message(reply_to=reply_to, payload=response.model_dump_json())
        except BaseException as e:
            logger.warning(f'handle rpc error: {e}')
            await self._write_response_message(
                reply_to=reply_to, error=str(e)
            )

    async def _handle_response(self, reply_to: str, response: hub_pb2.ResponseMessage):
        if reply_to in self._outgoings_requests:
            future = self._outgoings_requests.pop(reply_to)
            if future.cancelled():
                logger.warning(f'Recieve timeout response message {reply_to}')
            else:
                future.set_result(response)
        else:
            logger.warning(f'Recieve unexpected response message {reply_to}')

    @with_exception_logging
    async def _reader(self):
        async for message in self._input_channel:
            # Bug in aiochannel pkg: `def __aiter__(self) -> "Channel":` no type
            message: hub_pb2.Message
            attr = message.__getattribute__(message.WhichOneof('message'))
            logger.debug(f'Read message "{message.reply_to}"')

            if isinstance(attr, hub_pb2.ResponseMessage):
                logger.debug(f'Recieve response for "{message.reply_to}"')
                await self._handle_response(message.reply_to, attr)
            elif isinstance(attr, hub_pb2.RequestMessage):
                logger.info(f'Recieve rpc "{hub_pb2.Rpc.Name(attr.rpc)}"')
                await self._handle_request(message.reply_to, attr)
            else:
                logger.warning(f'Recieved unexpected message type {type(attr)}')

    async def _call(self, rpc: hub_pb2.Rpc, payload: str) -> hub_pb2.ResponseMessage:
        reply_to = str(uuid.uuid4())
        future = asyncio.Future()
        self._outgoings_requests[reply_to] = future
        logger.debug(f'Call rpc "{hub_pb2.Rpc.Name(rpc)}"')
        await self._write_request_message(rpc, payload, reply_to)
        try:
            return await asyncio.wait_for(future, timeout=10.0)
        finally:
            logger.debug(f'Rpc "{hub_pb2.Rpc.Name(rpc)}" finished')

    async def _rpc_register_agent(self, payload: hub_models.RegisterAgentRequest) -> hub_models.RegisterAgentResponse:
        if self._agent_description is not None:
            raise AgentProtocolError('Agent already registered')

        self._agent_description = await agents.add(payload, self)

        logger.info(f'Register new agent "{payload.id}" ({payload.project} / "{payload.name}")')
        logger.debug(f'Agent "{payload.id}" methods: {payload.methods}')
        return hub_models.RegisterAgentResponse()

    async def _rpc_update_task(self, payload: hub_models.UpdateTaskRequest) -> hub_models.UpdateTaskResponse:
        if self._agent_description is None:
            raise AgentProtocolError('Agent not registered')

        if payload.outputs is not None:
            await tasks.update_outputs(payload.id, payload.outputs)

        if payload.status is not None:
            await tasks.update_status(payload.id, payload.status)

        return hub_models.UpdateTaskResponse()

    async def _rpc_start_task(self, payload: hub_models.StartTaskRequest) -> hub_models.StartTaskResponse:
        """Start self task (tracking)"""
        if self._agent_description is None:
            raise AgentProtocolError('Agent not registered')

        task = await tasks.add(self.agent_id, method=payload.method, inputs=payload.params)
        print('Created task', task)

        # TODO: Return task ID
        return hub_models.StartTrackinTaskResponse(id=task.id)

    async def start_task(self, payload: hub_models.StartTaskRequest) -> hub_models.StartTaskResponse:
        if self._agent_description is None:
            raise AgentProtocolError('Agent not registered')

        response = await self._call(hub_pb2.Rpc.RPC_START_TASK, payload.model_dump_json())
        if response.HasField('error'):
            raise Exception(response.error)

        return hub_models.StartTaskResponse.model_validate_json(response.payload)


class Hub(hub_pb2_grpc.HubServicer):
    async def Connect(self, request_iterator, context: grpc.ServicerContext):
        exchanger = Exchanger(request_iterator)
        try:
            async for message in exchanger.output_channel:
                yield message
        except:
            pass
        finally:
            await exchanger.close()
            logger.info(f'Disconected agent "{exchanger.agent_id}"')

    async def PushTask(self, request: hub_pb2.PushTaskRequest, context: grpc.ServicerContext):
        logger.info(f'Perform task creation for agent "{request.agent_id}"')
        try:
            agent = agents.get(request.agent_id)
            task = await tasks.add(request.agent_id, request.method, json.loads(request.params))

            response = await agent.connector.start_task(hub_models.StartTaskRequest(
                id=task.id,
                method=request.method,
                params=json.loads(request.params)
            ))
            return hub_pb2.PushTaskResponse(task_id=task.id)
        except asyncio.TimeoutError as e:
            return hub_pb2.PushTaskResponse(error='Agent timeout error')
        except:
            print(traceback.format_exc())
            return hub_pb2.PushTaskResponse(error='Unknown agent error')

    async def RunTask(self, request: hub_pb2.PushTaskRequest, context: grpc.ServicerContext):
        try:
            agent = agents.get(request.agent_id)
            created_task, future = await tasks.add_with_tracking(request.agent_id, request.method, json.loads(request.params))

            response = await agent.connector.start_task(hub_models.StartTaskRequest(
                id=created_task.id,
                method=request.method,
                params=json.loads(request.params)
            ))
            
            task = await future
            return hub_pb2.RunTaskResponse(outputs=json.dumps(task.outputs))
        except:
            print(traceback.format_exc())
            return hub_pb2.RunTaskResponse(error='Unknown agent error')

    async def GetAgentsList(self, request: hub_pb2.GetAgentsListRequest, context: grpc.ServicerContext):
        result = []
        for a in agents.get_list():
            methods = []
            for m in a.methods:
                methods.append(hub_pb2.Method(
                    name=m.name,
                    inputs=[hub_pb2.Input(name=i.name, type=i.type.name) for i in m.inputs]
                ))

            result.append(hub_pb2.Agent(
                id=a.id,
                name=a.name,
                methods=methods
            ))
        return hub_pb2.GetAgentsListResponse(agents=result)

    async def SubscribeOnAgents(self, request: hub_pb2.SubscribeOnAgentsRequest, context: grpc.ServicerContext):
        async for event in agents.subscribe_on_updates():
            yield hub_pb2.SubscribeOnAgentsResponse(payload=json.dumps(event))


async def main():
    server = grpc.aio.server()
    hub_pb2_grpc.add_HubServicer_to_server(Hub(), server)
    server.add_insecure_port("[::]:50051")
    await server.start()
    logger.info('Started and listening on [::]:50051')

    async def waiter_task():
        try:
            await server.wait_for_termination()
        except:
            logger.info(f'Stop server')
    task = asyncio.create_task(waiter_task())

    try:
        await events.init()
        await task
    except BaseException:
        print(traceback.format_exc())
        await server.stop(0)
    finally:
        await task
        await events.close()


def runserver():
    import asyncio
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        pass

if __name__ == '__main__':
    runserver()