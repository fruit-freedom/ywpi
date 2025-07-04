import json

import grpc
import pydantic
from langchain.tools import BaseTool

from ywpi import settings
from ywpi import hub_pb2
from ywpi import hub_pb2_grpc
from ywpi import hub_models

grpc_channel = grpc.insecure_channel(settings.YWPI_HUB_HOST)
hub_stub = hub_pb2_grpc.HubStub(grpc_channel)


class Method:
    def __init__(self, agent_id: str, name: str, inputs: list[hub_pb2.Input] = []):
        self.agent_id = agent_id
        self.name = name
        self.inputs = inputs

    def __repr__(self):
        return f'Method(agent={self.agent_id}, name={self.name}, inputs={self.inputs})'

    def _create_request(self, *args, **kwargs):
        if len(args):
            raise RuntimeError('ywpi method can not recieve positional args')

        params = {
            key: value.model_dump(mode='json') if isinstance(value, pydantic.BaseModel) else value
            for key, value in kwargs.items()
        }

        return hub_pb2.PushTaskRequest(
            agent_id=self.agent_id,
            method=self.name,
            params=json.dumps(params)
        )

    def _handle_response(self, response: hub_pb2.RunTaskResponse):
        if response.HasField('error'):
            raise RuntimeError(f'Execution error: {response.error}')

        outputs = json.loads(response.outputs)
        if '__others__' in outputs:
            return outputs['__others__']
        return outputs

    def __call__(self, *args, **kwds):
        return self._handle_response(
            hub_stub.RunTask(
                self._create_request(*args, **kwds)
            )
        )

    def to_autogen_tool(self):
        pass

    # def to_langchain_tool(other_self):

    #     class CustomTool(BaseTool):
    #         def _run(self, *args, **kwargs):
    #             return other_self.__call__(*args, **kwargs)

    #     return CustomTool(name=other_self.name, description='', args_schema={
    #         "definitions": {
    #             "value": {
    #                 "type": "integer"
    #             }
    #         }
    #     })


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
