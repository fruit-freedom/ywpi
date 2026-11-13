import warnings
warnings.simplefilter("ignore", UserWarning)

import threading
from concurrent import futures
from contextlib import nullcontext
import inspect
import typing
import uuid
import inspect
import traceback

import grpc
import pydantic

from . import hub_pb2
from . import hub_pb2_grpc
from . import hub_models
from .logger import logger
from . import settings
from ywpi import RegisteredMethod, REGISTERED_METHODS
from ywpi.handle_args import InputTyping
from ywpi.handle_args import Type as PythonType
from .io_manager import IOManager
from .method_schemes import get_function_schema
from ywpi.exceptions import get_exception_serialization_model


class Channel:
    def __init__(self):
        self.lock = threading.Lock()
        self.condition = threading.Condition(lock=self.lock)
        self.messages = []
        self.running = True

    def push(self, message):
        with self.condition:
            self.messages.append(message)
            self.condition.notify_all()

    def close(self):
        self.running = False
        with self.condition:
            self.condition.notify_all()

    def __iter__(self):
        return self

    def __next__(self):
        with self.condition:
            while not self.messages and self.running:
                self.condition.wait()
            if not self.running:
                raise StopIteration()
            return self.messages.pop(0)


# Service level
# class ServiceServer:
#     def __init__(self, agent_cls, exchanger: 'Exchanger' = None) -> None:
#         self.agent_cls = agent_cls
#         self.thread_pool = futures.ThreadPoolExecutor(max_workers=1)

#         self.methods: list[models.Method] = []
#         self.calls: dict[str, typing.Callable] = {}
#         self.exchanger = exchanger

#         for name, description in self.agent_cls.__dict__[Spec.CLASS_API_METHODS.value].items():
#             description: MethodDescription
#             self.methods.append(hub_models.Method(
#                 name=name,
#                 inputs=[
#                     hub_models.InputDescription(name=param.name, type=ServiceServer.TYPE_TO_YWPI[param.annotation])
#                     for param in description.parameters
#                 ]
#             ))
#             self.calls[name] = self.agent_cls.__dict__[name]

#     @staticmethod
#     def _method_wrapper(task_id: str, exchanger: 'Exchanger', method, **kwargs):
#         try:
#             staticgenerator = isinstance(method, staticmethod) and inspect.isgeneratorfunction(method.__func__)
#             if inspect.isgeneratorfunction(method) or staticgenerator:
#                 for outputs in method(**kwargs):
#                     exchanger.call_update_task(hub_models.UpdateTaskRequest(id=task_id, outputs=outputs))
#             else:
#                 method(**kwargs)
#                 status = 'completed'
#         except BaseException as e:
#             import traceback
#             print(traceback.format_exc())
#             logger.warning('method raise exception')
#             status = 'failed'
#         finally:
#             exchanger.call_update_task(hub_models.UpdateTaskRequest(id=task_id, status=status))

#     def call_method(self, exchanger: 'Exchanger', task_id: str, method: str, params: dict[str, typing.Any]):
#         self.thread_pool.submit(ServiceServer._method_wrapper, task_id, exchanger, self.calls[method], **params)

#     TYPE_TO_YWPI = {
#         int: 'int',
#         str: 'str',
#         float: 'float'
#     }


