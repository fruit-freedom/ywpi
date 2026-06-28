import asyncio
import traceback
import json
from contextlib import asynccontextmanager
import typing as t
from collections import defaultdict

import grpc
import pydantic

from ywpi_hub.events.repository import repository
from ywpi_hub.tasks_respository import TaskRepository
from ywpi_hub.agents_repository import AgentRepository
from ywpi_hub import hub_pb2_grpc, hub_pb2, hub_models
from ywpi_hub.connection import Connection, AgentCommunicator
from ywpi_hub.logger import logger
from ywpi_hub import settings


grpc_channel_options = [
    ('grpc.max_send_message_length', settings.YWPI_GRPC_MAX_MESSAGE_SIZE),
    ('grpc.max_receive_message_length', settings.YWPI_GRPC_MAX_MESSAGE_SIZE),
    ('grpc.keepalive_time_ms', settings.YWPI_GRPC_KEEPALIVE_TIME_MS),
    ('grpc.keepalive_timeout_ms', settings.YWPI_GRPC_KEEPALIVE_TIMEOUT_MS),
]


class AuthorizationInterceptor(grpc.aio.ServerInterceptor):
    def __init__(
        self,
        authenticate: t.Callable[[str | None], t.Awaitable[bool]]
    ):
        self._authenticate = authenticate

        def abort(ignored_request, context):
            context.abort(grpc.StatusCode.UNAUTHENTICATED, "Invalid API key")

        self._abort_handler = grpc.unary_unary_rpc_method_handler(abort)

    async def intercept_service(self, continuation, handler_call_details):
        api_key = None
        for name, value in handler_call_details.invocation_metadata:
            if name == "authorization":
                api_key = value
                break

        try:
            if await self._authenticate(api_key):
                return await continuation(handler_call_details)
            else:
                return self._abort_handler
        except BaseException:
            traceback.print_exc()
            return self._abort_handler


class Hub(hub_pb2_grpc.HubServicer):
    def __init__(
            self,
            agents_repository: AgentRepository = None,
            tasks_respository: TaskRepository = None
        ):
        super().__init__()
        self.agents_repository = agents_repository if agents_repository is not None else AgentRepository()
        self.tasks_respository = tasks_respository if tasks_respository is not None else TaskRepository()

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

    async def PushTask(self, request: hub_pb2.PushTaskRequest, context: grpc.ServicerContext):
        logger.info(f'Perform task creation for agent "{request.agent_id}"')
        try:
            if request.HasField("silent") and request.silent:
                raise RuntimeError("PushTask method could not be silent")

            agent = self.agents_repository.get(request.agent_id)
            task = await self.tasks_respository.add(request.agent_id, request.method, json.loads(request.params))

            response = await agent.connector.start_task(hub_models.StartTaskRequest(
                id=task.id,
                method=request.method,
                params=json.loads(request.params)
            ))
            return hub_pb2.PushTaskResponse(task_id=task.id)
        except asyncio.TimeoutError as e:
            traceback.print_exc()
            return hub_pb2.PushTaskResponse(
                error=hub_pb2.Error(type='AgentTimeoutError')
            )
        except BaseException as e:
            traceback.print_exc()
            return hub_pb2.PushTaskResponse(
                error=hub_pb2.Error(type=type(e).__name__)
            )

    async def RunTask(self, request: hub_pb2.PushTaskRequest, context: grpc.ServicerContext):
        try:
            silent = request.HasField("silent") and request.silent

            agent = self.agents_repository.get(request.agent_id)
            created_task, future = await self.tasks_respository.add_with_tracking(
                request.agent_id,
                request.method,
                json.loads(request.params),
                silent
            )

            response = await agent.connector.start_task(hub_models.StartTaskRequest(
                id=created_task.id,
                method=request.method,
                params=json.loads(request.params)
            ))

            task = await future
            if task.error is not None or task.status == "failed":
                return hub_pb2.RunTaskResponse(
                    error=hub_pb2.Error(
                        type=task.error.type,
                        traceback=task.error.traceback,
                        data=json.dumps(task.error.data)
                    )
                )

            return hub_pb2.RunTaskResponse(outputs=json.dumps(task.outputs))
        except BaseException as e:
            tb = traceback.format_exc()
            logger.warning(f"Run task error: {tb}")
            if isinstance(e, hub_models.YwpiException):
                return hub_pb2.RunTaskResponse(
                    error=hub_pb2.Error(
                        type=type(e).__name__,
                        traceback=tb,
                        data=e.data
                    )
                )

            return hub_pb2.RunTaskResponse(
                error=hub_pb2.Error(type="MethodCallError", traceback=tb)
            )

    async def GetAgentsList(self, request: hub_pb2.GetAgentsListRequest, context: grpc.ServicerContext):
        result = []
        for a in self.agents_repository.get_list():
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
        async for event in self.agents_repository.subscribe_on_updates():
            yield hub_pb2.SubscribeOnAgentsResponse(payload=json.dumps(event))

    async def execute_method(self, agent_id: str, method_name: str, inputs: dict):
        """
        Automatically move first level bytes inputs to attachments
        """
        agent = self.agents_repository.get(agent_id)

        referenced_inputs = {}
        attachments = {}
        context = { "attachments": attachments }
        for input_name, input_value in inputs.items():
            if isinstance(input_value, pydantic.BaseModel):
                serialized_input_value = input_value.model_dump(mode='json', context=context)
                referenced_inputs[input_name] = serialized_input_value
            else:
                referenced_inputs[input_name] = input_value

        created_task, future = await self.tasks_respository.add_with_tracking(agent_id, method_name, referenced_inputs)
        response = await agent.connector.start_task(hub_models.StartTaskRequest(
            id=created_task.id,
            method=method_name,
            params=referenced_inputs,
            attachments=attachments
        ))

        task = await future
        if task.error is not None or task.status == "failed":
            exception = hub_models.YwpiException.from_data(
                type=task.error.type,
                data=task.error.data,
                traceback=task.error.traceback
            )
            raise exception
        return task.outputs

    def _build_server(self):
        interceptors = []
        if type(self).authenticate is not Hub.authenticate: # Check if overridden
            interceptors.append(AuthorizationInterceptor(self.authenticate))

        server = grpc.aio.server(options=grpc_channel_options, interceptors=interceptors)
        hub_pb2_grpc.add_HubServicer_to_server(self, server)
        server.add_insecure_port("[::]:50051")
        return server

    async def run(self):
        server = self._build_server()

        await server.start()
        logger.info('Started and listening on [::]:50051')

        try:
            await repository.init()
            await server.wait_for_termination()
        except asyncio.CancelledError:
            pass
        except BaseException:
            traceback.print_exc()
            await server.stop(0)
        finally:
            await repository.close()

    @asynccontextmanager
    async def start(self):
        server = self._build_server()

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

    async def authenticate(self, api_key: str | None) -> bool:
        return True


@asynccontextmanager
async def _default_lifespan():
    yield


class HubApp(Hub):
    # Application code require
    #   - Read only access to agents repository + subscribtion + calling
    #   - Read only access to tasks repository + subscribtion
    def __init__(
        self,
        lifespan: t.AsyncContextManager | None = None,
        agents_repository: AgentRepository = None,
        tasks_respository: TaskRepository = None
    ):
        super().__init__(
            agents_repository=agents_repository,
            tasks_respository=tasks_respository
        )
        self._lifespan = lifespan if lifespan is not None else _default_lifespan

        self._callbacks: dict[
            t.Literal["agent_connected", "agent_disconnected", "task_event"], list
        ] = defaultdict(lambda: [])

    async def run(self):
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
