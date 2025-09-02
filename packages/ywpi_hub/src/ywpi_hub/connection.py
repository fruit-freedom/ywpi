import asyncio
import uuid
import typing as t
import traceback
from contextlib import asynccontextmanager

import aiochannel

from ywpi_hub.logger import logger
from ywpi_hub import hub_pb2
from ywpi_hub import hub_models

class Connection:
    def __init__(
        self,
        input_channel: t.AsyncIterable[hub_pb2.Message],
        # handle_request_cb: t.Callable[[hub_pb2.RequestMessage], t.Awaitable[hub_pb2.ResponseMessage | None]]
    ) -> None:
        self._handle_request_cb = t.Callable[[hub_pb2.RequestMessage], t.Awaitable[hub_pb2.ResponseMessage | None]] | None
        self._input_channel = input_channel
        # Exposed to connection clients
        self.output_channel: aiochannel.Channel[hub_pb2.Message] = aiochannel.Channel()
        self._outgoings_requests: dict[str, asyncio.Future] = {}
        # self._reader_task = asyncio.create_task(self._reader())

    def with_request_callback(
        self,
        handle_request_cb: t.Callable[[hub_pb2.RequestMessage], t.Awaitable[hub_pb2.ResponseMessage | None]]
    ):
        """
            Trigger connection to consuming incoming messages.
            Method required because connection can not recieve `handle_request_cb` during `__init__` method.
            If reader task were created at `__init__` then it can lost messages as
            `handle_request_cb` does not passed.
            Connection can not recieve `handle_request_cb` during init
            because it is independent from service (created before service).
        """
        self._reader_task = asyncio.create_task(self._reader())
        self._handle_request_cb = handle_request_cb
        return self

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
        message: hub_pb2.ResponseMessage,
    ):
        self.output_channel.put_nowait(
            hub_pb2.Message(
                reply_to=reply_to,
                response=message
            )
        )
        logger.debug(f'Write response message "{reply_to}"')

    async def _handle_request(self, reply_to: str, request: hub_pb2.RequestMessage):
        try:
            response = await self._handle_request_cb(request)

            if response is not None:
                await self._write_response_message(reply_to=reply_to, message=response)
        except BaseException as e:
            logger.warning(f'handle rpc error: {e}')
            await self._write_response_message(reply_to=reply_to, message=hub_pb2.ResponseMessage(
                error=traceback.format_exc()
            ))

    async def _handle_response(self, reply_to: str, response: hub_pb2.ResponseMessage):
        if reply_to in self._outgoings_requests:
            future = self._outgoings_requests.pop(reply_to)
            if future.cancelled():
                logger.warning(f'Recieve timeout response message {reply_to}')
            else:
                future.set_result(response)
        else:
            logger.warning(f'Recieve unexpected response message {reply_to}')

    # @with_exception_logging
    async def _reader(self):
        async for message in self._input_channel:
            # Bug in aiochannel pkg: `def __aiter__(self) -> "Channel":` no type
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

    async def call(self, rpc: hub_pb2.Rpc, payload: str) -> hub_pb2.ResponseMessage:
        reply_to = str(uuid.uuid4())
        future = asyncio.Future()
        self._outgoings_requests[reply_to] = future
        logger.debug(f'Call rpc "{hub_pb2.Rpc.Name(rpc)}"')
        await self._write_request_message(rpc, payload, reply_to)
        try:
            return await asyncio.wait_for(future, timeout=10.0)
        finally:
            # TODO: Remove future from `_outgoings_requests`
            logger.debug(f'Rpc "{hub_pb2.Rpc.Name(rpc)}" finished')

    async def close(self):
        self._reader_task.cancel()


from ywpi_hub.tasks_respository import TaskRepository
from ywpi_hub.agents_repository import AgentRepository


class AgentCommunicator:
    def __init__(
        self,
        connection: Connection,
        tasks_repository: TaskRepository,
        agents_repository: AgentRepository,
    ):
        self._connection = connection.with_request_callback(self._handle_reuest_cb)
        self._tasks_repository = tasks_repository
        self._agents_repository = agents_repository
        self._agent_description = None

    async def _handle_reuest_cb(self, request: hub_pb2.RequestMessage) -> hub_pb2.ResponseMessage | None:
        try:
            if request.rpc == hub_pb2.Rpc.RPC_REGISTER_AGENT:
                response = await self._rpc_register_agent(
                    hub_models.RegisterAgentRequest.model_validate_json(request.payload)
                )
            elif request.rpc == hub_pb2.Rpc.RPC_UPDATE_TASK:
                response = await self._rpc_update_task(
                    hub_models.UpdateTaskRequest.model_validate_json(request.payload)
                )
            # elif request.rpc == hub_pb2.Rpc.RPC_START_TASK:
            #     response = await self._rpc_start_task( # Start self task (tracking)
            #         hub_models.StartTaskRequest.model_validate_json(request.payload)
            #     )
            else:
                raise NotImplementedError(f'rpc {hub_pb2.Rpc.Name(request.rpc)} not implemented')

            return hub_pb2.ResponseMessage(payload=response.model_dump_json())
        except BaseException as e:
            logger.warning(f'handle rpc error: {e}')
            return hub_pb2.ResponseMessage(error=traceback.format_exc())

    async def _rpc_register_agent(self, payload: hub_models.RegisterAgentRequest) -> hub_models.RegisterAgentResponse:
        # TODO: Does this method required ?
        # If this method there -> Agtn registration does not required
        if self._agent_description is not None:
            raise RuntimeError('Agent already registered')

        self._agent_description = await self._agents_repository.add(payload, self)

        logger.info(f'Register new agent "{payload.id}" ({payload.project} / "{payload.name}")')
        logger.debug(f'Agent "{payload.id}" methods: {payload.methods}')
        return hub_models.RegisterAgentResponse()

    async def _rpc_update_task(self, payload: hub_models.UpdateTaskRequest) -> hub_models.UpdateTaskResponse:
        if self._agent_description is None:
            raise RuntimeError('Agent not registered')

        if payload.outputs is not None:
            await self._tasks_repository.update_outputs(payload.id, payload.outputs)

        if payload.status is not None:
            await self._tasks_repository.update_status(payload.id, payload.status)

        return hub_models.UpdateTaskResponse()

    # async def _rpc_start_task(self, payload: hub_models.StartTaskRequest) -> hub_models.StartTaskResponse:
    #     """Start self task (tracking)"""
    #     if self._agent_description is None:
    #         raise RuntimeError('Agent not registered')

    #     task = await tasks.add(self.agent_id, method=payload.method, inputs=payload.params)
    #     print('Created task', task)

    #     # TODO: Return task ID
    #     return hub_models.StartTrackinTaskResponse(id=task.id)

    async def start_task(self, payload: hub_models.StartTaskRequest) -> hub_models.StartTaskResponse:
        if self._agent_description is None:
            raise RuntimeError('Agent not registered')

        response = await self._connection.call(hub_pb2.Rpc.RPC_START_TASK, payload.model_dump_json())
        if response.HasField('error'):
            raise Exception(response.error)

        return hub_models.StartTaskResponse.model_validate_json(response.payload)

    async def close(self):
        await self._agents_repository.remove(self._agent_description.id)



