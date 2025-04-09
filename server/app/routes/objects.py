import typing as t

import fastapi
import pydantic
from bson import ObjectId

from ..db import objects_collection


PyObjectId = t.Annotated[str, pydantic.BeforeValidator(str)]
T = t.TypeVar('T')


class Relation(pydantic.BaseModel):
    name: str
    object_id: PyObjectId
    source_task_id: t.Optional[str] = None


# class Object(pydantic.BaseModel, t.Generic[T]):
class Object(pydantic.BaseModel):
    """
    MongoDB Collection
    """
    id: PyObjectId = pydantic.Field(alias='_id', serialization_alias='id', default=None)
    project_id: PyObjectId
    tp: str
    relations: list[Relation] = []
    data: dict


router = fastapi.APIRouter()


@router.post('/api/projects/{project_id}/objects', tags=['objects'])
async def create_object(
    project_id: str,
    tp: t.Annotated[str, fastapi.Body()],
    data: t.Annotated[dict, fastapi.Body()],
    relations: t.Annotated[t.Optional[list[Relation]], fastapi.Body()] = []
) -> Object:
    print('Creating object', project_id, tp, relations)

    # TODO: Check related object exists
    result = await objects_collection.insert_one({
        'tp': tp,
        'data': data,
        'project_id': ObjectId(project_id),
        'relations': [
            {
                'name': r.name,
                'object_id': ObjectId(r.object_id),
                'source_task_id': None
            }
            for r in relations
        ]
    })

    return Object.model_validate(await objects_collection.find_one({ '_id': result.inserted_id }))


class ExtendedObject(Object):
    class RelatedObject(pydantic.BaseModel):
        relation_name: str
        object: Object

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


@router.get('/api/projects/{project_id}/objects', tags=['objects'])
async def get_objects_list(project_id: str, q: t.Optional[str] = None) -> list[Object]:
    additioanl_filters = { }
    if q is not None:
        additioanl_filters['tp'] = q
    return await objects_collection.find({ 'project_id': ObjectId(project_id), **additioanl_filters }).sort({'_id': -1}).to_list(None)

