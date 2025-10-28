import dataclasses
from bson import ObjectId
import typing as t

import asyncio

from .events.repository import repository as events
from .events import models as events_models
from ywpi_hub import hub_models


@dataclasses.dataclass
class TaskDescription:
    id: str
    agent_id: str
    method: str
    status: str
    inputs: dict[str, t.Any]
    outputs: dict[str, t.Any] = dataclasses.field(default_factory=lambda: {})
    error: t.Optional[hub_models.Error] = None
    silent: bool = False # Tast event not produced (for clear RPC)


class TaskRepository:
    def __init__(self) -> None:
        self._tasks: dict[str, TaskDescription] = {}
        self._tracked_tasks: dict[str, asyncio.Future] = {}

    def _add_no_produce(self, agent_id: str, method: str, inputs: dict, silent: bool) -> TaskDescription:
        """
        This method required due to groupd buisness logic without async context.
        It is required due to atomic nature of `add_with_tracking` method
        """

        # ObjectId is ordered but there are could be problems with dublication
        # if multiple hubs are running
        id = str(ObjectId())
        task = TaskDescription(
            id=id,
            agent_id=agent_id,
            method=method,
            status='created',
            inputs=inputs,
            silent=silent
        )
        if id in self._tasks:
            raise KeyError('Task UUID duplicates...')

        self._tasks[id] = task

        return task

    async def add(self, agent_id: str, method: str, inputs: dict) -> TaskDescription:
        # Background silent tasks have not got meaning
        task = self._add_no_produce(agent_id, method, inputs, False)

        await events.produce_event(events_models.EventType.TaskCreated, {
            'id': task.id,
            'agent_id': agent_id,
            'method': method,
            'status': 'created',
            'inputs': inputs
        })

        return task

    async def add_with_tracking(
        self,
        agent_id: str,
        method: str,
        inputs: dict,
        silent: bool = False
    ) -> tuple[TaskDescription, asyncio.Future[TaskDescription]]:
        task = self._add_no_produce(agent_id, method, inputs, silent)

        fut = asyncio.Future()
        self._tracked_tasks[task.id] = fut

        if not silent:
            await events.produce_event(events_models.EventType.TaskCreated, {
                'id': task.id,
                'agent_id': agent_id,
                'method': method,
                'status': 'created',
                'inputs': inputs
            })

        return task, fut

    async def update_status(self, id: str, status: str, error: hub_models.Error = None):
        if id not in self._tasks:
            raise KeyError(f'Task "{id}" does no exists')

        if status in ('completed', 'failed', 'aborted'):
            task = self._tasks.pop(id)

            # If task tracked (has future waiter)
            if id in self._tracked_tasks:
                fut = self._tracked_tasks.pop(id)
                if not fut.cancelled():
                    if status == "failed":
                        task.error = error
                        error = error.model_dump(mode='json') if error is not None else error
                    fut.set_result(task)
        else:
            self._tasks[id].status = status
            task = self._tasks[id]

        if not task.silent:
            await events.produce_event(events_models.EventType.TaskUpdated, {
                'id': id,
                'agent_id': task.agent_id,
                'status': status,
                'error': error
            })

    async def update_outputs(self, id: str, outputs: dict[str, t.Any]):
        if id not in self._tasks:
            raise KeyError(f'Task "{id}" does no exists')

        self._tasks[id].outputs.update(outputs)

        if not self._tasks[id].silent:
            await events.produce_event(events_models.EventType.TaskUpdated, {
                'id': id,
                'agent_id': self._tasks[id].agent_id,
                'outputs': outputs
            })

repository = TaskRepository()
