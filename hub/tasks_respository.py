import typing
import dataclasses
import uuid
import models
from .events_repository import repository as events

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
        # Event Sourcing based on Agent Model
        # events.produce_event(models.EventType.TaskCreated, {
        #     'id': agent_id,
        #     'tasks': [
        #         {
        #             'id': id,
        #             'status': 'created',
        #             'method': method,
        #             'inputs': inputs
        #         }
        #     ]
        # })


    async def update_status(self, id: str, status: str):        
        if id not in self._tasks:
            raise KeyError(f'Task "{id}" does no exists')
        
        if status in ('completed', 'failed', 'aborted'):
            self._tasks.pop(id)
        else:
            self._tasks[id].status = status

        await events.produce_event(models.EventType.TaskUpdated, {
            'id': id,
            'status': status
        })

    async def update_outputs(self, id: str, outputs: dict[str, typing.Any]):
        if id not in self._tasks:
            raise KeyError(f'Task "{id}" does no exists')

        self._tasks[id].outputs.update(outputs)

        await events.produce_event(models.EventType.TaskUpdated, {
            'id': id,
            'outputs': outputs
        })

repository = TaskRepository()
