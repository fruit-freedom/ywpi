import enum
import typing

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


class InputDescription(pydantic.BaseModel):
    name: str
    type: str

class Method(pydantic.BaseModel):
    name: str
    inputs: list[InputDescription]


class RegisterAgentRequest(pydantic.BaseModel):
    agent_id: str
    name: str
    methods: list[Method]

class RegisterAgentResponse(pydantic.BaseModel):
    pass


class StartTaskRequest(pydantic.BaseModel):
    method: str
    params: dict[str, typing.Any] = { }

class StartTaskResponse(pydantic.BaseModel):
    status: str = 'success'


class UpdateTaskRequest(pydantic.BaseModel):
    task_id: str
    status: str = 'undefined'

class UpdateTaskResponse(pydantic.BaseModel):
    pass