class SimpleMethodExecuter:
    @staticmethod
    def _to_hub_type(type_: PythonType) -> hub_models.Type:
        return hub_models.Type(
            name=type_.name,
            args=[
                SimpleMethodExecuter._to_hub_type(argument)
                for argument in (type_.args or [])
            ],
        )

    def __init__(self, registered_methods: dict[str, RegisteredMethod]) -> None:
        self.thread_pool = futures.ThreadPoolExecutor(max_workers=1)

        self.calls: dict[str, typing.Callable] = {}
        self.methods: list[hub_models.Method] = []
        self.method_input_dicts: dict[str, dict[str, InputTyping]] = {}

        # TaskID -> IOManager
        self._io_managers: dict[str, IOManager] = {}
        self._io_managers_lock = threading.Lock()

        for name, registered_method in registered_methods.items():
            self.methods.append(hub_models.Method(
                name=name,
                inputs=[
                    # hub_models.InputDescription(name=input_name, type=input.name)
                    # for input_name, input in registered_method.inputs.items()
                    hub_models.Field(
                        name=input_name,
                        type=self._to_hub_type(
                            PythonType(
                                name=input.name,
                                tp=input.source_tp,
                                args=input.args,
                            )
                        ),
                        description=input.description
                    )
                    for input_name, input in registered_method.inputs.items()
                ],
                outputs=[
                    hub_models.Field(
                        name=output_name,
                        type=self._to_hub_type(output)
                    )
                    for output_name, output in registered_method.outputs.items()
                ],
                description=registered_method.description,
                labels=list(map(lambda e: hub_models.Label(name=e), registered_method.labels)) if registered_method.labels else None,
                openai_schema=get_function_schema(registered_method.fn),
            ))
            self.calls[name] = registered_method.fn
            self.method_input_dicts[name] = registered_method.inputs

    def _perform_task_cleanup(self, task_id: str):
        logger.debug(f'Perform cleaup for task "{task_id}"')
        with self._io_managers_lock:
            self._io_managers.pop(task_id, None)

    @staticmethod
    def _method_wrapper(
        io_manager: IOManager,
        executer: 'SimpleMethodExecuter',
        method,
        kwargs
    ):
        final_outputs = None
        final_status = 'failed'
        error = None
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
            # TODO: Move handling to distinct static method
            tb = traceback.format_exc()
            logger.warning(f"Method raise exception: {tb}")
            data = None
            try:
                serialization_model = get_exception_serialization_model(e)
                data = (
                    serialization_model
                    .model_validate(e, from_attributes=True)
                    .model_dump(mode='json')
                ) if serialization_model is not None else None
            except:
                logger.warning(f"Error while serializing error: {traceback.format_exc()}")

            error = hub_models.Error(
                type="MethodExecutionError",
                traceback=tb,
                data={
                    "source_exception_type": type(e).__name__,
                    "data": data
                }
            )
            final_status = "failed"
        finally:
            try:
                logger.debug(f'Start cleanup steps for task "{io_manager.task_id}"')
                io_manager.update_task_status(final_status, final_outputs, error=error).result()
                executer._perform_task_cleanup(io_manager.task_id)
            except:
                logger.error(f'Task cleanup steps error: {traceback.format_exc()}')

    def update_task_inputs(self, task_id: str, inputs: dict):
        with self._io_managers_lock:
            if task_id in self._io_managers:
                self._io_managers[task_id].update_inputs(inputs)
            else:
                logger.warning(f'Task "{task_id}" does not has io manager and could not be updated')

    def call_method(
        self,
        exchanger: 'Exchanger',
        task_id: str,
        method: str,
        inputs: dict[str, typing.Any],
        attachments: typing.MutableMapping[str, dict]
    ):
        # exchanger.call_update_task(hub_models.UpdateTaskRequest(id=task_id, status='started'))
        io_manager = IOManager(task_id, self.method_input_dicts[method], exchanger)

        # TODO: Move `handle_inputs` call to `_method_wrapper`
        # WHY: `handle_inputs` sometimes could perform long running job during convertation like file downloading
        params = io_manager.handle_inputs(inputs, attachments)

        return self.thread_pool.submit(
            SimpleMethodExecuter._method_wrapper,
            io_manager,
            self,
            self.calls[method],
            params
        )


