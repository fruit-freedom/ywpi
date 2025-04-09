import asyncio
import json
import typing as t

import bson
import grpc
import pydantic
import fastapi

from .db import objects_collection, execution_managers_collection
from . import hub_pb2
from . import hub_pb2_grpc


PyObjectId = t.Annotated[str, pydantic.BeforeValidator(str)]


class ExecutionManagerDTO(pydantic.BaseModel):
    id: PyObjectId = pydantic.Field(alias='_id', serialization_alias='id', default=None)
    agent: str
    method: str
    last_uid: PyObjectId = None



class ExecutionManager:
    def __init__(
        self,
        agent: str,
        method: str,
        id: str = None,
        last_uid: str = None
    ):
        self._id = id
        self._agent = agent
        self._method = method
        self._last_uid = last_uid
        self._task = asyncio.create_task(self._background_loop())
        print('Init execution manager')

    def stop(self):
        self._task.cancel()

    async def _background_loop(self):
        async with grpc.aio.insecure_channel('localhost:50051') as channel:
            hub_stub = hub_pb2_grpc.HubStub(channel)
            while True:
                try:
                    find_expr = {}
                    if self._last_uid is not None:
                        find_expr.update({ '_id': { '$gt': bson.ObjectId(self._last_uid) } })
                    items = await objects_collection.find(find_expr).sort({ '_id': 1 }).limit(1).to_list()
                    if len(items):
                        obj = items[0]
                        if obj['tp'] == 'pdf':
                            response: hub_pb2.RunTaskResponse = await hub_stub.RunTask(
                                hub_pb2.PushTaskRequest(
                                    agent_id=self._agent,
                                    method=self._method,
                                    params=json.dumps({
                                        'pdf': {
                                            'id': str(obj['_id']),
                                            'tp':  obj['tp'],
                                            'data': {
                                                **obj['data']
                                            }
                                        }
                                    }),
                                )
                            )

                            if response.HasField('error'):
                                print(f'[EM] Error: {response.error}')
                        
                        new_last_uid = str(obj['_id'])
                        execution_managers_collection.update_one({ '_id': bson.ObjectId(self._id) }, { '$set': {
                            'last_uid': new_last_uid
                        } })
                        self._last_uid = new_last_uid
                except:
                    import traceback
                    traceback.print_exc()
                print('[EM] Pool', self._id)
                await asyncio.sleep(10)


MANAGERS: dict[str, ExecutionManager] = {}


async def lifespan(app):
    ems = await execution_managers_collection.find().to_list(None)
    for em in ems:
        em = ExecutionManagerDTO.model_validate(em)
        print('Perfrom EM creation', em)
        MANAGERS[em.id] = ExecutionManager(
            em.agent,
            em.method,
            em.id,
            em.last_uid
        )
    yield


router = fastapi.APIRouter(lifespan=lifespan)


@router.post('/ems/{em_id}/reset')
async def reset_execution_manager(em_id: str):
    em = MANAGERS.pop(em_id, None)
    if em is None:
        raise fastapi.HTTPException(status_code=404, detail='em not found')

    em.stop()
    execution_managers_collection.update_one({ '_id': bson.ObjectId(em_id) }, { '$set': {
        'last_uid': None
    }})

    MANAGERS[em_id] = ExecutionManager(
        em._agent,
        em._method,
        em._id,
        None
    )


