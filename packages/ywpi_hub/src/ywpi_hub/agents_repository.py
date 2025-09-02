import dataclasses
import typing
import uuid

import aiochannel

from . import hub_models
from .logger import logger
from .events.repository import repository as events


class AbstractAgentConnector:
    async def start_task(self, payload: hub_models.StartTaskRequest) -> hub_models.StartTaskResponse: pass
    async def push_task_input(self, payload: typing.Any) -> typing.Any: pass


@dataclasses.dataclass
class AgentDescription:
    id: str
    name: str
    methods: list[hub_models.Method]
    connector: AbstractAgentConnector
    description: typing.Optional[str] = None


class AgentRepository:
    def __init__(self) -> None:
        self._agents: dict[str, AgentDescription] = {}
        self._subs: dict[str, aiochannel.Channel] = {}

    @staticmethod
    def serialize(data: AgentDescription):
        return {
            'id': data.id,
            'name': data.name,
            'status': 'connected',
            'description': data.description,
            'methods': [m.model_dump(mode='json') for m in data.methods]
        }

    async def add(self, data: hub_models.RegisterAgentRequest, connector: AbstractAgentConnector):
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

        self._notify_listeners(AgentRepository.serialize(agent_description))

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
            self._notify_listeners({ "id": id })

    def _notify_listeners(self, event: dict):
        for channel in self._subs.values():
            channel.put_nowait(event)

    class _Subscribtion:
        def __init__(self, repo: 'AgentRepository'):
            self._repo = repo
            self._channel = aiochannel.Channel()

        def __aiter__(self):
            self._sub_id = uuid.uuid4().hex[:12]
            logger.info(f'Listener "{self._sub_id}" on agents event added')
            if self._sub_id not in self._repo._subs:
                self._repo._subs[self._sub_id] = self._channel
                payload = [AgentRepository.serialize(a) for a in self._repo.get_list()]
                self._channel.put_nowait(payload)
            else:
                raise RuntimeError(f"Subscribtion ID dublicated: '{self._sub_id}'")

            return self

        def _cleanup(self):
            logger.info(f'Listener "{self._sub_id}" on agents event removed')
            self._repo._subs.pop(self._sub_id, None)

        async def __anext__(self):
            try:
                return await self._channel.get()
            except aiochannel.ChannelClosed:
                self._cleanup()
                raise StopAsyncIteration()
            except:
                self._cleanup()
                raise

    def subscribe_on_updates(self):
        return AgentRepository._Subscribtion(self)


repository = AgentRepository()
