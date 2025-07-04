import grpc

from . import base
from ywpi import settings
from ywpi import hub_pb2
from ywpi import hub_pb2_grpc

grpc_channel: grpc.aio.Channel | None = None
hub_stub: hub_pb2_grpc.HubStub | None = None


async def _init_stub():
    global hub_stub
    global grpc_channel
    if hub_stub is None:
        grpc_channel = grpc.aio.insecure_channel(settings.YWPI_HUB_HOST)
        hub_stub = hub_pb2_grpc.HubStub(grpc_channel)


class Method(base.Method):
    async def __call__(self, *args, **kwds):
        await _init_stub()
        return self._handle_response(
            await hub_stub.RunTask(
                self._create_request(*args, **kwds)
            )
        )


async def get_methods() -> list[Method]:
    await _init_stub()
    result = []
    response: hub_pb2.GetAgentsListResponse = await hub_stub.GetAgentsList(hub_pb2.GetAgentsListRequest())

    for agent in response.agents:
        for method in agent.methods:
            result.append(Method(
                agent.id,
                method.name,
                method.inputs
            ))
    
    return result


async def get_method(agent: str, name: str) -> Method:
    await _init_stub()
    response: hub_pb2.GetAgentsListResponse = await hub_stub.GetAgentsList(hub_pb2.GetAgentsListRequest())

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
