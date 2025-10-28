import asyncio
import uuid
import typing as t
import traceback

import aiochannel

from ywpi_hub import hub_pb2, hub_models
from ywpi_hub.logger import logger
from ywpi_hub.tasks_respository import TaskRepository
from ywpi_hub.agents_repository import AgentRepository


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

    async def _write_request_message(self, rpc: hub_pb2.Rpc, payload: str, reply_to: str, attachments: t.MutableMapping[str, bytes] = {}):
        self.output_channel.put_nowait(
            hub_pb2.Message(
                reply_to=reply_to,
                request=hub_pb2.RequestMessage(
                    rpc=rpc,
                    payload=payload
                ),
                attachments=attachments
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
        try:
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
        except:
            traceback.print_exc()

    async def call(self, rpc: hub_pb2.Rpc, payload: str, attachments: t.MutableMapping[str, bytes] = {}) -> hub_pb2.ResponseMessage:
        reply_to = str(uuid.uuid4())
        future = asyncio.Future()
        self._outgoings_requests[reply_to] = future
        logger.debug(f'Call rpc "{hub_pb2.Rpc.Name(rpc)}"')
        await self._write_request_message(rpc, payload, reply_to, attachments)
        try:
            return await asyncio.wait_for(future, timeout=10.0)
        finally:
            # TODO: Remove future from `_outgoings_requests`
            logger.debug(f'Rpc "{hub_pb2.Rpc.Name(rpc)}" finished')

    async def close(self):
        self._reader_task.cancel()


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
            await self._tasks_repository.update_status(payload.id, payload.status, payload.error)

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

        attachments = payload.attachments
        payload.attachments = {}

        response = await self._connection.call(hub_pb2.Rpc.RPC_START_TASK, payload.model_dump_json(), attachments)
        if response.HasField('error'):
            raise Exception(response.error)

        return hub_models.StartTaskResponse.model_validate_json(response.payload)

    async def close(self):
        await self._agents_repository.remove(self._agent_description.id)
