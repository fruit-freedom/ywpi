import typing as t

import pydantic


class NodeData(pydantic.BaseModel):
    config: t.Optional[dict] = None
    name: str
    payload: t.Optional[dict] = None


class Node(pydantic.BaseModel):
    id: str
    type: str
    data: NodeData


class EdgeConnector:
    id: str
    socket_name: str


class Edge(pydantic.BaseModel):
    # id: str
    source: str
    target: str
    source_handle: str = pydantic.Field(alias='sourceHandle', default=None)
    target_handle: str = pydantic.Field(alias='targetHandle', default=None)
    type: str = "inputs-passing"


class Wf(pydantic.BaseModel):
    nodes: list[Node]
    edges: list[Edge]

