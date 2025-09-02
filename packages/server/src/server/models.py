import enum
import typing as t
import datetime

import pydantic
from .hub_models import Method


PyObjectId = t.Annotated[str, pydantic.BeforeValidator(str)]


class Agent(pydantic.BaseModel):
    uid: PyObjectId = pydantic.Field(alias='_id', serialization_alias='uid', default=None)
    id: str
    status: str
    name: str
    project: t.Optional[str] = None
    description: t.Optional[str] = None
    methods: list[Method]

# RabbitMQ Events models


class AgentStatus(enum.Enum):
    Connected = 'connected'
    Disconnected = 'disconnected'

class AgentConnectedData(pydantic.BaseModel):
    id: str
    name: str
    status: AgentStatus
    project: t.Optional[str] = None
    description: str
    methods: list[Method]

class AgentDisconnectedData(pydantic.BaseModel):
    id: str

class TaskCreatedData(pydantic.BaseModel):
    id: str
    agent_id: str
    method: str
    status: str
    inputs: dict

class TaskUpdatedData(pydantic.BaseModel):
    id: str
    agent_id: str
    status: t.Optional[str] = None
    outputs: t.Optional[dict] = None

class TaskCompletedData(pydantic.BaseModel):
    pass

class EventType(enum.Enum):
    AgentConnected = 'agent.connected'
    AgentDisconnected = 'agent.disconnected'
    TaskCreated = 'task.created'
    TaskUpdated = 'task.updated'
    TaskCompleted = 'task.completed'

class Event(pydantic.BaseModel):
    timestamp: datetime.datetime
    type: EventType
    data: dict

class Task(TaskCreatedData):
    id: PyObjectId = pydantic.Field(alias='_id', serialization_alias='id', default=None)
    inputs: t.Optional[dict] = None
    outputs: t.Optional[dict] = None
    context_id: t.Optional[PyObjectId] = None
