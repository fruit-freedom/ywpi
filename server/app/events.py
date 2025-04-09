from aio_pika import connect
from aio_pika.abc import AbstractIncomingMessage
from bson import ObjectId
import traceback

from .settings import RQ_CONNECTION_STRING, RQ_EXCHANGE_NAME
from .db import agents_collection, tasks_collection, objects_collection
from .subscribers import SUBSCRIBERS
from . import models

from .db import objects_collection
from .routes.objects import create_object, Relation


def object_from_output(value):
    if isinstance(value, str):
        pass


async def create_objects_from_event_data(data: models.TaskUpdatedData):
    agent: dict = await agents_collection.find_one({ 'id': data.agent_id }, { 'project': 1 })
    task: dict = await tasks_collection.find_one({ '_id': data.id }, { 'borrowed_fields': 1 })


    print('----')
    print('create_objects_from_event_data', data)
    print('task', task)
    print('----')

    # Bind all outputs to all objects
    if data.outputs is not None:
        for key, value in data.outputs.items():
            try:
                if isinstance(value, str):
                    relations = []
                    source_obj = None
                    for relname, relvalue in task.get('borrowed_fields', {}).items():
                        source_obj = await objects_collection.find_one({ '_id': ObjectId(relvalue['object_id']) }, { 'project_id': 1 })
                        relations.append(Relation(object_id=relvalue['object_id'], name=relvalue['path']))

                    if source_obj is not None:
                        await create_object(source_obj['project_id'], 'text', { 'text': value }, relations=relations)
            except Exception as e:
                traceback.print_exc()


async def handle_event(event: models.Event):
    domain, kind = event.type.value.split('.')
    if domain == 'agent':
        if kind == 'connected':
            data = models.AgentConnectedData.model_validate(event.data)
            print('datadata', data)
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