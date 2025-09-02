import enum
import typing as t
import datetime

import pydantic

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
