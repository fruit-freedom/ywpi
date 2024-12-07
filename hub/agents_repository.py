import dataclasses
import typing

from . import models
from .logger import logger
from .events.repository import repository as events

class AbstractAgentConnector:
    async def start_task(self, payload: models.StartTaskRequest) -> models.StartTaskResponse: pass

@dataclasses.dataclass
class AgentDescription:
    id: str
    name: str
    methods: list[models.Method]
    connector: AbstractAgentConnector
    description: typing.Optional[str] = None

class AgentRepository:
    def __init__(self) -> None:
        self._agents: dict[str, AgentDescription] = {}

    async def add(self, data: models.RegisterAgentRequest, connector: AbstractAgentConnector):
        if data.id in self._agents:
            raise KeyError(f'agent with id "{data.id}" already exists')

        agent_description = AgentDescription(
            id=data.id,
            name=data.name,
            description=data.description,
            methods=data.methods,
            connector=connector
        )
        self._agents[data.id] = agent_description
        await events.produce_agent_connected({
            'id': data.id,
            'name': data.name,
            'project': data.project,
            'status': 'connected',
            'description': data.description,
            'methods': data.methods
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
