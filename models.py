import enum

import pydantic


class MessageKind(enum.Enum):
    hellow_message = 'hellow_message'
    start_task_message = 'start_task_message'

class HelloMessage(pydantic.BaseModel):
    id: str
    methods: list[str]


class StartTaskMessage(pydantic.BaseModel):
    method: str
    params: dict = {}
    payload: dict = {}


class HelloMessagePayload(pydantic.BaseModel):
    agent_id: str
    name: str
    methods: list[str]

