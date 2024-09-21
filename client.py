import warnings
warnings.simplefilter("ignore", UserWarning)
import threading
import time
from concurrent import futures
import uuid

import grpc
import pydantic

import hub_pb2
import hub_pb2_grpc
import models
from logger import logger

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
                print('Stop channel')
                raise StopIteration()
            return self.messages.pop(0)


class TaskManager:
    def __init__(self) -> None:
        self.tasks = []
    
    def push_task():
        thr = threading.Thread()


class Exchanger:
    def __init__(self, input_channel, agent_id = None) -> None:
        self.agent_id = agent_id
        self.incoming_requests: dict[str, futures.Future] = {}
        self.outgoings_requests: dict[str, futures.Future] = {}

        self.input_channel = input_channel
        self.output_channel = Channel()
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

    def _write_response_message(self, payload: str, reply_to: str):
        self.output_channel.push(
            hub_pb2.Message(
                reply_to=reply_to,
                response=hub_pb2.ResponseMessage(
                    payload=payload
                )
            )
        )

    def handle_request(self, request: hub_pb2.RequestMessage):
        if request.rpc == hub_pb2.Rpc.RPC_START_TASK:
            pass
        elif request.rpc == hub_pb2.Rpc.RPC_ABORT_TASK:
            logger.warning(f'Method {hub_pb2.Rpc.Name(request.rpc)} not implemented')
        else:
            logger.warning(f'Method {hub_pb2.Rpc.Name(request.rpc)} not implemented')

    def _reader(self):
        try:
            for message in self.input_channel:
                # Bug in aiochannel pkg: `def __aiter__(self) -> "Channel":` no type
                message: hub_pb2.Message
                attr = message.__getattribute__(message.WhichOneof('message'))

                if isinstance(attr, hub_pb2.ResponseMessage):
                    if message.reply_to in self.outgoings_requests:
                        self.outgoings_requests.pop(message.reply_to).set_result()
                    else:
                        logger.warning(f'[Agent={self.agent_id}] Recieved unexpected message {message.reply_to}')
                elif isinstance(attr, hub_pb2.RequestMessage):
                    logger.info(f'[Agent={self.agent_id}] Recieve rpc "{hub_pb2.Rpc.Name(attr.rpc)}"')
                    # Some work
                    # time.sleep(2)
                    self._write_response_message('{ "key": "client-response" }', message.reply_to)
                    self.run_method()
                else:
                    logger.warning(f'Recieved unexpected message type {type(attr)}')
        finally:
            self.output_channel.close()

    async def call(self, method: str, message: pydantic.BaseModel):
        id = str(uuid.uuid4())
        future = futures.Future()
        self.outgoings_requests[id] = future
        self._write_request_message(method, message, id)
        return future

    def predict(self):
        for i in range(2):
            time.sleep(1)
            self._write_request_message(hub_pb2.Rpc.RPC_UPDATE_TASK, '{}', reply_to='')

    def run_method(self):
        thr = threading.Thread(target=self.predict)
        thr.start()

    def set_start_task_callback(self, callback):
        pass

    def set_abort_task_callback(self, callback):
        pass


class Service:
    def __init__(self, exchanger: Exchanger) -> None:
        self.exchanger = exchanger
        self.methods = []

    def run_method():
        pass

import sys

def get_agent_id():
    if len(sys.argv) > 1:
        return sys.argv[1]
    return 'a-1'

def chat():
    with grpc.insecure_channel('localhost:50051') as grpc_channel:
        greeter_stub = hub_pb2_grpc.HubStub(grpc_channel)
        channel = Channel()
        response_iterator = greeter_stub.Connect(iter(channel))

        hello_message = models.HelloMessage(
            id=get_agent_id(),
            methods=['predict']
        )
        channel.push(
            hub_pb2.Message(
                reply_to='undefined',
                request=hub_pb2.RequestMessage(
                    rpc=hub_pb2.Rpc.RPC_HELLO_AGENT,
                    payload=hello_message.model_dump_json()
                )
            )
        )
        logger.info('Connected to hub localhost:50051')

        exchanger = Exchanger(response_iterator)
        for message in exchanger.output_channel:
            channel.push(message)
        channel.close()

chat()
