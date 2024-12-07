import typing
import dataclasses
import uuid
from . import models
from .events.repository import repository as events

@dataclasses.dataclass
class TaskDescription:
    id: str
    agent_id: str
    method: str
    status: str
    inputs: dict[str, typing.Any]
    outputs: dict[str, typing.Any] = dataclasses.field(default_factory=lambda: {})

class TaskRepository:
    def __init__(self) -> None:
        self._tasks: dict[str, TaskDescription] = {}

    async def add(self, agent_id: str, method: str, inputs: dict) -> TaskDescription:
        id = str(uuid.uuid4())
        task = TaskDescription(
            id=id,
            agent_id=agent_id,
            method=method,
            status='created',
            inputs=inputs
        )
        if id in self._tasks:
            raise KeyError('Task UUID duplicates...')

        self._tasks[id] = task
        await events.produce_event(models.EventType.TaskCreated, {
            'id': id,
            'agent_id': agent_id,
            'method': method,
            'status': 'created',
            'inputs': inputs
        })

        return task

    async def update_status(self, id: str, status: str):        
        if id not in self._tasks:
            raise KeyError(f'Task "{id}" does no exists')
        
        if status in ('completed', 'failed', 'aborted'):
            task = self._tasks.pop(id)
        else:
            self._tasks[id].status = status
            task = self._tasks[id]

        await events.produce_event(models.EventType.TaskUpdated, {
            'id': id,
            'agent_id': task.agent_id,
            'status': status
        })

    async def update_outputs(self, id: str, outputs: dict[str, typing.Any]):
        if id not in self._tasks:
            raise KeyError(f'Task "{id}" does no exists')

        self._tasks[id].outputs.update(outputs)

        await events.produce_event(models.EventType.TaskUpdated, {
            'id': id,
            'agent_id': self._tasks[id].agent_id,
            'outputs': outputs
        })

repository = TaskRepository()
