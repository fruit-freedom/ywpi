import warnings
warnings.simplefilter("ignore", UserWarning)

import dataclasses

import grpc
import json

import traceback

import hub_pb2_grpc
import hub_pb2

import time

import models
import aiochannel
import uuid


import pydantic
import typing
from logger import logger



def with_exception_logging(func):
    async def decorated(*args, **kwargs):
        try:
            return await func(*args, **kwargs)
        except BaseException as e:
            print(traceback.format_exc())
            raise e
    return decorated

class Exchanger:
    def __init__(self, input_channel) -> None:
        self.incoming_requests: dict[str, asyncio.Future] = {}
        self.outgoings_requests: dict[str, asyncio.Future] = {}

        self.input_channel = input_channel
        self.output_channel: aiochannel.Channel[hub_pb2.Message] = aiochannel.Channel()
        self.reader_task = asyncio.create_task(self._reader())

    async def _write_request_message(self, rpc: hub_pb2.Rpc, payload: str, reply_to: str):
        self.output_channel.put_nowait(
            hub_pb2.Message(
                reply_to=reply_to,
                request=hub_pb2.RequestMessage(
                    rpc=rpc,
                    payload=payload
                )
            )
        )

    async def _write_response_message(self, payload: str, reply_to: str):
        self.output_channel.put_nowait(
            hub_pb2.Message(
                reply_to=reply_to,
                response=hub_pb2.ResponseMessage(
                    payload=payload
                )
            )
        )

    @with_exception_logging
    async def _reader(self):
        async for message in self.input_channel:
            # Bug in aiochannel pkg: `def __aiter__(self) -> "Channel":` no type
            message: hub_pb2.Message
            attr = message.__getattribute__(message.WhichOneof('message'))

            if isinstance(attr, hub_pb2.ResponseMessage):
                if message.reply_to in self.outgoings_requests:
                    future = self.outgoings_requests.pop(message.reply_to)
                    if future.cancelled():
                        logger.warning(f'Recieve timeout response message {message.reply_to}')
                    else:
                        future.set_result(attr)
                else:
                    logger.warning(f'Recieve unexpected response message {message.reply_to}')
            elif isinstance(attr, hub_pb2.RequestMessage):
                logger.info(f'Recieve rpc "{hub_pb2.Rpc.Name(attr.rpc)}"')
                # Some work
                # await self._write_response_message('{ "key": "value" }', message.reply_to)
            else:
                logger.warning(f'Recieved unexpected message type {type(attr)}')

    async def close(self):
        self.reader_task.cancel()

    async def call(self, rpc: hub_pb2.Rpc, payload: str) -> hub_pb2.ResponseMessage:
        id = str(uuid.uuid4())
        future = asyncio.Future()
        self.outgoings_requests[id] = future
        await self._write_request_message(rpc, payload, id)
        try:
            return await asyncio.wait_for(future, timeout=1.0)
        finally:
            pass

@dataclasses.dataclass
class AgentDescription:
    id: str
    methods: list[str]
    exchanger: Exchanger


AGENTS: dict[str, AgentDescription] = { }



class Hub(hub_pb2_grpc.HubServicer):
    async def Connect(self, request_iterator, context: grpc.ServicerContext):
        try:
            request: hub_pb2.Message = await anext(request_iterator)
            message = request.__getattribute__(request.WhichOneof('message'))
            assert isinstance(message, hub_pb2.RequestMessage)

            payload = models.HelloMessage.model_validate_json(message.payload)

            logger.info(f'Connected agent "{payload.id}" with methods {payload.methods}')
            exchanger = Exchanger(request_iterator)
            AGENTS[payload.id] = AgentDescription(id=payload.id, methods=payload.methods, exchanger=exchanger)
        except:
            print(traceback.format_exc())
            logger.warning('Hello message failed')
            return

        try:
            async for message in exchanger.output_channel:
                yield message
        except:
            await exchanger.close()
        finally:
            AGENTS.pop(payload.id)
            logger.info(f'Disconected agent "{payload.id}"')

    async def PushTask(self, request: hub_pb2.PushTaskRequest, context: grpc.ServicerContext):
        logger.info(f'Perform task creation for agent "{request.agent_id}"')
        message = models.StartTaskMessage(
            method=request.method,
            params=json.loads(request.params),
            payload=json.loads(request.payload)
        )
        try:
            response = await AGENTS[request.agent_id].exchanger.call(hub_pb2.RPC_START_TASK, '{ "key": "methods-payload" }')
            print(response)
        except asyncio.TimeoutError as e:
            return hub_pb2.PushTaskResponse(error='Agent timeout error')
        except:
            print(traceback.format_exc())
        return hub_pb2.PushTaskResponse()


async def main():
    server = grpc.aio.server()
    hub_pb2_grpc.add_HubServicer_to_server(Hub(), server)
    server.add_insecure_port("[::]:50051")
    await server.start()
    logger.info('Started and listening on [::]:50051')
    # while True:
    #     await asyncio.sleep(1)
    #     print('Check')
    await server.wait_for_termination()

if __name__ == '__main__':
    import asyncio
    asyncio.run(main())

