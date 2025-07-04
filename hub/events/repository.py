import asyncio
import logging
import datetime

from aio_pika import Message, connect
import aio_pika

from . import models
from hub import settings

logging.getLogger().setLevel(logging.INFO)

class AbstractEventsQueue:
    def __init__(self) -> None: pass
    async def init(self): pass
    async def produce_event(self, type: models.EventType, data: dict): pass
    async def close(self): pass


class MockEventsQueue(AbstractEventsQueue):
    pass


class RabbitMQEventsQueue(AbstractEventsQueue):
    async def init(self):
        self.connection = await connect(settings.RQ_CONNECTION_STRING)

        # Creating a channel
        channel = await self.connection.channel()

        # Creating an exchange
        self.exchange = await channel.declare_exchange(settings.RQ_EXCHANGE_NAME, aio_pika.ExchangeType.TOPIC)

    async def produce_event(self, type: models.EventType, data: dict):
        event_model = models.Event.model_validate({
            'timestamp': datetime.datetime.now(),
            'type': type,
            'data': data
        })
        await self.exchange.publish(
            Message(body=event_model.model_dump_json().encode()),
            'event.' + type.value
        )

    async def close(self):
        await self.connection.close()


class EventRepository(RabbitMQEventsQueue):
    async def produce_agent_connected(self, payload: dict):
        await self.produce_event(models.EventType.AgentConnected, payload)

    async def produce_agent_disconnected(self, agent_id: str):
        await self.produce_event(models.EventType.AgentDisconnected, { 'id': agent_id })


repository = EventRepository()


async def main():
    await repository.init()
    await repository.produce_event(models.EventType.AgentConnected, { 'id': 1, 'name': 'None' })

if __name__ == "__main__":
    asyncio.run(main())
