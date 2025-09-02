import grpc

from . import base
from ywpi import settings
from ywpi import hub_pb2
from ywpi import hub_pb2_grpc

grpc_channel: grpc.aio.Channel | None = None
hub_stub: hub_pb2_grpc.HubStub | None = None


async def _init_stub():
    global hub_stub
    global grpc_channel
    if hub_stub is None:
        grpc_channel = grpc.aio.insecure_channel(settings.YWPI_HUB_HOST)
        hub_stub = hub_pb2_grpc.HubStub(grpc_channel)


class Method(base.Method):
    async def __call__(self, *args, **kwds):
        await _init_stub()
        return self._handle_response(
            await hub_stub.RunTask(
                self._create_request(*args, **kwds)
            )
        )


async def get_methods() -> list[Method]:
    await _init_stub()
    result = []
    response: hub_pb2.GetAgentsListResponse = await hub_stub.GetAgentsList(hub_pb2.GetAgentsListRequest())

    for agent in response.agents:
        for method in agent.methods:
            result.append(Method(
                agent.id,
                method.name,
                method.inputs
            ))
    
    return result


async def get_method(agent: str, name: str) -> Method:
    await _init_stub()
    response: hub_pb2.GetAgentsListResponse = await hub_stub.GetAgentsList(hub_pb2.GetAgentsListRequest())

    for a in response.agents:
        if a.id != agent:
            continue

        for m in a.methods:
            if m.name != name:
                continue
            return Method(
                a.id,
                m.name,
                m.inputs
            )
    raise RuntimeError('Method not found')



#################################################################
import asyncio
from aiochannel import Channel
from ywpi.logger import logger
import typing as t


class Connection:
    def __init__(self,
        input_channel: t.AsyncIterable[hub_pb2.Message],
        output_channel: Channel
    ) -> None:
        self.incoming_requests: dict[str, asyncio.Future] = {}
        self.outgoings_requests: dict[str, asyncio.Future] = {}

        self.input_channel = input_channel
        self.output_channel = output_channel
        self.finish = asyncio.Future
        self.outgoings_requests_lock = asyncio.Lock()

    async def start(self):
        self._reader_task = asyncio.create_task(self._reader())

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
        logger.debug(f'[RPC] Write response MID: "{reply_to}" payload: "{payload}"')
        self.output_channel.put_nowait(
            hub_pb2.Message(
                reply_to=reply_to,
                response=hub_pb2.ResponseMessage(
                    **args
                )
            )
        )

    async def _reader(self):
        try:
            async for message in self.input_channel:
                attr = message.__getattribute__(message.WhichOneof('message'))

                if isinstance(attr, hub_pb2.ResponseMessage):
                    logger.debug(f'[RPC] Recieve response for MID: "{message.reply_to}" payload: "{attr.payload}"')
                    if message.reply_to in self.outgoings_requests:
                        self.outgoings_requests.pop(message.reply_to).set_result(attr)
                    else:
                        logger.warning(f'[RPC] Recieved unexpected response MID: "{message.reply_to}"')
                elif isinstance(attr, hub_pb2.RequestMessage):
                    logger.debug(f'[RPC] Recieve rpc "{hub_pb2.Rpc.Name(attr.rpc)}" for "{message.reply_to}" payload: "{attr.payload}"')
                    self._handle_request(message.reply_to, attr)
                else:
                    logger.warning(f'Recieved unexpected message type {type(attr)}')
        except BaseException as e:
            self.finish.set_exception(e)
        else:
            self.finish.set_exception(Exception())
        finally:
            for f in self.outgoings_requests.values():
                f.set_exception(Exception())


    async def _handle_request(self, reply_to: str, request: hub_pb2.RequestMessage):
        logger.warning('"_handle_request" method not implemented')

from ywpi import hub_models
import pydantic
import uuid
import traceback
import inspect


