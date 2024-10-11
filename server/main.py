import json
import asyncio

import fastapi
import pydantic
import aiochannel
from aio_pika import connect
from aio_pika.abc import AbstractIncomingMessage
import grpc

import hub_pb2
import hub_pb2_grpc
import uvicorn

from settings import RQ_CONNECTION_STRING, RQ_EXCHANGE_NAME


router = fastapi.APIRouter()
LISTENERS: dict[str, aiochannel.Channel] = {}

hub_sub: hub_pb2_grpc.HubStub = None


@router.websocket("/api/ws")
async def websocket_endpoint(websocket: fastapi.WebSocket):
    """Websocket endpoint for real-time AI responses."""
    await websocket.accept()
    channel = aiochannel.Channel()
    LISTENERS['a-1'] = channel

    async for message in channel:
        await websocket.send_json(message)



class Input(pydantic.BaseModel):
    name: str
    type: str

class Method(pydantic.BaseModel):
    name: str
    inputs: list[Input]

class Agent(pydantic.BaseModel):
    id: str
    name: str
    methods: list[Method]

@router.get('/api/agents')
async def get_agents():
    response: hub_pb2.GetAgentsListResponse = await hub_sub.GetAgentsList(hub_pb2.GetAgentsListRequest())
    results = []
    for a in response.agents:
        results.append(
            Agent(
                id=a.id,
                name=a.name,
                methods=[
                    Method(
                        name=m.name,
                        inputs=[ Input(name=i.name, type=i.type) for i in m.inputs ]
                    )
                    for m in a.methods
                ]
            )
        )
    return results


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
    global hub_sub
    consumer_task = asyncio.create_task(consumer_loop())
    async with grpc.aio.insecure_channel('localhost:50051') as channel:
        hub_sub = hub_pb2_grpc.HubStub(channel)
        yield
    consumer_task.cancel()

app = fastapi.FastAPI(lifespan=lifespan)
app.include_router(router)


def main():
    uvicorn.run('server.main:app', port=5011, reload=True)

if __name__ == '__main__':
    main()
