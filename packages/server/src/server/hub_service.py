import json
from contextlib import asynccontextmanager

import grpc

from server import hub_pb2_grpc
from server import hub_pb2
from server import settings


class HubService:
    def __init__(self):
        self._stub = hub_pb2_grpc.HubStub

    @asynccontextmanager
    async def lifespan(self):
        async with grpc.aio.insecure_channel(settings.HUB_CONNECTION_STRING) as channel:
            self._stub = hub_pb2_grpc.HubStub(channel)
            yield

    async def execute_method_async(self, agent_id: str, method_name: str, inputs: dict) -> str:
        """
        Returns:
            task_id: str
        """
        response: hub_pb2.PushTaskResponse = await self._stub.PushTask(
            hub_pb2.PushTaskRequest(
                agent_id=agent_id,
                method=method_name,
                params=json.dumps(inputs),
            )
        )

        if response.HasField('error'):
            raise RuntimeError(response.error)

        return response.task_id

    async def execute_method(self, agent_id: str, method_name: str, inputs: dict, silent: bool = False) -> dict:
        response: hub_pb2.RunTaskResponse = await self._stub.RunTask(
            hub_pb2.PushTaskRequest(
                agent_id=agent_id,
                method=method_name,
                params=json.dumps(inputs),
                silent=silent
            )
        )

        if response.HasField('error'):
            raise RuntimeError(response.error.type)

        return json.loads(response.outputs)


hub = HubService()
