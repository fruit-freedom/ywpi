import threading
import time

import grpc

import hub_pb2
import hub_pb2_grpc

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

def writer(channel: Channel):
    print('Writer')
    for i in range(3):
        time.sleep(1)
        channel.push(hub_pb2.Message(payload=f'Message {i}'))
    channel.close()

def chat():
    with grpc.insecure_channel('localhost:50051') as channel:
        greeter_stub = hub_pb2_grpc.GreeterStub(channel)

        channel = Channel()
        thr = threading.Thread(target=writer, args=(channel,))
        thr.start()

        response_iterator = greeter_stub.Chat(iter(channel))
        for response in response_iterator:
            response: hub_pb2.Message
            print(response)

        thr.join()


chat()
