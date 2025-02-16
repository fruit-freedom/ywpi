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


@router.post('/api/projects', tags=['project'])
async def create_project(
    name: t.Annotated[str, fastapi.Body()],
    tags: t.Annotated[list[str], fastapi.Body()] = None
) -> Project:
    result = await projects_collection.insert_one(Project(name=name).model_dump(mode='json'))
    return await projects_collection.find_one({ '_id': result.inserted_id })


@router.get('/api/projects', tags=['project'])
async def get_projects_list() -> list[Project]:
    return await projects_collection.find().to_list(None)


@router.delete('/api/projects/{project_id}', tags=['project'])
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


@router.get('/api/projects/{project_id}/board')
async def get_project_board(project_id: str) -> Board:
    nodes = await nodes_collection.find({ 'project_id': ObjectId(project_id) }).to_list(None)
    return Board(
        nodes=nodes,
        # nodes=[
        #     Node(
        #         _id='1',
        #         type='text',
        #         position=Position(x=0, y=0),
        #         data={
        #             'text': '''3. Extract Phase
        #                 - Identify Data Sources: Determine where your data will come from (e.g., databases, APIs, flat files, etc.).
        #                 - Data Extraction Mechanism: Use connectors, drivers, or APIs to retrieve data. Ensure you handle authentication if needed.
        #                 - Incremental vs Full Extract: Decide whether to extract full datasets or only changes (incremental loading).
        #                 - Schedule Extraction: Set up a schedule for data extraction based on business needs.'''
        #         }
        #     ),
        #     Node(
        #         _id='2',
        #         type='text',
        #         position=Position(x=500, y=500),
        #         data={
        #             'text': '''4. Transform Phase
        #             - Data Cleaning: Remove duplicates, handle missing values, and ensure data types are consistent.
        #             - Data Transformation: Apply the necessary transformations based on business rules
        #                 (e.g., aggregations, calculations, data type conversions).
        #             - Data Enrichment: Combine data from various sources to enhance its value and provide a more comprehensive view.'''
        #         }
        #     ),
        #     Node(
        #         _id='3',
        #         type='json',
        #         position=Position(x=100, y=500),
        #         data={
        #             'total_time': 0.34,
        #             'method': 'rebase'
        #         }
        #     ),
        #     Node(
        #         _id='doc1',
        #         type='pdf',
        #         data={
        #             'name': 'Reqo: A Robust and Explainable Query Optimization Cost Model',
        #             'src': 'https://arxiv.org/pdf/2501.17414'
        #         },
        #         position=Position(x=300, y=300 ),
        #         targetPosition='left',
        #     ),
        # ],
        edges=[]
    )


@router.post('/api/projects/{project_id}/nodes', tags=['node'])
async def create_node(
    text: t.Annotated[str, fastapi.Body()],
    position: t.Annotated[Position, fastapi.Body()],
    project_id: str
) -> Node:
    result = await nodes_collection.insert_one({
        'project_id': ObjectId(project_id),
        'type': 'text',
        'data': {
            'text': text
        },
        'position': position.model_dump(mode='json')
    })

    return await nodes_collection.find_one({ '_id': result.inserted_id })


@router.patch('/api/projects/{project_id}/nodes/{node_id}', tags=['node'])
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

