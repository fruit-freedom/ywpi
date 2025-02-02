import warnings
warnings.simplefilter("ignore", UserWarning)

import threading
from concurrent import futures
import inspect
import sys
import typing
import uuid
import inspect

import grpc
import pydantic

from . import hub_pb2
from . import hub_pb2_grpc
from . import hub_models
from .logger import logger
from . import settings
from ywpi import Spec, MethodDescription, RegisteredMethod, REGISTERED_METHODS
from ywpi.handle_args import handle_args, InputTyping
from ywpi.serialization import handle_outputs

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
class ServiceServer:
    def __init__(self, agent_cls, exchanger: 'Exchanger' = None) -> None:
        self.agent_cls = agent_cls
        self.thread_pool = futures.ThreadPoolExecutor(max_workers=1)

        self.methods: list[models.Method] = []
        self.calls: dict[str, typing.Callable] = {}
        self.exchanger = exchanger

        for name, description in self.agent_cls.__dict__[Spec.CLASS_API_METHODS.value].items():
            description: MethodDescription
            self.methods.append(hub_models.Method(
                name=name,
                inputs=[
                    hub_models.InputDescription(name=param.name, type=ServiceServer.TYPE_TO_YWPI[param.annotation])
                    for param in description.parameters
                ]
            ))
            self.calls[name] = self.agent_cls.__dict__[name]

    @staticmethod
    def _method_wrapper(task_id: str, exchanger: 'Exchanger', method, **kwargs):
        try:
            staticgenerator = isinstance(method, staticmethod) and inspect.isgeneratorfunction(method.__func__)
            if inspect.isgeneratorfunction(method) or staticgenerator:
                for outputs in method(**kwargs):
                    exchanger.call_update_task(hub_models.UpdateTaskRequest(id=task_id, outputs=outputs))
            else:
                method(**kwargs)
                status = 'completed'
        except BaseException as e:
            import traceback
            print(traceback.format_exc())
            logger.warning('method raise exception')
            status = 'failed'
        finally:
            exchanger.call_update_task(hub_models.UpdateTaskRequest(id=task_id, status=status))

    def call_method(self, exchanger: 'Exchanger', task_id: str, method: str, params: dict[str, typing.Any]):
        self.thread_pool.submit(ServiceServer._method_wrapper, task_id, exchanger, self.calls[method], **params)

    TYPE_TO_YWPI = {
        int: 'int',
        str: 'str',
        float: 'float'
    }


class SimpleMethodExecuter:
    def __init__(self, registered_methods: dict[str, RegisteredMethod]) -> None:
        self.thread_pool = futures.ThreadPoolExecutor(max_workers=1)

        self.calls: dict[str, typing.Callable] = {}
        self.methods: list[hub_models.Method] = []
        self.method_input_dicts: dict[str, dict[str, InputTyping]] = {}

        for name, registered_method in registered_methods.items():
            self.methods.append(hub_models.Method(
                name=name,
                inputs=[
                    hub_models.InputDescription(name=input_name, type=input.name)
                    for input_name, input in registered_method.inputs.items()
                ],
                outputs=[
                    hub_models.Field(name=output_name, type=output.name)
                    for output_name, output in registered_method.outputs.items()
                ],
                description=registered_method.description
            ))
            self.calls[name] = registered_method.fn
            self.method_input_dicts[name] = registered_method.inputs

    @staticmethod
    def _method_wrapper(
        task_id: str,
        exchanger: 'Exchanger',
        method,
        inputs,
        inputs_dict
    ):
        try:
            kwargs = handle_args(inputs, inputs_dict)
            staticgenerator = isinstance(method, staticmethod) and inspect.isgeneratorfunction(method.__func__)
            if inspect.isgeneratorfunction(method) or staticgenerator:
                for outputs in method(**kwargs):
                    try:
                        exchanger.call_update_task(
                            hub_models.UpdateTaskRequest(id=task_id, outputs=handle_outputs(outputs))
                        )
                    except TypeError as e:
                        logger.warning(f'Outputs serializations error: {e.args}')
            else:
                outputs = method(**kwargs)
                if outputs is not None:
                    # TODO: Join update status & update outputs events 
                    exchanger.call_update_task(hub_models.UpdateTaskRequest(id=task_id, outputs=handle_outputs(outputs)))
            status = 'completed'
        except BaseException as e:
            import traceback
            print(traceback.format_exc())
            logger.warning('method raise exception')
            status = 'failed'
        finally:
            exchanger.call_update_task(hub_models.UpdateTaskRequest(id=task_id, status=status))

    def call_method(self, exchanger: 'Exchanger', task_id: str, method: str, inputs: dict[str, typing.Any]):
        exchanger.call_update_task(hub_models.UpdateTaskRequest(id=task_id, status='started'))
        self.thread_pool.submit(
            SimpleMethodExecuter._method_wrapper,
            task_id,
            exchanger,
            self.calls[method],
            inputs,
            self.method_input_dicts[method]
        )


