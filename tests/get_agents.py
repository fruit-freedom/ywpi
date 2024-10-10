import warnings
warnings.simplefilter("ignore", UserWarning)

import json

import hub_pb2
import hub_pb2_grpc
import grpc

with grpc.insecure_channel('localhost:50051') as channel:
    greeter_stub = hub_pb2_grpc.HubStub(channel)

    response = greeter_stub.GetAgentsList(hub_pb2.GetAgentsListRequest())
    print(response)

