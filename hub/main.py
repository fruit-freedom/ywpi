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

import hub_pb2_grpc
import hub_pb2
import models
from logger import logger
from hub.event_repository import repository as events


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


@dataclasses.dataclass
class AgentDescription:
    id: str
    methods: list[models.Method]
    exchanger: 'Exchanger'


AGENTS: dict[str, 'Exchanger'] = { }


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
        AGENTS.pop(self.agent_id, None)
        await events.produce_agent_disconnected(self.agent_id)
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
        logger.debug(f'Write request message "{reply_to}"')

    async def _handle_request(self, reply_to: str, request: hub_pb2.RequestMessage):
        try:
            if request.rpc == hub_pb2.Rpc.RPC_REGISTER_AGENT:
                response = await self._rpc_register_agent(
                    models.RegisterAgentRequest.model_validate_json(request.payload)
                )
            elif request.rpc == hub_pb2.Rpc.RPC_UPDATE_TASK:
                response = await self._rpc_update_task(
                    models.UpdateTaskRequest.model_validate_json(request.payload)
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
        await self._write_request_message(rpc, payload, reply_to)
        try:
            return await asyncio.wait_for(future, timeout=1.0)
        finally:
            pass

    async def _rpc_register_agent(self, payload: models.RegisterAgentRequest) -> models.RegisterAgentResponse:
        if self._agent_description is not None:
            raise AgentProtocolError('Agent already registered')

        if payload.id in AGENTS:
            raise AgentProtocolError(f'Agent with the same id "{payload.id}" already registered')

        self._agent_description = AgentDescription(
            id=payload.id,
            methods=payload.methods,
            exchanger=self
        )
        AGENTS[payload.id] = self
        await events.produce_agent_connected(payload.model_dump())

        logger.info(f'Register new agent "{payload.id}" ("{payload.name}")')
        logger.debug(f'Agent "{payload.id}" methods: {payload.methods}')
        return models.RegisterAgentResponse()

    async def _rpc_update_task(self, payload: models.UpdateTaskRequest) -> models.UpdateTaskResponse:
        if self._agent_description is None:
            raise AgentProtocolError('Agent not registered')
        return models.UpdateTaskResponse()

    async def start_task(self, payload: models.StartTaskRequest) -> models.StartTaskResponse:
        if self._agent_description is None:
            raise AgentProtocolError('Agent not registered')
        
        response = await self._call(hub_pb2.Rpc.RPC_START_TASK, payload.model_dump_json())
        if response.HasField('error'):
            raise Exception(response.error)

        return models.StartTaskResponse.model_validate_json(response.payload)



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
            response = await AGENTS[request.agent_id].start_task(models.StartTaskRequest(
                method=request.method,
                params=json.loads(request.params)
            ))
        except asyncio.TimeoutError as e:
            return hub_pb2.PushTaskResponse(error='Agent timeout error')
        except:
            print(traceback.format_exc())
        return hub_pb2.PushTaskResponse()


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
        await server.stop(0)
    finally:
        await task
        await events.close()

if __name__ == '__main__':
    import asyncio
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        pass