# Communication level
class Exchanger:
    def __init__(self, input_channel, output_channel: Channel, service: 'SimpleMethodExecuter', agent_id = None) -> None:
        self.agent_id = agent_id
        self.incoming_requests: dict[str, futures.Future] = {}
        self.outgoings_requests: dict[str, futures.Future] = {}
        # Requests initiated by the agent against the hub.  The initial
        # RPC_START_TASK response contains only the task id; the actual
        # result is delivered later as RPC_UPDATE_TASK.
        self.hub_task_results: dict[str, futures.Future] = {}
        self.hub_task_updates: dict[str, hub_models.UpdateTaskRequest] = {}
        self.hub_task_lock = threading.Lock()

        self.input_channel = input_channel
        self.output_channel = output_channel
        self.finish = futures.Future()
        self.outgoings_requests_lock = threading.Lock()
        self.service = service
        self.thr = threading.Thread(target=self._reader)
        self.thr.start()

    def _write_request_message(
        self,
        rpc: hub_pb2.Rpc,
        payload: str,
        reply_to: str,
        attachments: typing.MutableMapping[str, bytes] | None = None,
    ):
        self.output_channel.push(
            hub_pb2.Message(
                reply_to=reply_to,
                request=hub_pb2.RequestMessage(
                    rpc=rpc,
                    payload=payload
                ),
                attachments=attachments or {},
            )
        )

    def _write_response_message(
        self,
        reply_to: str,
        payload: str | None = None,
        error: str | None = 'undefined'
    ):
        args = { 'payload': payload } if payload else { 'error': error }
        logger.debug(f'[RPC] Write response MID: "{reply_to}" payload: "{payload}"')
        self.output_channel.push(
            hub_pb2.Message(
                reply_to=reply_to,
                response=hub_pb2.ResponseMessage(
                    **args
                )
            )
        )

    def _rpc_start_task(self, payload: hub_models.StartTaskRequest) -> hub_models.StartTaskResponse:
        status = 'started'
        self.service.call_method(self, payload.id, payload.method, payload.params, payload.attachments)
        return hub_models.StartTaskResponse(status=status)

    def _rpc_update_task(self, payload: hub_models.UpdateTaskRequest) -> hub_models.UpdateTaskResponse:
        """
        Handle a result of a task started by the agent on the hub.

        RPC_UPDATE_TASK is used in both directions.  Updates for tasks
        created by the hub are handled by IOManager; updates for tasks
        created by the agent are completed here.
        """
        with self.hub_task_lock:
            result = self.hub_task_results.get(payload.id)
            if result is None:
                # The hub may send the update immediately after the start
                # response.  Keep it until execute_hub_method registers the
                # future for the returned task id.
                self.hub_task_updates[payload.id] = payload
            elif not result.done():
                result.set_result(payload)

        return hub_models.UpdateTaskResponse()

    def _handle_request(self, reply_to: str, request: hub_pb2.RequestMessage, attachments: typing.MutableMapping[str, bytes]):
        try:
            if request.rpc == hub_pb2.Rpc.RPC_START_TASK:
                model_request = hub_models.StartTaskRequest.model_validate_json(request.payload)
                model_request.attachments = attachments
                response = self._rpc_start_task(model_request)
                self._write_response_message(
                    reply_to,
                    response.model_dump_json(),
                )
            elif request.rpc == hub_pb2.Rpc.RPC_UPDATE_TASK:
                response = self._rpc_update_task(
                    hub_models.UpdateTaskRequest.model_validate_json(request.payload)
                )
                self._write_response_message(
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

    def _reader(self):
        error = None
        try:
            for message in self.input_channel:
                # Bug in aiochannel pkg: `def __aiter__(self) -> "Channel":` no type
                message: hub_pb2.Message
                attr = message.__getattribute__(message.WhichOneof('message'))

                if isinstance(attr, hub_pb2.ResponseMessage):
                    logger.debug(f'[RPC] Recieve response for MID: "{message.reply_to}" payload: "{attr.payload}"')
                    if message.reply_to in self.outgoings_requests:
                        with self.outgoings_requests_lock:
                            self.outgoings_requests.pop(message.reply_to).set_result(attr)
                    else:
                        logger.warning(f'[RPC] Recieved unexpected response MID: "{message.reply_to}"')
                elif isinstance(attr, hub_pb2.RequestMessage):
                    logger.debug(f'[RPC] Recieve rpc "{hub_pb2.Rpc.Name(attr.rpc)}" for "{message.reply_to}" payload: "{attr.payload}"')
                    self._handle_request(message.reply_to, attr, message.attachments)
                else:
                    logger.warning(f'Recieved unexpected message type {type(attr)}')
        except BaseException as e:
            error = e
            self.finish.set_exception(e)
        else:
            error = RuntimeError("hub connection broken")
            self.finish.set_exception(error)
        finally:
            with self.outgoings_requests_lock:
                [ f.set_exception(error) for f in self.outgoings_requests.values() ]
            with self.hub_task_lock:
                [ f.set_exception(error) for f in self.hub_task_results.values() if not f.done() ]

    def call(
        self,
        rpc: hub_pb2.Rpc,
        payload: pydantic.BaseModel,
        attachments: typing.MutableMapping[str, bytes] | None = None,
    ) -> futures.Future[hub_pb2.ResponseMessage]:
        reply_to = str(uuid.uuid4())
        logger.debug(f'[RPC] call (start): "{hub_pb2.Rpc.Name(rpc)}" MID: "{reply_to}" payload: "{payload}"')
        future = futures.Future()
        with self.outgoings_requests_lock:
            self.outgoings_requests[reply_to] = future
        self._write_request_message(rpc, payload, reply_to, attachments=attachments)
        logger.debug(f'[RPC] call: "{hub_pb2.Rpc.Name(rpc)}" MID: "{reply_to}" payload: "{payload}"')
        return future

    def call_register_agent(self, payload: hub_models.RegisterAgentRequest):
        return self.call(hub_pb2.Rpc.RPC_REGISTER_AGENT, payload.model_dump_json())

    def call_update_task(
        self,
        payload: hub_models.UpdateTaskRequest,
        attachments: typing.MutableMapping[str, bytes] | None = None,
    ):
        return self.call(
            hub_pb2.Rpc.RPC_UPDATE_TASK,
            payload.model_dump_json(),
            attachments=attachments,
        )

    def execute_hub_method(self, method_name: str, inputs: dict) -> dict:
        """Synchronously execute a method registered on the hub."""
        start_response = self.call(
            hub_pb2.Rpc.RPC_START_TASK,
            hub_models.StartTaskRequest(
                id='',
                method=method_name,
                params=inputs,
            ).model_dump_json(),
        ).result()

        if start_response.HasField('error'):
            raise hub_models.MethodCallError(start_response.error)

        start_task = hub_models.StartTaskResponse.model_validate_json(start_response.payload)
        if start_task.task_id is None:
            raise hub_models.MethodCallError(
                'Hub did not return a task id for RPC_START_TASK'
            )

        result = futures.Future()
        with self.hub_task_lock:
            self.hub_task_results[start_task.task_id] = result
            early_update = self.hub_task_updates.pop(start_task.task_id, None)
            if early_update is not None:
                result.set_result(early_update)

        try:
            update = result.result(timeout=10.0)
        finally:
            with self.hub_task_lock:
                self.hub_task_results.pop(start_task.task_id, None)
                self.hub_task_updates.pop(start_task.task_id, None)

        if update.status == 'failed':
            error = update.error
            raise hub_models.YwpiException.from_data(
                type=error.type if error is not None else 'MethodCallError',
                data=error.data if error is not None else None,
                traceback=error.traceback if error is not None else None,
            )

        return update.outputs or {}


class Hub:
    """Synchronous client for methods exposed by the connected hub."""

    def __init__(self, exchanger: Exchanger):
        self._exchanger = exchanger

    def execute_hub_method(self, method_name: str, inputs: dict) -> dict:
        return self._exchanger.execute_hub_method(method_name, inputs)



grpc_channel_options = [
    ('grpc.max_send_message_length', settings.YWPI_GRPC_MAX_MESSAGE_SIZE),
    ('grpc.max_receive_message_length', settings.YWPI_GRPC_MAX_MESSAGE_SIZE),
    ('grpc.keepalive_time_ms', settings.YWPI_GRPC_KEEPALIVE_TIME_MS),
    ('grpc.keepalive_timeout_ms', settings.YWPI_GRPC_KEEPALIVE_TIMEOUT_MS),
]


def serve(
    id: str,
    name: str = 'Untitled',
    description: str = 'No description provided',
    project: str = settings.YWPI_PROJECT_NAME,
    ssl: bool = False,
    api_key: str = None,
    lifespan: typing.Callable[[Hub], typing.ContextManager] = None,
):
    """
    Authorization source priority:
        - passing `api_key`
        - setting `YWPI_API_KEY` environment variable
    """
    service = SimpleMethodExecuter(REGISTERED_METHODS)

    if ssl:
        grpc_credentials = grpc.ssl_channel_credentials()
        grpc_channel = grpc.secure_channel(settings.YWPI_HUB_HOST, grpc_credentials, options=grpc_channel_options)
    else:
        grpc_channel = grpc.insecure_channel(settings.YWPI_HUB_HOST, options=grpc_channel_options)

    metadata = []
    if api_key is not None:
        metadata.append(('authorization', api_key))
    elif settings.YWPI_API_KEY is not None:
        metadata.append(('authorization', settings.YWPI_API_KEY))

    with grpc_channel as open_channel:
        greeter_stub = hub_pb2_grpc.HubStub(open_channel)
        output_channel = Channel()
        response_iterator = greeter_stub.Connect(iter(output_channel), metadata=metadata)

        hello_message = hub_models.RegisterAgentRequest(
            id=id,
            name=name,
            project=project,
            description=description,
            methods=service.methods,
        )

        try:
            exchanger = Exchanger(response_iterator, output_channel, service)
            result = exchanger.call_register_agent(hello_message)
            good = result.result()
            if good.HasField('error'):
                logger.error(f'Agent register failed: {good.error}')
                raise Exception()

            logger.info(f'Connected to hub {settings.YWPI_HUB_HOST}')
            hub = Hub(exchanger)
            with (lifespan(hub) if lifespan is not None else nullcontext()):
                exchanger.finish.result()
        except KeyboardInterrupt:
            pass
        except BaseException as e:
            print(e)
        finally:
            output_channel.close()


def serve_with_reconnecting(*args, **kwargs):
    import time
    sleep_time = 1
    running_time = 0
    while True:
        try:
            start = time.time()
            serve(*args, **kwargs)
        except KeyboardInterrupt:
            return
        except BaseException as e:
            running_time = time.time() - start

        if running_time > 10:
            sleep_time = 1
        else:
            sleep_time = min(sleep_time * 2, 20)
        logger.warning(f'Connection broken. Try to reconnect after {sleep_time}')
        time.sleep(sleep_time)
        logger.info("Reconnecting ...")


def track(fn):
    def decorated(*args, **kwargs):
        with grpc.insecure_channel(settings.YWPI_HUB_HOST, options=grpc_channel_options) as grpc_channel:
            greeter_stub = hub_pb2_grpc.HubStub(grpc_channel)
            output_channel = Channel()
            response_iterator = greeter_stub.Connect(iter(output_channel))

            hello_message = hub_models.RegisterAgentRequest(
                id='id',
                name='name',
                project='project',
                description='description',
                methods=[],
            )

            try:
                exchanger = Exchanger(response_iterator, output_channel, None)
                result = exchanger.call_register_agent(hello_message)
                good = result.result()
                if good.HasField('error'):
                    logger.error(f'Agent register failed: {good.error}')
                    raise Exception()

                logger.info(f'Connected to hub {settings.YWPI_HUB_HOST}')

                task = exchanger.call(
                    hub_pb2.Rpc.RPC_START_TASK,
                    hub_models.StartTaskRequest(
                        id='',
                        method='test',
                        params={}
                    ).model_dump_json()
                )
                task = hub_models.StartTrackinTaskResponse.model_validate_json(task.result().payload)

                io_manager = IOManager(task.id, None, exchanger)
                SimpleMethodExecuter._method_wrapper(io_manager, None, fn, kwargs)

                # exchanger.finish.result()
            except KeyboardInterrupt:
                pass
            finally:
                output_channel.close()

    return decorated
