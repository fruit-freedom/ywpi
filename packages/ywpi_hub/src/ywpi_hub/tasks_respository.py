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


@dataclasses.dataclass
class TaskEvent:
    outputs: dict[str, t.Any] | None = None
    status: str | None = None
    error: hub_models.Error | None = None


class TaskRepository:
    def __init__(self) -> None:
        self._tasks: dict[str, TaskDescription] = {}
        self._events_subscribers: dict[str, asyncio.Queue[TaskEvent]] = {}
        self._result_subscribers: dict[str, asyncio.Future[TaskDescription]] = {}

    def _add_no_produce(self, agent_id: str, method: str, inputs: dict, silent: bool) -> TaskDescription:
        """
        This method required due to groupd buisness logic without async context.
        It is required due to atomic nature of subscription creation methods
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

    async def update_status(self, id: str, status: str, error: hub_models.Error = None):
        if id not in self._tasks:
            raise KeyError(f'Task "{id}" does no exists')

        if status in ('completed', 'failed', 'aborted'):
            task = self._tasks.pop(id)

            # If task has a result subscriber, resolve it with the final task.
            if id in self._result_subscribers:
                fut = self._result_subscribers.pop(id)
                if not fut.cancelled():
                    if status == "failed":
                        task.error = error
                        # As error is optional there is requirement to set task status
                        # TODO: Add test on this case
                        task.status = status
                    fut.set_result(task)

            # An events subscriber receives the terminal event after all output
            # events have been delivered.
            if id in self._events_subscribers:
                queue = self._events_subscribers.pop(id)
                queue.put_nowait(TaskEvent(status=status, error=error))

            event_error = error.model_dump(mode='json') if error is not None else error
        else:
            event_error = error
            self._tasks[id].status = status
            task = self._tasks[id]

        if not task.silent:
            await events.produce_event(events_models.EventType.TaskUpdated, {
                'id': id,
                'agent_id': task.agent_id,
                'status': status,
                'error': event_error
            })

    async def update_outputs(self, id: str, outputs: dict[str, t.Any]):
        if id not in self._tasks:
            raise KeyError(f'Task "{id}" does no exists')

        self._tasks[id].outputs.update(outputs)

        if id in self._events_subscribers:
            self._events_subscribers[id].put_nowait(TaskEvent(outputs=outputs))

        if not self._tasks[id].silent:
            await events.produce_event(events_models.EventType.TaskUpdated, {
                'id': id,
                'agent_id': self._tasks[id].agent_id,
                'outputs': outputs
            })

    async def add_with_result_subscription(
        self,
        agent_id: str,
        method: str,
        inputs: dict,
        silent: bool = False
    ) -> tuple[TaskDescription, asyncio.Future[TaskDescription]]:
        task = self._add_no_produce(agent_id, method, inputs, silent)
        self._ensure_subscription_is_free(task.id)
        future = asyncio.Future()
        self._result_subscribers[task.id] = future

        if not silent:
            await events.produce_event(events_models.EventType.TaskCreated, {
                'id': task.id,
                'agent_id': agent_id,
                'method': method,
                'status': 'created',
                'inputs': inputs
            })

        return task, future

    async def add_with_events_subscription(
        self,
        agent_id: str,
        method: str,
        inputs: dict,
        silent: bool = False
    ) -> tuple[TaskDescription, asyncio.Queue[TaskEvent]]:
        task = self._add_no_produce(agent_id, method, inputs, silent)
        self._ensure_subscription_is_free(task.id)
        queue: asyncio.Queue[TaskEvent] = asyncio.Queue()
        self._events_subscribers[task.id] = queue

        if not silent:
            await events.produce_event(events_models.EventType.TaskCreated, {
                'id': task.id,
                'agent_id': agent_id,
                'method': method,
                'status': 'created',
                'inputs': inputs
            })

        return task, queue

    # Keep the historical spelling as a compatibility alias.
    add_with_result_subscribtion = add_with_result_subscription
    add_with_events_subscribtion = add_with_events_subscription

    def _ensure_subscription_is_free(self, task_id: str):
        if task_id in self._events_subscribers or task_id in self._result_subscribers:
            self._tasks.pop(task_id, None)
            raise RuntimeError(f'Task "{task_id}" already has a subscriber')

    def remove_events_subscription(self, task_id: str):
        self._events_subscribers.pop(task_id, None)

repository = TaskRepository()
