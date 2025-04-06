import json

import grpc

from . import settings
from . import hub_pb2
from . import hub_pb2_grpc

grpc_channel = grpc.insecure_channel(settings.YWPI_HUB_HOST)
hub_stub = hub_pb2_grpc.HubStub(grpc_channel)


class Method:
    def __init__(self, agent_id: str, name: str, inputs: dict):
        self.agent_id = agent_id
        self.name = name
        self.inputs = inputs

    def __repr__(self):
        return f'Method(agent={self.agent_id}, name={self.name}, inputs={self.inputs})'

    def __call__(self, *args, **kwargs):
        if len(args):
            raise RuntimeError('ywpi method can not recieve positional args')

        response: hub_pb2.RunTaskResponse = hub_stub.RunTask(hub_pb2.PushTaskRequest(
            agent_id=self.agent_id,
            method=self.name,
            params=json.dumps(kwargs)
        ))

        if response.HasField('error'):
            raise RuntimeError(f'Execution error: {response.error}')

        outputs = json.loads(response.outputs)
        if '__others__' in outputs:
            return outputs['__others__']
        return outputs


def get_methods() -> list[Method]:
    result = []
    response: hub_pb2.GetAgentsListResponse = hub_stub.GetAgentsList(hub_pb2.GetAgentsListRequest())

    for agent in response.agents:
        for method in agent.methods:
            result.append(Method(
                agent.id,
                method.name,
                method.inputs
            ))
    
    return result


def get_method(agent: str, name: str) -> Method:
    response: hub_pb2.GetAgentsListResponse = hub_stub.GetAgentsList(hub_pb2.GetAgentsListRequest())

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
