import traceback
import typing as t
import uuid
import asyncio

import aiochannel
import pydantic

from server import hub_models


T = t.TypeVar("T")


class BaseRepository(t.Generic[T]):
    def __init__(self) -> None:
        self._subs: dict[str, aiochannel.Channel] = {}

    def notify_listeners(self, event):
        for channel in self._subs.values():
            channel.put_nowait(event)

    async def __aenter__(self):
        return self

    async def __aexit__(self, *args):
        pass

    class _Subscribtion(t.Generic[T]):
        def __init__(self, repo: 'BaseRepository'):
            self._repo = repo
            self._channel = aiochannel.Channel()

        def __aiter__(self):
            self._sub_id = uuid.uuid4().hex[:12]
            # print(f'Events listener "{self._sub_id}"added')
            if self._sub_id not in self._repo._subs:
                self._repo._subs[self._sub_id] = self._channel
            else:
                raise RuntimeError(f"Subscribtion ID dublicated: '{self._sub_id}'")

            return self

        def _cleanup(self):
            # print(f'Listener "{self._sub_id}" on agents event removed')
            self._repo._subs.pop(self._sub_id, None)

        async def __anext__(self) -> T:
            try:
                return await self._channel.get()
            except aiochannel.ChannelClosed:
                self._cleanup()
                raise StopAsyncIteration()
            except:
                self._cleanup()
                raise

    def subscribe_on_updates(self):
        return self._Subscribtion(self)


base_repository = BaseRepository()


class AgentDeleted(pydantic.BaseModel):
    id: str


class AgentRepository(BaseRepository[hub_models.RegisterAgentRequest | AgentDeleted | dict[str, hub_models.RegisterAgentRequest]]):
    def __init__(self, events_stream: BaseRepository) -> None:
        self._subs: dict[str, aiochannel.Channel] = {}
        self._agents: dict[str, hub_models.RegisterAgentRequest] = {}
        self._events_stream = events_stream

    @property
    def agents(self):
        return self._agents

    async def _event_subscribtion_loop(self):
        async for event in self._events_stream.subscribe_on_updates():
            try:
                if isinstance(event, dict):
                    if len(event) > 1: # Agent connected
                        agent = hub_models.RegisterAgentRequest.model_validate(event)
                        self._agents[event["id"]] = agent
                        self.notify_listeners(agent)
                    else: # Agent disconnected
                        self._agents.pop(event["id"], None)
                        self.notify_listeners(AgentDeleted(id=event["id"]))
                else: # Set agents list
                    agents = { a["id"]: hub_models.RegisterAgentRequest.model_validate(a) for a in event }
                    self._agents = agents
                    self.notify_listeners(agents)
            except BaseException as e:
                traceback.print_exc()

    async def __aenter__(self):
        self._task = asyncio.create_task(self._event_subscribtion_loop())
        return self

    async def __aexit__(self, *args):
        if self._task:
            self._task.cancel()
