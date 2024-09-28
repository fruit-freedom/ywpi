import asyncio
import json

from aio_pika import connect
from aio_pika.abc import AbstractIncomingMessage

from settings import RQ_EXCHANGE_NAME, RQ_CONNECTION_STRING

QUEUE_NAME = 'server.events'

async def main() -> None:
    print(f'Start consuming events from {RQ_CONNECTION_STRING} {RQ_EXCHANGE_NAME}')

    # Perform connection
    connection = await connect(RQ_CONNECTION_STRING)

    # Creating a channel
    channel = await connection.channel()
    exchange = await channel.get_exchange(RQ_EXCHANGE_NAME)

    # Declaring queue (Queue MUST be durable for preventing events disappearing)
    queue = await channel.declare_queue(QUEUE_NAME, durable=False)

    # Bind queue to exchanger for listening all events
    await queue.bind(exchange, '#')

    async with queue.iterator() as qiterator:
        message: AbstractIncomingMessage
        async for message in qiterator:
            try:
                async with message.process(requeue=False):
                    print('Message:', json.loads(message.body))
            except Exception:
                print('Processing error for message %r', message)

if __name__ == "__main__":
    asyncio.run(main())
