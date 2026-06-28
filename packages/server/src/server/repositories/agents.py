import typing as t
import asyncio
import enum

import pydantic
from bson import ObjectId

from server.db import agents_collection
from server.repositories.utils import PyObjectId


class AgentStatus(enum.Enum):
    Connected = 'connected'
    Disconnected = 'disconnected'


class Agent(pydantic.BaseModel):
    uid: PyObjectId = pydantic.Field(alias='_id', serialization_alias='uid', default=None)
    id: str
    status: str
    name: str
    project: t.Optional[str] = None
    description: t.Optional[str] = None
    methods: list[dict]


class AgentsRepoistory:
    async def set_agents_activity(self, active_agents: list[str]):
        await agents_collection.update_many(
            {},
            {
                "$set": {
                    "status": AgentStatus.Disconnected.value
                }
            }
        )
        return await agents_collection.update_many(
            {
                "id": { "$in": active_agents }
            },
            {
                "$set": {
                    "status": AgentStatus.Connected.value
                }
            }
        )

agents_repository = AgentsRepoistory()
