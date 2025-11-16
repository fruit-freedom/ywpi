import typing as t

import fastapi
import pydantic

from server.db import agents_collection, tasks_collection
from server import models
from server.hub_service import hub


async def lifespan(app): 
    yield


router = fastapi.APIRouter(lifespan=lifespan)


@router.get('/api/tasks', tags=['tasks'])
async def get_tasks(agent_id: str = None) -> list[models.Task]:
    find_expr = {}
    if agent_id is not None:
        find_expr.update({ 'agent_id': agent_id })

    # Await hub's generated partly ordered ObjectID
    return await tasks_collection.find(find_expr).sort('_id', -1).limit(20).to_list(1024)


@router.get('/api/agents', tags=['tasks'])
async def get_agents() -> list[models.Agent]:
    return await agents_collection.find({}).to_list(1024)


class BorrowebField(pydantic.BaseModel):
    object_id: str = pydantic.Field(alias='objectId') # Object ID
    path: str # Path in object dict


class CreateTaskBody(pydantic.BaseModel):
    agent_id: str
    method: str
    inputs: dict
    borrowed_fields: t.Optional[dict[str, BorrowebField]] = None
    require_context: t.Optional[bool] = None
    silent: bool = False


@router.post('/api/tasks', tags=['tasks'])
async def create_task(body: CreateTaskBody):
    """Run task async"""
    task_id = await hub.execute_method_async(
        agent_id=body.agent_id,
        method_name=body.method,
        inputs=body.inputs
    )

    # if body.require_context is not None:
    #     # TODO: Race condition!
    #     # We could recieve update events BEFORE this upsert that will be lost
    #     obj = await create_object('67b0a2454e82f0a2172ebb47', 'chat', {})

    #     await tasks_collection.update_one({ '_id': response.task_id }, {
    #         '$set': {
    #             'context_id': ObjectId(obj.id)
    #         }
    #     }, upsert=True)

    # TODO: Add borrowed fields verification
    if body.borrowed_fields is not None:
        print(f'Upserting task {task_id}', {'borrowed_fields': body.borrowed_fields})
        await tasks_collection.update_one({ '_id': task_id }, {
            '$set': {
                'borrowed_fields': { k: v.model_dump(mode='json') for k, v in body.borrowed_fields.items() }
            }
        }, upsert=True)

    return {
        'task_id': task_id
    }


@router.post('/api/run_task', tags=['tasks'])
async def run_task_sync(body: CreateTaskBody):
    print(body)
    return await hub.execute_method(
        agent_id=body.agent_id,
        method_name=body.method,
        inputs=body.inputs,
        silent=body.silent
    )



# TODO: Get fields verification

# class RelatedInput(pydantic.BaseModel):
#     object_id: str # Object ID
#     path: str # Path in object dict


# @router.post('/api/tasks/create_from_objects')
# async def run_task(body: CreateTaskBody):
#     from app.db import objects_collection
#     from bson import ObjectId

#     params = {}
#     related_inputs = []
#     for key, value in body.inputs.items():
#         if isinstance(value, dict):
#             rel_input = RelatedInput.model_validate(value)
#             obj = await objects_collection.find_one({ '_id': ObjectId(rel_input.object_id) })
#             if obj is None:
#                 raise fastapi.HTTPException(status_code=404, detail=f'related object {rel_input.object_id} not found')
#             param = obj['data'][rel_input.path]
#             params[key] = param
#             related_inputs.append({
#                 'object_id': ObjectId(rel_input.object_id),
#                 **rel_input.model_dump(mode='json', exclude=['object_id'])
#             })
#         else:
#             params[key] = value

#     # Insert related inputs as `related_inputs`
#     # Insert "decoded" inputs

#     # Run task sync
#     response: hub_pb2.PushTaskResponse = await hub_stub.PushTask(
#         hub_pb2.PushTaskRequest(
#             agent_id=body.agent_id,
#             method=body.method,
#             params=json.dumps(params),
#         )
#     )

#     if response.HasField('error'):
#         raise fastapi.HTTPException(status_code=500, detail=response.error)

#     await tasks_collection.update_one({ '_id': response.task_id }, {
#         '$set': {
#             'related_inputs': related_inputs
#         }
#     }, upsert=True)

#     return {
#         'task_id': response.task_id
#     }

