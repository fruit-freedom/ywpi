import dataclasses
import typing

import models
from logger import logger
from .events_repository import repository as events


class AbstractAgentConnector:
    async def start_task(self, payload: models.StartTaskRequest) -> models.StartTaskResponse: pass

@dataclasses.dataclass
class AgentDescription:
    id: str
    name: str
    methods: list[models.Method]
    connector: AbstractAgentConnector

class AgentRepository:
    def __init__(self) -> None:
        self._agents: dict[str, AgentDescription] = {}

    async def add(self, id: str, name: str, methods: list[models.Method], connector: AbstractAgentConnector) -> AgentDescription:
        if id in self._agents:
            raise KeyError(f'agent with id "{id}" already exists')

        agent_description = AgentDescription(
            id=id,
            name=name,
            methods=methods,
            connector=connector
        )
        self._agents[id] = agent_description
        await events.produce_agent_connected({
            'id': id,
            'name': name,
            'methods': methods
        })

        return agent_description

    def get(self, id) -> AgentDescription:
        return self._agents[id]

    def get_list(self) -> typing.Iterable[AgentDescription]:
        return self._agents.values()

    async def remove(self, id: str):
        if id not in self._agents:
            logger.warning(f'[AR] agent {id} does not present in repository')
        else:
            await events.produce_agent_disconnected(id)
            self._agents.pop(id)

repository = AgentRepository()
