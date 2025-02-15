import json
import asyncio

import fastapi
import pydantic
import aiochannel
import grpc

from app import hub_pb2
from app import hub_pb2_grpc
import uvicorn

from . import models
from .events import consume_events
from .subscribers import SUBSCRIBERS
from .db import agents_collection, tasks_collection

from .routes.projects import router as projects_router

router = fastapi.APIRouter()

hub_sub: hub_pb2_grpc.HubStub = None


@router.websocket("/api/ws")
async def websocket_endpoint(websocket: fastapi.WebSocket):
    await websocket.accept()
    channel = aiochannel.Channel()
    SUBSCRIBERS['a-1'] = channel

    async for message in channel:
        await websocket.send_text(message)


@router.get('/api/tasks')
async def get_tasks(agent_id: str = None) -> list[models.Task]:
    find_expr = {}
    if agent_id is not None:
        find_expr.update({ 'agent_id': agent_id })

    # Await hub's generated partly ordered ObjectID
    return await tasks_collection.find(find_expr).sort('_id', -1).limit(20).to_list(1024)


@router.get('/api/agents')
async def get_agents() -> list[models.Agent]:
    return await agents_collection.find({}).to_list(1024)


class CreateTaskBody(pydantic.BaseModel):
    agent_id: str
    method: str
    inputs: dict


@router.post('/api/tasks')
async def create_task(body: CreateTaskBody):
    response: hub_pb2.PushTaskResponse = await hub_sub.PushTask(
        hub_pb2.PushTaskRequest(
            agent_id=body.agent_id,
            method=body.method,
            params=json.dumps(body.inputs),
        )
    )
    return {
        'task_id': response.task_id
    }


@router.post('/api/run_task')
async def run_task(body: CreateTaskBody):
    response: hub_pb2.RunTaskResponse = await hub_sub.RunTask(
        hub_pb2.PushTaskRequest(
            agent_id=body.agent_id,
            method=body.method,
            params=json.dumps(body.inputs),
        )
    )

    if response.HasField('error'):
        raise fastapi.HTTPException(status_code=500, detail=response.error)

    return json.loads(response.outputs)


async def lifespan(app):
    global hub_sub
    consume_events_task = asyncio.create_task(consume_events())
    async with grpc.aio.insecure_channel('localhost:50051') as channel:
        hub_sub = hub_pb2_grpc.HubStub(channel)
        yield
    consume_events_task.cancel()


def main():
    uvicorn.run(
        'app.main:app',
        port=5011,
        reload=True,
        timeout_graceful_shutdown=0.5,
        reload_excludes=['agents/**'],
    )

app = fastapi.FastAPI(lifespan=lifespan)
app.include_router(router)
app.include_router(projects_router)


if __name__ == '__main__':
    main()
