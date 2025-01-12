# Copied from hub/hub_models.py DO NOT EDIT!

import typing as t

import pydantic


class InputDescription(pydantic.BaseModel):
    name: str
    type: str


class Field(pydantic.BaseModel):
    name: str
    type: str # "llama_index.Document"
    args: t.Optional[list] = None


class Method(pydantic.BaseModel):
    name: str
    inputs: list[InputDescription]
    outputs: list[Field]
    description: t.Optional[str] = None


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


class UpdateTaskRequest(pydantic.BaseModel):
    id: str
    status: str | None = None
    outputs: dict | None = None


class UpdateTaskResponse(pydantic.BaseModel):
    pass
