from aio_pika import connect
from aio_pika.abc import AbstractIncomingMessage
from bson import ObjectId

from settings import RQ_CONNECTION_STRING, RQ_EXCHANGE_NAME
from .db import agents_collection, tasks_collection
from .subscribers import SUBSCRIBERS
from . import models

async def handle_event(event: models.Event):
    domain, kind = event.type.value.split('.')
    if domain == 'agent':
        if kind == 'connected':
            data = models.AgentConnectedData.model_validate(event.data)
            agents_collection.update_one({ 'id': data.id }, { '$set': data.model_dump(mode='json') }, upsert=True)
        elif kind == 'disconnected':
            data = models.AgentDisconnectedData.model_validate(event.data)
            agents_collection.update_one({ 'id': data.id }, { '$set': { 'status': 'disconnected' } })
    elif domain == 'task':
        if kind == 'created':
            data = models.TaskCreatedData(**event.data)
            data = data.model_dump(mode='json')
            data['_id'] = data.pop('id')
            tasks_collection.insert_one(data)
        elif kind == 'updated':
            data = models.TaskUpdatedData(**event.data)
            update = data.model_dump(mode='json', exclude_none=True)
            id = update.pop('id')
            if data.outputs is not None:
                tasks_collection.update_one({ '_id': id }, { '$set': {
                        f'outputs.{k}': v
                        for k, v in data.outputs.items()
                }})
            # tasks_collection.update_one({ '_id': id }, { '$push': data.outputs })
        elif kind == 'completed':
            data = models.TaskCompletedData(**event.data)
            update = data.model_dump(mode='json', exclude_none=True)
            id = update.pop('id')
            tasks_collection.update_one({ '_id': id }, { '$set': update })


async def consume_events() -> None:
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
                    event = models.Event.model_validate_json(message.body)
                    await handle_event(event)
                    for listener in SUBSCRIBERS.values():
                        listener.put_nowait(event.model_dump_json())
            except Exception:
                import traceback
                traceback.print_exc()
                print('Processing error for message %r', message)