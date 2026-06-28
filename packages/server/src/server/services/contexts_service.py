import traceback
import asyncio
import typing as t
from bson import ObjectId

from server import hub_models
from server.hub_service import hub
from server.repositories.contexts import ContextsRepository, Context


class ContextsService(ContextsRepository):
    """
    Responsible for:
        - Contexts management (on top of contexts repository)
        - Subscribtions management
    """

    def __init__(self):
        self._handle_ange_events_task: asyncio.Task = None
        # agent_id, method_name -> Method
        self._subscribers: dict[tuple[str, str], hub_models.Method] = { }

    async def __aenter__(self):
        self._handle_ange_events_task = asyncio.create_task(self._handle_agent_events())

    async def __aexit__(self, *args, **kwargs):
        if self._handle_ange_events_task is not None:
            self._handle_ange_events_task.cancel()

    def _build_inputs(self, method: hub_models.Method, context_id: str, context: Context | None):
        inputs = {}
        for input in method.inputs:
            if input.type.name == "Context":
                inputs[input.name] = context.model_dump(mode="json")
            elif input.type.name == "ContextId":
                inputs[input.name] = {
                    "id": context_id
                }
        return inputs

    async def _notify_subscribers(self, context_id: str, context: Context | None):
        for (agent_id, method_name), method in self._subscribers.items():
            await hub.execute_method_async(
                agent_id=agent_id,
                method_name=method_name,
                inputs=self._build_inputs(method, context_id, context)
            )

    async def create(self, context: Context):
        # TODO: Transactional outbox required
        context = await super().create(context)
        await self._notify_subscribers(context.id, context)
        return context

    async def update(self, context_id: str | ObjectId, update: dict[str, t.Any]) -> Context:
        # TODO: Transactional outbox required
        context = await super().update(
            context_id=context_id,
            update=update
        )

        # Notify handlers
        await self._notify_subscribers(context.id, context)
        return context

    async def delete(self, context_id):
        # TODO: Transactional outbox required
        deleted = await super().delete(context_id)

        # Notify handlers
        await self._notify_subscribers(context_id, None)
        
        return deleted

    def _register_agent_subscribtions(self, agent: hub_models.RegisterAgentRequest):
        def check(method: hub_models.Method):
            # TODO: check signature
            if method.labels is None:
                return False
            return any(map(lambda e: e.name == "builtins/subscribtion", method.labels))

        for method in agent.methods:
            if check(method):
                print("Register subscribtion", f"{agent.id}/{method.name}")
                self._subscribers[(agent.id, method.name)] = method

    async def _handle_agent_events(self):
        async for event in hub.agents_respoitory.subscribe_on_updates():
            try:
                if isinstance(event, dict):
                    for agent in event.values():
                        self._register_agent_subscribtions(agent)

                elif isinstance(event, hub_models.RegisterAgentRequest):
                    self._register_agent_subscribtions(event)
                else:
                    agent_id = event.id
                    ids = list(
                        filter(lambda e: e[0] == agent_id, self._subscribers)
                    )
                    for id in ids:
                        self._subscribers.pop(id, None)
                        print(f"Remove subscribtion:", f"{id[0]}/{id[1]}")
            except BaseException as e:
                traceback.print_exc()


contexts_service = ContextsService()