class MethodExecuter:
    def __init__(self):
        self._executions: Channel = Channel()

    async def _worker_loop(self):
        async for execution in self._executions:
            pass

    @staticmethod
    def _method_wrapper(
        execution_id: str,
        method: t.Callable,
        params: dict[str, t.Any],
        update_task: t.Callable[[hub_models.UpdateTaskRequest], t.Awaitable]
    ):
        final_outputs = None
        final_status = 'failed'
        try:
            staticgenerator = isinstance(method, staticmethod) and inspect.isgeneratorfunction(method.__func__)
            if inspect.isgeneratorfunction(method) or staticgenerator:
                for outputs in method(**kwargs):
                    try:
                        io_manager.handle_outputs(outputs).result()
                    except TypeError as e:
                        logger.warning(f'Outputs serializations error: {e.args}')
            else:
                final_outputs = method(**kwargs)
            final_status = 'completed'
        except BaseException as e:
            logger.warning(f'Method raise exception: {traceback.format_exc()}')
            final_status = 'failed'
        finally:
            try:
                logger.debug(f'Start cleanup steps for task "{io_manager.task_id}"')
                io_manager.update_task_status(final_status, final_outputs).result()
                executer._perform_task_cleanup(io_manager.task_id)
            except:
                logger.error(f'Task cleanup steps error: {traceback.format_exc()}')

    def execute_method(self,
        execution_id: str,
        method_name: str,
        params: dict[str, t.Any],
        update_task: t.Callable[[hub_models.UpdateTaskRequest], t.Awaitable]
    ):
        self._executions.put_nowait()


class Service(Connection):
    def __init__(self,
        input_channel: t.AsyncIterable[hub_pb2.Message],
        output_channel: Channel,
        method_executer: MethodExecuter
    ):
        super().__init__(input_channel, output_channel)
        self._method_executer = method_executer

    async def _handle_request(self, reply_to: str, request: hub_pb2.RequestMessage):
        try:
            if request.rpc == hub_pb2.Rpc.RPC_START_TASK:
                response = await self._rpc_start_task(
                    hub_models.StartTaskRequest.model_validate_json(request.payload)
                )
                await self._write_response_message(
                    reply_to,
                    response.model_dump_json(),
                )
            elif request.rpc == hub_pb2.Rpc.RPC_ABORT_TASK:
                logger.warning(f'Method {hub_pb2.Rpc.Name(request.rpc)} not implemented')
            else:
                logger.warning(f'Method {hub_pb2.Rpc.Name(request.rpc)} not implemented')
        except BaseException as e:
            traceback.print_exc()
            self._write_response_message(
                reply_to,
                error=str(e)
            )

    async def _rpc_start_task(self, payload: hub_models.StartTaskRequest) -> hub_models.StartTaskResponse:
        status = 'started'
        self._method_executer.execute_method(self.call_update_task, payload.id, payload.method, payload.params)
        return hub_models.StartTaskResponse(status=status)

    async def _rpc_update_task(self, payload: hub_models.UpdateTaskRequest) -> hub_models.UpdateTaskResponse:
        """
        Hub can update task status (task abort) & inputs (streaming)
        """
        raise NotImplementedError()

    async def call(self, rpc: hub_pb2.Rpc, payload: pydantic.BaseModel) -> asyncio.Future[hub_pb2.ResponseMessage]:
        reply_to = str(uuid.uuid4())
        # logger.debug(f'[RPC] call (start): "{hub_pb2.Rpc.Name(rpc)}" MID: "{reply_to}" payload: "{payload}"')
        future = asyncio.Future()
        with self.outgoings_requests_lock: # Lock does bot required
            self.outgoings_requests[reply_to] = future
        await self._write_request_message(rpc, payload, reply_to)
        logger.debug(f'[RPC] call: "{hub_pb2.Rpc.Name(rpc)}" MID: "{reply_to}" payload: "{payload}"')
        return future

    async def call_register_agent(self, payload: hub_models.RegisterAgentRequest):
        return await self.call(hub_pb2.Rpc.RPC_REGISTER_AGENT, payload.model_dump_json())

    async def call_update_task(self, payload: hub_models.UpdateTaskRequest):
        return await self.call(hub_pb2.Rpc.RPC_UPDATE_TASK, payload.model_dump_json())
