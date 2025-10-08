import typing as t

from bson import ObjectId
import pydantic

from server.db import contexts_collection


PyObjectId = t.Annotated[str, pydantic.BeforeValidator(str)]
T = t.TypeVar('T')


class Label(pydantic.BaseModel):
    name: str
    value: t.Optional[str] = None


class Subscribtion(pydantic.BaseModel):
    agent_id: str
    method_name: str


class Context(pydantic.BaseModel):
    """
    MongoDB Collection Item
    """
    id: PyObjectId = pydantic.Field(alias='_id', serialization_alias='id', default=None)
    project_id: t.Optional[PyObjectId] = None
    labels: t.Optional[list[Label]] = None
    subscribtions: list[Subscribtion] = []
    tp: str
    data: dict


def _with_data_keys_prefix(update: dict):
    return {
        f"data.{k}": v
        for k, v in update.items()
    }


async def apply_context_update(context_id: str, update: dict):
    """
    "update": {
        "$push": {
        
        },
        "$set": {

        }
    }
    """
    if update is None:
        return

    if not isinstance(update, dict):
        raise TypeError("context update data should be dictionary")

    if not isinstance(context_id, str):
        raise TypeError("context_id should be str and specified")

    mongo_update = {
        '$push': _with_data_keys_prefix(update.get('$push', {})),
        '$set': _with_data_keys_prefix(update.get('$set', {})),
    }

    print('mongo_update', { '_id': ObjectId(context_id) }, mongo_update)

    updated_context = await contexts_collection.find_one_and_update(
        { "_id": ObjectId(context_id) },
        mongo_update,
        return_document=True
    )
    print('Updated context:', updated_context)

    return updated_context


async def set_subscribtions(context_id: str, subscribtions: list[Subscribtion]) -> Context:
    updated_context = await contexts_collection.find_one_and_update(
        { "_id": ObjectId(context_id) },
        {
            "$set": {
                "subscribtions": [s.model_dump(mode='json') for s in subscribtions]
            }
        },
        return_document=True
    )
    print('Updated context:', updated_context)

    return Context.model_validate(updated_context)
