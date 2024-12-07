# import asyncio
# import typing
# import aiochannel

# import hub_pb2


# class RPC:
#     pass

# # Communication without high level logic
# # Call method (send and wait respond back)
# # Iterate throw rpc
# class Channel:
#     def __init__(self, input_channel: typing.AsyncIterable[hub_pb2.Message]) -> None:
#         self._outgoings_requests: dict[str, asyncio.Future] = {}

#         self._input_channel = input_channel
#         self.output_channel: aiochannel.Channel[hub_pb2.Message] = aiochannel.Channel()
#         self._reader_task = asyncio.create_task(self._reader())

#     async def close(self):
#         # AGENTS.pop(self.agent_id, None)
#         self._reader_task.cancel()

#     async def _write_request_message(self, rpc: hub_pb2.Rpc, payload: str, reply_to: str):
#         self.output_channel.put_nowait(
#             hub_pb2.Message(
#                 reply_to=reply_to,
#                 request=hub_pb2.RequestMessage(
#                     rpc=rpc,
#                     payload=payload
#                 )
#             )
#         )

#     async def _write_response_message(
#         self,
#         reply_to: str,
#         payload: str | None = None,
#         error: str | None = 'undefined'
#     ):
#         args = { 'payload': payload } if payload else { 'error': error }
#         self.output_channel.put_nowait(
#             hub_pb2.Message(
#                 reply_to=reply_to,
#                 response=hub_pb2.ResponseMessage(
#                     **args
#                 )
#             )
#         )
#         logger.debug(f'Write request message "{reply_to}"')


#     async def __aiter__(self): return self

#     async def __anext__(self) -> RPC:
#         pass

#     # @with_exception_logging
#     async def _reader(self):
#         async for message in self._input_channel:
#             # Bug in aiochannel pkg: `def __aiter__(self) -> "Channel":` no type
#             message: hub_pb2.Message
#             attr = message.__getattribute__(message.WhichOneof('message'))
#             logger.debug(f'Read message "{message.reply_to}"')

#             if isinstance(attr, hub_pb2.ResponseMessage):
#                 await self._handle_response(message.reply_to, attr)
#             elif isinstance(attr, hub_pb2.RequestMessage):
#                 logger.info(f'Recieve rpc "{hub_pb2.Rpc.Name(attr.rpc)}"')
#                 await self._handle_request(message.reply_to, attr)
#             else:
#                 logger.warning(f'Recieved unexpected message type {type(attr)}')

#     async def _call(self, rpc: hub_pb2.Rpc, payload: str) -> hub_pb2.ResponseMessage:
#         reply_to = str(uuid.uuid4())
#         future = asyncio.Future()
#         self._outgoings_requests[reply_to] = future
#         await self._write_request_message(rpc, payload, reply_to)
#         try:
#             return await asyncio.wait_for(future, timeout=1.0)
#         finally:
#             pass
