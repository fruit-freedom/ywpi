import json
from contextlib import asynccontextmanager
import asyncio

import grpc

from server import hub_pb2_grpc
from server import hub_pb2
from server import settings
from server.hub_repository import BaseRepository, AgentRepository


class HubService:
    def __init__(self):
        self._stub: hub_pb2_grpc.HubStub = None
        self._events_stream = BaseRepository()
        self._agents_repository = AgentRepository(self._events_stream)

    @property
    def agents_respoitory(self) -> AgentRepository:
        return self._agents_repository

    @asynccontextmanager
    async def lifespan(self):
        async with grpc.aio.insecure_channel(settings.HUB_CONNECTION_STRING) as channel:
            self._stub = hub_pb2_grpc.HubStub(channel)
            self._subscribtion_task = asyncio.create_task(self._subscribtion_loop())
            async with self._events_stream:
                async with self._agents_repository:
                    yield
            self._subscribtion_task.cancel()

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

    async def _subscribtion_loop(self):
        try:
            async for response in self._stub.SubscribeOnAgents(hub_pb2.SubscribeOnAgentsRequest()):
                response: hub_pb2.SubscribeOnAgentsResponse
                data = json.loads(response.payload)
                self._events_stream.notify_listeners(data)
        finally:
            self._events_stream.notify_listeners([])

    def get_method(self, agent_id: str, method_name: str):
        methods = self._agents_repository.agents.get(agent_id).methods
        return next(filter(lambda e: e.name == method_name, methods))
        


hub = HubService()
