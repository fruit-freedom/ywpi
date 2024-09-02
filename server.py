from concurrent import futures

import grpc

import hub_pb2_grpc
import hub_pb2

class Greeter(hub_pb2_grpc.GreeterServicer):
    def Chat(self, request_iterator, context: grpc.ServicerContext):
        for request in request_iterator:
            request: hub_pb2.Message
            print(request.payload)
            yield hub_pb2.Message(payload='{}')
        print('Session closed')

def serve():
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    hub_pb2_grpc.add_GreeterServicer_to_server(Greeter(), server)
    server.add_insecure_port("[::]:50051")
    server.start()
    server.wait_for_termination()


if __name__ == '__main__':
    serve()

