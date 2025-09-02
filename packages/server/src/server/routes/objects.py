import typing as t

import fastapi
import pydantic
from bson import ObjectId

from ..db import objects_collection


PyObjectId = t.Annotated[str, pydantic.BeforeValidator(str)]
T = t.TypeVar('T')


class Relation(pydantic.BaseModel):
    class SourceTask(pydantic.BaseModel):
        id: str
        method: str

    name: str
    object_id: PyObjectId
    source_task: t.Optional[SourceTask] = None


class Label(pydantic.BaseModel):
    name: str
    value: t.Optional[str] = None
# class Object(pydantic.BaseModel, t.Generic[T]):

class Object(pydantic.BaseModel):
    """
    MongoDB Collection
    """
    id: PyObjectId = pydantic.Field(alias='_id', serialization_alias='id', default=None)
    project_id: PyObjectId
    relations: list[Relation] = []
    labels: t.Optional[list[Label]] = None
    created_task_id: t.Optional[PyObjectId] = None
    tp: str
    data: dict


router = fastapi.APIRouter()


@router.post('/api/projects/{project_id}/objects', tags=['objects'])
async def create_object(
    project_id: str,
    tp: t.Annotated[str, fastapi.Body()],
    data: t.Annotated[dict, fastapi.Body()],
    relations: t.Annotated[t.Optional[list[Relation]], fastapi.Body()] = [],
    labels: t.Annotated[t.Optional[list[Label]], fastapi.Body()] = [],
    created_task_id: t.Optional[str] = None,
) -> Object:
    print('Creating object', project_id, tp, relations)

    # TODO: Check related object exists
    result = await objects_collection.insert_one({
        'tp': tp,
        'data': data,
        'project_id': ObjectId(project_id),
        'labels': [l.model_dump(mode='json') for l in labels],
        'relations': [
            {
                'name': r.name,
                'object_id': ObjectId(r.object_id),
                'source_task': r.source_task.model_dump(mode='json') if r.source_task else None
            }
            for r in relations
        ],
        'created_task_id': created_task_id
    })

    return Object.model_validate(await objects_collection.find_one({ '_id': result.inserted_id }))


class ExtendedObject(Object):
    class RelatedObject(pydantic.BaseModel):
        relation_name: str
        object: Object
        source_task: t.Optional[Relation.SourceTask] = None

    related_objects: t.Optional[list[RelatedObject]] = None


@router.get('/api/objects/{object_id}', tags=['objects'])
async def get_object(object_id: str, include_related: bool = False) -> ExtendedObject:
    obj = await objects_collection.find_one({ '_id': ObjectId(object_id) })
    if obj is None: raise fastapi.HTTPException(status_code=404)

    related_objects = await objects_collection.find({ 'relations.object_id': ObjectId(object_id) }).to_list(None) \
        if include_related else None

    related_objects = None
    if include_related:
        objs = await objects_collection.find({ 'relations.object_id': ObjectId(object_id) }).to_list(None)

        # TODO: Think about mongo aggregations
        # TODO: Think if object has multiple relations to object (dublication)
        related_objects = []
        bson_object_id = ObjectId(object_id)
        for o in objs:
            for r in o['relations']:
                if r['object_id'] == bson_object_id:
                    related_objects.append({
                        'relation_name': r['name'],
                        'source_task': r['source_task'],
                        'object': o
                    })

    return {
        **obj,
        'related_objects': related_objects
    }


@router.get('/api/objects/{object_id}/related', tags=['objects'])
async def get_related_objects(object_id: str) -> list[ExtendedObject.RelatedObject]:
    bson_object_id = ObjectId(object_id)
    objs = await objects_collection.find({ 'relations.object_id': ObjectId(bson_object_id) }).to_list(None)

    # TODO: Think about mongo aggregations
    # TODO: Think if object has multiple relations to object (dublication)
    related_objects = []
    for o in objs:
        for r in o['relations']:
            if r['object_id'] == bson_object_id:
                related_objects.append({
                    'relation_name': r['name'],
                    'source_task': r['source_task'],
                    'object': o
                })

    return related_objects


class CreateRelatedObject(pydantic.BaseModel):
    class RelatedObject(pydantic.BaseModel):
        tp: str
        data: dict
        relations: list[Relation] = []

    related_object: RelatedObject
    relation_name: str


@router.post('/api/projects/{project_id}/objects/{object_id}/related', tags=['objects'])
async def create_related_object(
    project_id: str,
    object_id: str,
    body: CreateRelatedObject
) -> Object:
    """
    Create object and make it ralated to `object_id`.
    """
    return await create_object(project_id, body.related_object.tp, body.related_object.data, relations=[
        Relation(name=body.relation_name, object_id=object_id)
    ])


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


@router.get('/api/projects/{project_id}/objects', tags=['objects'])
async def get_objects_list(
    project_id: str,
    q: t.Optional[str] = None
) -> list[Object]:
    print('Query', type(q))

    additioanl_filters = { }
    if q is not None:
        # additioanl_filters['$or'] = query_to_filter(q)
        additioanl_filters['$and'] = query_to_filter(q)

    return await objects_collection.find({ 'project_id': ObjectId(project_id), **additioanl_filters }).sort({'_id': -1}).to_list(100)


@router.patch('/api/projects/{project_id}/objects/{object_id}', tags=['objects'])
async def update_object(
    project_id: str,
    object_id: str,
    labels: t.Annotated[t.Optional[list[Label]], fastapi.Body()] = [],
    placeholder: t.Annotated[t.Optional[str], fastapi.Body()] = None,
):
    await objects_collection.update_one({ '_id': ObjectId(object_id) }, {
        '$push': {
            'labels': {
                '$each': [
                    l.model_dump(mode='json')
                    for l in labels
                ]
            }
        }
    })
