import typing as t

import fastapi
import pydantic

from db import objects_collection


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


router = fastapi.APIRouter()


@router.post('/api/objects')
async def create_object(
    tp: t.Annotated[str, fastapi.Body()],
    data: t.Annotated[dict, fastapi.Body()]
) -> Object:
    result = await objects_collection.insert_one(Object(
        tp=tp,
        data=data
    ).model_dump(mode='json'))

    return await objects_collection.find_one({ '_id': result.inserted_id })


# @router.post('/api/objects')
# async def create_document_object(
#     tp: t.Annotated[str, fastapi.Body()],
#     data: t.Annotated[dict, fastapi.Body()]
# ) -> Object:
#     result = await objects_collection.insert_one(Object(
#         tp=tp,
#         data=data
#     ).model_dump(mode='json'))

#     return await objects_collection.find_one({ '_id': result.inserted_id })


@router.get('/api/objects')
async def get_objects_list() -> list[Object]:
    return await objects_collection.find().to_list(None)





