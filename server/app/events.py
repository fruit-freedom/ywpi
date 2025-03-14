from aio_pika import connect
from aio_pika.abc import AbstractIncomingMessage
from bson import ObjectId

from app.settings import RQ_CONNECTION_STRING, RQ_EXCHANGE_NAME
from .db import agents_collection, tasks_collection
from .subscribers import SUBSCRIBERS
from . import models

from .db import objects_collection
from app.routes.objects import create_object, Relation


async def create_objects_from_event_data(data: models.TaskUpdatedData):
    agent: dict = await agents_collection.find_one({ 'id': data.agent_id }, { 'project': 1 })
    task: dict = await tasks_collection.find_one({ '_id': data.id }, { 'borrowed_fields': 1 })

    print('----')
    print('create_objects_from_event_data', data)
    print('task', task)
    print('----')

    if data.outputs is not None:
        for key, value in data.outputs.items():
            try:
                if isinstance(value, str):
                    await create_object(agent['project'], 'text', { 'text': value }, relations=[
                        Relation(object_id=rel_input['object_id'], name=rel_input['path'])
                        for rel_input in task.get('borrowed_fields', {}).values()
                    ])
            except Exception as e:
                print(e)


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

            id = data.pop('id')
            tasks_collection.update_one({ '_id': id }, {
                '$set': data
            }, upsert=True)

        elif kind == 'updated':
            data = models.TaskUpdatedData(**event.data)
            update = data.model_dump(mode='json', exclude_none=True)
            id = update.pop('id')
            if data.outputs is not None:
                tasks_collection.update_one({ '_id': id }, { '$set': {
                        f'outputs.{k}': v
                        for k, v in data.outputs.items()
                }})
            if data.status is not None:
                tasks_collection.update_one({ '_id': id }, { '$set': {
                        'status': data.status
                }})
            await create_objects_from_event_data(data)
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