import typing as t

import pydantic

from .agents_repository import AgentDescription
from .logger import logger


class EventAssignment(pydantic.BaseModel):
    sub_id: int
    event_id: int

class EventsRouter:
    def __init__(self):
        self._subs: dict[str, tuple[AgentDescription, dict[str, t.Any]]] = {}

    def add_subscription(self,
        agent: AgentDescription,
        keys: dict[str, t.Any]
    ):
        """
        Example:
        router.add_subscribtion(agent, { "object_kind": "issue" })
        """
        self._subs[agent.id] = (agent, keys)

    def remove_subscribtion(self, agent_id: str):
        self._subs.pop(agent_id, None)

    async def handle_event(self, event: dict):
        for agent, keys in self._subs.values():
            try:
                matched = all(
                    map(
                        lambda k, v: event.get(k, None) == v,
                        keys.items()
                    )
                )

                if matched:
                    await agent.connector.start_task(event)
            except:
                logger.warning(f'Error while handling event to agent "{agent.id}" event {event}')