from ywpi_hub import hub_pb2_grpc
import grpc
from ywpi_hub.events.repository import repository 


class Hub(hub_pb2_grpc.HubServicer):
    def __init__(self):
        super().__init__()
        self.agents_repository = AgentRepository()
        self.tasks_respository = TaskRepository()

    async def Connect(self, request_iterator, context: grpc.ServicerContext):
        """
        1. Client connected and `Connection` created
        2. Client perform `register` protocol and became `Agent`
            2.1. Connection registered in `AgentsRepository` and became `Agent`
        3. All communications with agent (actually connection) perfromed through `AgentsRepository`

        If agent can perform some actions without autorization?
        """
        connection = Connection(request_iterator)

        # Possibly leak agent
        agent = AgentCommunicator(connection, self.tasks_respository, self.agents_repository)

        try:
            async for message in connection.output_channel:
                yield message
        except asyncio.CancelledError:
            pass
        except:
            traceback.print_exc()
        finally:
            await agent.close()
            await connection.close()
            logger.info("Disconected agent")

    async def execute_method(self, agent_id: str, method_name: str, inputs: dict):
        agent = self.agents_repository.get(agent_id)
        created_task, future = await self.tasks_respository.add_with_tracking(agent_id, method_name, inputs)

        response = await agent.connector.start_task(hub_models.StartTaskRequest(
            id=created_task.id,
            method=method_name,
            params=inputs
        ))

        task = await future
        return task.outputs

    async def run(self):
        server = grpc.aio.server()
        hub_pb2_grpc.add_HubServicer_to_server(self, server)
        server.add_insecure_port("[::]:50051")

        await server.start()
        logger.info('Started and listening on [::]:50051')

        try:
            await repository.init()
            await server.wait_for_termination()
        except BaseException:
            traceback.print_exc()
            await server.stop(0)
        finally:
            await repository.close()

    @asynccontextmanager
    async def start(self):
        server = grpc.aio.server()
        hub_pb2_grpc.add_HubServicer_to_server(self, server)
        server.add_insecure_port("[::]:50051")
        await server.start()

        logger.info('Started and listening on [::]:50051')
        try:
            await repository.init()

            yield

            await server.stop(0)
        except BaseException:
            traceback.print_exc()
        finally:
            await repository.close()


# Application code require
#   - Read only access to agents repository + subscribtion + calling
#   - Read only access to tasks repository + subscribtion


@asynccontextmanager
async def _default_lifespan():
    yield

from collections import defaultdict

class HubApp(Hub):
    def __init__(self, lifespan: t.AsyncContextManager | None = None):
        super().__init__()
        self._lifespan = lifespan if lifespan is not None else _default_lifespan

        self._callbacks: dict[
            t.Literal["agent_connected", "agent_disconnected", "task_event"], list
        ] = defaultdict(lambda: [])

    async def run(self):
        # await self.on_startup()
        async with _default_lifespan():
            await super().run()

    @asynccontextmanager
    async def start(self):
        await self._init()
        async with self._lifespan():
            async with super().start():
                yield

    def on_agent_connected(self, func):
        self._callbacks['agent_connected'].append(func)
        return func

    def on_agent_disconnected(self, func):
        self._callbacks['agent_disconnected'].append(func)
        return func

    async def _init(self):
        asyncio.create_task(self._subscriber_task())

    async def _subscriber_task(self):
        async for event in self.agents_repository.subscribe_on_updates():
            callbacks = []
            if isinstance(event, dict) and len(event) > 1:
                callbacks = self._callbacks['agent_connected']
            elif isinstance(event, dict) and len(event) == 1:
                callbacks = self._callbacks['agent_disconnected']

            for func in callbacks:
                try:
                    await func(event)
                except:
                    traceback.print_exc()


# app = HubApp()


# @app.on_agent_connected
# async def fn(data: dict):
#     print("Agent connected", data)


# @app.on_agent_disconnected
# async def fn(data: dict):
#     print("Agent disconnected", data)
#     app.execute_method()



async def main():
    await app.run()
    # async with app.start():
    #     pass
        # a = hub.agents_repository.get("")


def runserver():
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        pass


if __name__ == '__main__':
    runserver()
