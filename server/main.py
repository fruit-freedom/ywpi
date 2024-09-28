import json
import asyncio

import fastapi
import aiochannel
from aio_pika import connect
from aio_pika.abc import AbstractIncomingMessage

from settings import RQ_CONNECTION_STRING, RQ_EXCHANGE_NAME


router = fastapi.APIRouter()
LISTENERS: dict[str, aiochannel.Channel] = {}

@router.websocket("/api/ws")
async def websocket_endpoint(websocket: fastapi.WebSocket):
    """Websocket endpoint for real-time AI responses."""
    await websocket.accept()
    channel = aiochannel.Channel()
    LISTENERS['a-1'] = channel

    async for message in channel:
        await websocket.send_json(message)

async def consumer_loop() -> None:
    print(f'Start consuming events from {RQ_CONNECTION_STRING} {RQ_EXCHANGE_NAME}')

    # Perform connection
    connection = await connect(RQ_CONNECTION_STRING)

    # Creating a channel
    channel = await connection.channel()
    exchange = await channel.get_exchange(RQ_EXCHANGE_NAME)

    # Declaring queue (Queue MUST be durable for preventing events disappearing)
    queue = await channel.declare_queue('server.queue', durable=False)

    # Bind queue to exchanger for listening all events
    await queue.bind(exchange, '#')

    async with queue.iterator() as qiterator:
        message: AbstractIncomingMessage
        async for message in qiterator:
            try:
                async with message.process(requeue=False):
                    print('Message:', json.loads(message.body))
                    for listener in LISTENERS.values():
                        listener.put_nowait(json.loads(message.body))
            except Exception:
                print('Processing error for message %r', message)

async def lifespan(app):
    consumer_task = asyncio.create_task(consumer_loop())
    yield
    consumer_task.cancel()

app = fastapi.FastAPI(lifespan=lifespan)
app.include_router(router)
