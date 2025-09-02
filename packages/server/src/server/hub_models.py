# Copied from hub/hub_models.py DO NOT EDIT!

import typing as t

import pydantic


class InputDescription(pydantic.BaseModel):
    name: str
    type: str


class Type(pydantic.BaseModel):
    name: str
    args: t.Optional[list['Type']] = None


class Field(pydantic.BaseModel):
    name: str
    type: Type
    description: t.Optional[str] = None


class Label(pydantic.BaseModel):
    name: str
    value: t.Optional[str] = None


class Subscribtion(pydantic.BaseModel):
    selector: dict


class Method(pydantic.BaseModel):
    name: str
    inputs: list[Field]
    outputs: list[Field]
    description: t.Optional[str] = None
    labels: t.Optional[list[Label]] = None
    subscribtions: t.Optional[list[Subscribtion]] = None
    schema: t.Optional[dict] = None # OpenAI compatible function schema


class RegisterAgentRequest(pydantic.BaseModel):
    id: str
    name: str
    project: t.Optional[str] = None
    description: t.Optional[str] = None
    methods: list[Method]


class RegisterAgentResponse(pydantic.BaseModel):
    pass


class StartTaskRequest(pydantic.BaseModel):
    id: str
    method: str
    params: dict[str, t.Any] = { }


class StartTaskResponse(pydantic.BaseModel):
    status: str = 'success'


class StartTrackinTaskResponse(pydantic.BaseModel):
    id: str


class UpdateTaskRequest(pydantic.BaseModel):
    id: str
    status: str | None = None
    outputs: dict | None = None


class UpdateTaskResponse(pydantic.BaseModel):
    pass
