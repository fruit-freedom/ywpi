import typing as t

import fastapi
import pydantic
from bson import ObjectId

from ..db import projects_collection, nodes_collection

router = fastapi.APIRouter()


PyObjectId = t.Annotated[str, pydantic.BeforeValidator(str)]


class Position(pydantic.BaseModel):
    x: float
    y: float


class Node(pydantic.BaseModel):
    id: PyObjectId = pydantic.Field(alias='_id', serialization_alias='id', default=None)
    project_id: PyObjectId = pydantic.Field(alias='_id', serialization_alias='id')
    object_id: t.Optional[PyObjectId] = None
    type: str
    data: dict
    position: Position
    target_position: str = pydantic.Field(alias='targetPosition', default='left')


class Edge(pydantic.BaseModel):
    id: str
    source: str
    target: str
    source_handle: str = pydantic.Field(alias='sourceHandle')


class Project(pydantic.BaseModel):
    id: PyObjectId = pydantic.Field(alias='_id', serialization_alias='id', default=None)
    name: str


class Board(pydantic.BaseModel):
    nodes: list[Node]
    edges: list[Edge]


@router.post('/api/projects', tags=['projects'])
async def create_project(
    name: t.Annotated[str, fastapi.Body()],
    tags: t.Annotated[list[str], fastapi.Body()] = None
) -> Project:
    result = await projects_collection.insert_one(Project(name=name).model_dump(mode='json'))
    return await projects_collection.find_one({ '_id': result.inserted_id })


@router.get('/api/projects', tags=['projects'])
async def get_projects_list() -> list[Project]:
    return await projects_collection.find().to_list(None)


@router.delete('/api/projects/{project_id}', tags=['projects'])
async def delete_project(project_id: str):
    result = await projects_collection.delete_one({ '_id': ObjectId(project_id) })

    if result.deleted_count <= 0:
        raise fastapi.HTTPException(status_code=404, detail='project does not exist')
    

# @router.get('/api/projects/{project_id}/board')
# async def get_project_board(project_id: str):
#     from ..db import tasks_collection

#     items = []
#     tasks = await tasks_collection.find({}).to_list(None)
#     for idx, t in enumerate(tasks):
#         t['_id'] = str(t['_id'])
#         if 'output' not in t.get('outputs', {}):
#             continue
#         output = t['outputs']['output']
#         items.append(SpaceItem(
#             id=t['_id'],
#             # type='text',
#             type='markdown',
#             position=Position(x=idx * 700, y=0),
#             data={
#                 'text': output
#             }
#         ))

#         if 'prompt' not in t.get('inputs', {}):
#             continue

#         items.append(SpaceItem(
#             id=t['_id'] + 'p',
#             # type='text',
#             type='markdown',
#             position=Position(x=idx * 700, y=-100),
#             data={
#                 'text': '# ' + t['inputs']['prompt']
#             }
#         ))


#     return Space(items=items)


@router.get('/api/projects/{project_id}/board', tags=['boards'])
async def get_project_board(project_id: str) -> Board:
    nodes = await nodes_collection.find({ 'project_id': ObjectId(project_id) }).to_list(None)
    return Board(
        nodes=nodes,
        edges=[]
    )


# @router.post('/api/projects/{project_id}/nodes', tags=['node'])
# async def create_node(
#     text: t.Annotated[str, fastapi.Body()],
#     position: t.Annotated[Position, fastapi.Body()],
#     project_id: str
# ) -> Node:
    
#     from app.routes.objects import create_object

#     obj = await create_object(project_id, 'text', data={ 'text': text })

#     result = await nodes_collection.insert_one({
#         'project_id': ObjectId(project_id),
#         'object_id': ObjectId(obj.id),
#         'type': 'text',
#         'data': {
#             'text': text
#         },
#         'position': position.model_dump(mode='json')
#     })

#     return await nodes_collection.find_one({ '_id': result.inserted_id })


@router.post('/api/projects/{project_id}/nodes', tags=['nodes'])
async def create_node(
    project_id: str,
    tp: t.Annotated[str, fastapi.Body()],
    data: t.Annotated[dict, fastapi.Body()],
    position: t.Annotated[Position, fastapi.Body()],
) -> Node:
    
    from ..routes.objects import create_object
    created_object = await create_object(project_id, tp, data)

    result = await nodes_collection.insert_one({
        'project_id': ObjectId(project_id),
        'type': tp,
        'data': data,
        'position': position.model_dump(mode='json'),
        'object_id': ObjectId(created_object.id)
    })

    return await nodes_collection.find_one({ '_id': result.inserted_id })

from ..db import objects_collection

class CreateNodeFromObjectRequest(pydantic.BaseModel):
    position: t.Annotated[Position, fastapi.Body()]

@router.post('/api/projects/{project_id}/objects/{object_id}/nodes', tags=['nodes'])
async def create_node_from_object(
    project_id: str,
    object_id: str,
    body: CreateNodeFromObjectRequest
) -> Node:
    
    obj = await objects_collection.find_one({ '_id': ObjectId(object_id) })

    if obj is None:
        raise fastapi.HTTPException(status_code=404, detail='object not found')

    result = await nodes_collection.insert_one({
        'project_id': ObjectId(project_id),
        'type': obj['tp'],
        'data': obj['data'],
        'position': body.position.model_dump(mode='json'),
        'object_id': ObjectId(object_id)
    })

    return await nodes_collection.find_one({ '_id': result.inserted_id })


@router.patch('/api/projects/{project_id}/nodes/{node_id}', tags=['nodes'])
async def update_node(
    project_id: str,
    node_id: str,
    position: t.Annotated[Position, fastapi.Body()],
    data: t.Annotated[dict, fastapi.Body()] = None,
):
    # TODO: Verify project
    result = await nodes_collection.update_one({ '_id': ObjectId(node_id) }, {
        '$set': {
            'position': position.model_dump()
        }
    })
    if result.matched_count <= 0:
        raise fastapi.HTTPException(status_code=404)

# Create object always and optionally node

