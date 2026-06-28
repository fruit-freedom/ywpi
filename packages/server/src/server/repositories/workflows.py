import typing as t
import asyncio

import pydantic
from bson import ObjectId

from server.db import workflows_collection
from server.repositories.utils import PyObjectId


class Position(pydantic.BaseModel):
    x: float
    y: float


class Node(pydantic.BaseModel):
    id: str
    type: str
    data: dict
    position: Position
    drag_handle: t.Optional[str] = pydantic.Field(alias='dragHandle', default=None)


class Edge(pydantic.BaseModel):
    id: str
    source: str
    target: str
    source_handle: str = pydantic.Field(alias='sourceHandle')
    target_handle: str = pydantic.Field(alias='targetHandle')


class Workflow(pydantic.BaseModel):
    id: PyObjectId = pydantic.Field(alias='_id', serialization_alias='id', default=None)
    name: str
    description: t.Optional[str] = None
    project_id: t.Optional[str] = pydantic.Field(alias="projectId", default=None)
    nodes: list[Node]
    edges: list[Edge]


WorkflowList = pydantic.TypeAdapter(list[Workflow])


class WorkflowsRepoistory:
    async def list_and_count(self, project_id: t.Optional[str] = None) -> tuple[list[Workflow], int]:
        filters = {}

        if project_id is not None:
            filters[Workflow.model_fields["project_id"].alias] = ObjectId(project_id)

        workflows, count = await asyncio.gather(
            workflows_collection.find(filters).to_list(None),
            workflows_collection.estimated_document_count()
        )

        return (WorkflowList.validate_python(workflows), count)

    async def get(self, workflow_id: str | ObjectId) -> Workflow:
        if isinstance(workflow_id, str):
            workflow_id = ObjectId(workflow_id)

        return Workflow.model_validate(
            await workflows_collection.find_one({ "_id": workflow_id })
        )

    async def create(self, workflow: Workflow) -> Workflow:
        result = await workflows_collection.insert_one(
            workflow.model_dump(mode='json', by_alias=True)
        )
        return await self.get(result.inserted_id)

    async def update(self, workflow_id: str, data: dict[str, t.Any]) -> Workflow:
        workflow_id = ObjectId(workflow_id)
        await workflows_collection.update_one({ "_id": workflow_id }, {
            "$set": data
        })
        return await self.get(workflow_id)

    async def delete(self, workflow_id: str) -> None:
        await workflows_collection.delete_one({ "_id": ObjectId(workflow_id) })


workflows_repository = WorkflowsRepoistory()
