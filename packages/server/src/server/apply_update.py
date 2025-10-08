from bson import ObjectId

from server.db import contexts_collection


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
