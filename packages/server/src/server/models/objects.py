import typing as t

import pydantic


PyObjectId = t.Annotated[str, pydantic.BeforeValidator(str)]
T = t.TypeVar('T')


class Relation(pydantic.BaseModel):
    name: str
    object_id: PyObjectId
    source_task_id: t.Optional[str] = None


class Object(pydantic.BaseModel, t.Generic[T]):
    """
    MongoDB Collection
    """
    id: PyObjectId = pydantic.Field(alias='_id', serialization_alias='id', default=None)
    tp: str
    relations: list[Relation] = []
    data: T


class Position(pydantic.BaseModel):
    x: int
    y: int


class Node(pydantic.BaseModel):
    """
    MongoDB Collection
    """
    object_id: PyObjectId
    project_id: PyObjectId
    position: Position


class Project(pydantic.BaseModel):
    id: PyObjectId = pydantic.Field(alias='_id', serialization_alias='id', default=None)
    name: str


class Edge(pydantic.BaseModel):
    pass


class ProjectView(pydantic.BaseModel):
    id: str
    name: str
    nodes: list[Node]
    edges: list[Edge]

# PATCH /projects/{project_id}/nodes/{node_id}