# Communication level
class Exchanger:
    def __init__(self, input_channel, output_channel: Channel, service: 'ServiceServer', agent_id = None) -> None:
        self.agent_id = agent_id
        self.incoming_requests: dict[str, futures.Future] = {}
        self.outgoings_requests: dict[str, futures.Future] = {}

        self.input_channel = input_channel
        self.output_channel = output_channel
        self.finish = futures.Future()
        self.outgoings_requests_lock = threading.Lock()
        self.service = service
        self.thr = threading.Thread(target=self._reader)
        self.thr.start()

    def _write_request_message(self, rpc: hub_pb2.Rpc, payload: str, reply_to: str):
        self.output_channel.push(
            hub_pb2.Message(
                reply_to=reply_to,
                request=hub_pb2.RequestMessage(
                    rpc=rpc,
                    payload=payload
                )
            )
        )

    def _write_response_message(
            self,
            reply_to: str,
            payload: str | None = None,
            error: str | None = 'undefined'
        ):
        args = { 'payload': payload } if payload else { 'error': error }
        self.output_channel.push(
            hub_pb2.Message(
                reply_to=reply_to,
                response=hub_pb2.ResponseMessage(
                    **args
                )
            )
        )

    def _rpc_start_task(self, payload: hub_models.StartTaskRequest) -> hub_models.StartTaskResponse:
        status = 'failed'
        self.service.call_method(self, payload.id, payload.method, payload.params)
        return hub_models.StartTaskResponse(status=status)

    def _handle_request(self, reply_to: str, request: hub_pb2.RequestMessage):
        try:
            if request.rpc == hub_pb2.Rpc.RPC_START_TASK:
                response = self._rpc_start_task(
                    hub_models.StartTaskRequest.model_validate_json(request.payload)
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
            self._write_response_message(
                reply_to,
                error=str(e)
            )

    def _reader(self):
        try:
            for message in self.input_channel:
                # Bug in aiochannel pkg: `def __aiter__(self) -> "Channel":` no type
                message: hub_pb2.Message
                attr = message.__getattribute__(message.WhichOneof('message'))

                if isinstance(attr, hub_pb2.ResponseMessage):
                    if message.reply_to in self.outgoings_requests:
                        with self.outgoings_requests_lock:
                            self.outgoings_requests.pop(message.reply_to).set_result(attr)
                    else:
                        logger.warning(f'[Agent={self.agent_id}] Recieved unexpected message {message.reply_to}')
                elif isinstance(attr, hub_pb2.RequestMessage):
                    logger.info(f'[Agent={self.agent_id}] Recieve rpc "{hub_pb2.Rpc.Name(attr.rpc)}"')
                    self._handle_request(message.reply_to, attr)
                else:
                    logger.warning(f'Recieved unexpected message type {type(attr)}')
        except BaseException as e:
            self.finish.set_exception(e)
        else:
            self.finish.set_exception(Exception())
        finally:
            with self.outgoings_requests_lock:
                [ f.set_exception(Exception()) for f in self.outgoings_requests.values() ]

    def call(self, rpc: hub_pb2.Rpc, payload: pydantic.BaseModel) -> futures.Future[hub_pb2.ResponseMessage]:
        reply_to = str(uuid.uuid4())
        future = futures.Future()
        with self.outgoings_requests_lock:
            self.outgoings_requests[reply_to] = future
        self._write_request_message(rpc, payload, reply_to)
        return future

    def call_register_agent(self, payload: hub_models.RegisterAgentRequest):
        return self.call(hub_pb2.Rpc.RPC_REGISTER_AGENT, payload.model_dump_json())

    def call_update_task(self, payload: hub_models.UpdateTaskRequest):
        return self.call(hub_pb2.Rpc.RPC_UPDATE_TASK, payload.model_dump_json())


def get_agent_id():
    if len(sys.argv) > 1:
        return sys.argv[1]
    return 'a-1'


def serve_class(cls):
    service = ServiceServer(cls)
    with grpc.insecure_channel(settings.YWPI_HUB_HOST) as grpc_channel:
        greeter_stub = hub_pb2_grpc.HubStub(grpc_channel)
        output_channel = Channel()
        response_iterator = greeter_stub.Connect(iter(output_channel))

        hello_message = hub_models.RegisterAgentRequest(
            id=get_agent_id(),
            name=cls.__name__,
            methods=service.methods
        )

        try:
            exchanger = Exchanger(response_iterator, output_channel, service)
            result = exchanger.call_register_agent(hello_message)
            good = result.result()
            if good.HasField('error'):
                logger.error(f'Agent register failed: {good.error}')
                raise Exception()

            logger.info('Connected to hub localhost:50051')
            exchanger.finish.result()
        except KeyboardInterrupt:
            pass
        finally:
            output_channel.close()



def serve(
    id: str = None,
    name: str = 'Untitled',
    description: str = 'No description provided',
    project: str = settings.YWPI_PROJECT_NAME,
):
    service = SimpleMethodExecuter(REGISTERED_METHODS)
    with grpc.insecure_channel(settings.YWPI_HUB_HOST) as grpc_channel:
        greeter_stub = hub_pb2_grpc.HubStub(grpc_channel)
        output_channel = Channel()
        response_iterator = greeter_stub.Connect(iter(output_channel))

        hello_message = hub_models.RegisterAgentRequest(
            id=id if id is not None else get_agent_id(),
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
            exchanger.finish.result()
        except KeyboardInterrupt:
            pass
        finally:
            output_channel.close()






