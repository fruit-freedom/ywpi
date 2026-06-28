import typing as t
import asyncio

from bson import ObjectId
from pymongo.results import DeleteResult
import pydantic

from server.db import contexts_collection
from server.repositories.utils import PyObjectId


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
    name: t.Optional[str] = None
    subscribtions: list[Subscribtion] = []
    tp: str
    data: dict


def _with_data_keys_prefix(update: dict):
    return {
        f"data.{k}": v
        for k, v in update.items()
    }


_WORD_TO_DKEY = {
    'type': 'type',
    'tp': 'type'
}


def _query_to_filter(q: str):    
    tokens = q.split()
    filters = []
    for t in tokens:
        equasion_splits = t.split('=')
        if len(equasion_splits) > 1: # key=value
            if equasion_splits[0] not in _WORD_TO_DKEY:
                filters.append({
                    'labels.name': equasion_splits[0],
                    'labels.value': equasion_splits[1]
                })
            else:
                filters.append({
                    _WORD_TO_DKEY[equasion_splits[0]]: equasion_splits[1],
                })
        else: # Label
            filters.append({
                'labels.name': equasion_splits[0],
            })
    print(filters)
    return filters


ContextList = pydantic.TypeAdapter(list[Context])


class ContextsRepository:
    async def list_and_count(
        self,
        project_id: str,
        q: t.Optional[str] = None
    ):
        filters = { 'project_id': ObjectId(project_id) }

        if q is not None:
            filters['$and'] = _query_to_filter(q)

        contexts, count = await asyncio.gather(
            contexts_collection.find(filters).to_list(None),
            contexts_collection.estimated_document_count()
        )

        return (ContextList.validate_python(contexts), count)

    async def get(self, context_id: str | ObjectId) -> Context:
        if isinstance(context_id, str):
            context_id = ObjectId(context_id)

        return Context.model_validate(
            await contexts_collection.find_one({ "_id": context_id })
        )

    async def create(self, context: Context) -> Context:
        context_data = context.model_dump(mode='json', by_alias=True)

        project_id = context_data["project_id"]
        if project_id is not None:
            context_data["project_id"] = ObjectId(project_id)
        
        result = await contexts_collection.insert_one(context_data)
        return await self.get(result.inserted_id)

    async def update(
        self,
        context_id: str | ObjectId,
        update: dict[str, t.Any]
    ) -> Context:
        context_id = ObjectId(context_id)
        return await self.apply_context_update(context_id, update)
        # await contexts_collection.update_one({ "_id": context_id }, {
        #     "$set": data
        # })
        # return await self.get()

    async def delete(self, context_id: str | ObjectId) -> DeleteResult:
        if isinstance(context_id, str):
            context_id = ObjectId(context_id)

        result = await contexts_collection.delete_one({ "_id": ObjectId(context_id) })
        if result.deleted_count <= 0:
            return False
        return True

    async def apply_context_update(self, context_id: str | ObjectId, update: dict) -> Context:
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

        if isinstance(context_id, str):
            context_id = ObjectId(context_id)

        mongo_update = {
            '$push': _with_data_keys_prefix(update.get('$push', {})),
            '$set': _with_data_keys_prefix(update.get('$set', {})),
        }

        print('mongo_update', { '_id': context_id }, mongo_update)

        updated_context = await contexts_collection.find_one_and_update(
            { "_id": context_id },
            mongo_update,
            return_document=True
        )
        print('Updated context:', updated_context)

        return Context.model_validate(updated_context)

    async def set_subscribtions(self, context_id: str, subscribtions: list[Subscribtion]) -> Context:
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

    async def add_trace(self, context_id: str, trace: str):
        updated_context = await contexts_collection.find_one_and_update(
            { "_id": ObjectId(context_id) },
            {
                "$push": {
                    "data.tree.root.children": {
                        "direction": None,
                        "format": "",
                        "indent": 0,
                        "type": "paragraph",
                        "version": 1,
                        "textFormat": 0,
                        "textStyle": "",
                        "children": [
                            {
                                "detail": 0,
                                "format": 0,
                                "mode": "normal",
                                "style": "",
                                "text": trace,
                                "type": "text",
                                "version": 1
                            }
                        ],
                    }
                }
            },
            return_document=True
        )
        print('Updated context:', updated_context)


contexts_repository = ContextsRepository()


