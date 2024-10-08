import warnings
warnings.simplefilter("ignore", UserWarning)

import json

import hub_pb2
import hub_pb2_grpc
import grpc

import sys

def get_agent_id():
    if len(sys.argv) > 1:
        return sys.argv[1]
    return 'a-1'

with grpc.insecure_channel('localhost:50051') as channel:
    greeter_stub = hub_pb2_grpc.HubStub(channel)

    method = 'loaddata'
    params = {
        "filepath": "image.jpg"
    }
    agent_id = get_agent_id()

    print(f'Request {method} with {params} to agent {agent_id}')
    response = greeter_stub.PushTask(
        hub_pb2.PushTaskRequest(
            agent_id=agent_id,
            method=method,
            params=json.dumps(params),
            payload='{}'
        )
    )
    print(response)

