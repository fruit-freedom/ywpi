import typing as t

import fastapi
import pydantic
from bson import ObjectId

from ..db import contexts_collection


PyObjectId = t.Annotated[str, pydantic.BeforeValidator(str)]
T = t.TypeVar('T')


class Label(pydantic.BaseModel):
    name: str
    value: t.Optional[str] = None


class Context(pydantic.BaseModel):
    """
    MongoDB Collection Item
    """
    id: PyObjectId = pydantic.Field(alias='_id', serialization_alias='id', default=None)
    project_id: t.Optional[PyObjectId] = None
    labels: t.Optional[list[Label]] = None
    tp: str
    data: dict


router = fastapi.APIRouter()


@router.post('/api/projects/{project_id}/contexts', tags=['contexts'])
async def create_context(
    project_id: str,
    tp: t.Annotated[str, fastapi.Body()],
    data: t.Annotated[dict, fastapi.Body()] = {},
    labels: t.Annotated[t.Optional[list[Label]], fastapi.Body()] = [],
) -> Context:
    print('Creating context', tp, data, project_id, labels)

    result = await contexts_collection.insert_one({
        'tp': tp,
        'data': data,
        'project_id': ObjectId(project_id),
        'labels': [l.model_dump(mode='json') for l in labels],
    })

    return Context.model_validate(await contexts_collection.find_one({ '_id': result.inserted_id }))


@router.get('/api/projects/{project_id}/contexts/{context_id}', tags=['contexts'])
async def get_context(project_id: str, context_id: str) -> Context:
    context = await contexts_collection.find_one({ '_id': ObjectId(context_id) })

    if context is None:
        raise fastapi.HTTPException(status_code=404)

    return context


WORD_TO_DKEY = {
    'type': 'type',
    'tp': 'type'
}


def query_to_filter(q: str):    
    tokens = q.split()
    filters = []
    for t in tokens:
        equasion_splits = t.split('=')
        if len(equasion_splits) > 1: # key=value
            if equasion_splits[0] not in WORD_TO_DKEY:
                filters.append({
                    'labels.name': equasion_splits[0],
                    'labels.value': equasion_splits[1]
                })
            else:
                filters.append({
                    WORD_TO_DKEY[equasion_splits[0]]: equasion_splits[1],
                })
        else: # Label
            filters.append({
                'labels.name': equasion_splits[0],
            })
    print(filters)
    return filters


@router.get('/api/projects/{project_id}/contexts', tags=['contexts'])
async def get_contexts_list(
    project_id: str,
    q: t.Optional[str] = None
) -> list[Context]:
    additioanl_filters = { }

    if q is not None:
        additioanl_filters['$and'] = query_to_filter(q)

    return await contexts_collection.find({ 'project_id': ObjectId(project_id), **additioanl_filters }).sort({'_id': -1}).to_list(100)


@router.patch('/api/projects/{project_id}/contexts/{context_id}', tags=['contexts'])
async def update_context(
    project_id: str,
    context_id: str,
    labels: t.Annotated[t.Optional[list[Label]], fastapi.Body()] = [],
    placeholder: t.Annotated[t.Optional[str], fastapi.Body()] = None,
):
    await contexts_collection.update_one({ '_id': ObjectId(context_id) }, {
        '$push': {
            'labels': {
                '$each': [
                    l.model_dump(mode='json')
                    for l in labels
                ]
            }
        }
    })


@router.delete('/api/projects/{project_id}/contexts/{context_id}', tags=['contexts'])
async def update_context(project_id: str, context_id: str):
    result = await contexts_collection.delete_one({ '_id': ObjectId(context_id) })

    if result.deleted_count <= 0:
        raise fastapi.HTTPException(status_code=404)
