import asyncio

import fastapi
import aiochannel

import uvicorn

from .events import consume_events
from .subscribers import SUBSCRIBERS

from .routes.projects import router as projects_router
from .routes.objects import router as objects_router
from .routes.tasks import router as tasks_router
from .execution_manager import router as execution_managers_router
from .routes.contexts import router as contexts_router
from .routes.webhook import router as webhooks_router

router = fastapi.APIRouter()


@router.websocket("/api/ws")
async def websocket_endpoint(websocket: fastapi.WebSocket):
    await websocket.accept()
    channel = aiochannel.Channel()
    SUBSCRIBERS['a-1'] = channel

    async for message in channel:
        await websocket.send_text(message)


async def lifespan(app):
    consume_events_task = asyncio.create_task(consume_events())
    yield
    consume_events_task.cancel()


def main():
    uvicorn.run(
        'server.main:app',
        host='0.0.0.0',
        port=5011,
        reload=True,
        timeout_graceful_shutdown=0.5,
        reload_excludes=['agents/**'],
    )


app = fastapi.FastAPI(lifespan=lifespan)
app.include_router(router)
app.include_router(tasks_router)
app.include_router(projects_router)
app.include_router(objects_router)
app.include_router(execution_managers_router)
app.include_router(contexts_router)
app.include_router(webhooks_router)

if __name__ == '__main__':
    main()
