import asyncio
import concurrent.futures
import traceback
from dataclasses import dataclass
import typing as t

from aiochannel import Channel

from ywpi import SimpleMethodExecuter
from ywpi import RegisteredMethod
from ywpi import Exchanger, Channel as SyncChannel
from ywpi_hub.app import HubApp, hub_models

# Remember that this process has two copies of same file: `ywpi.hub_models` and `ywpi_hub.hub_models`
# Use it with attention: agent part should use `ywpi.hub_models` while
# hub part should use `ywpi_hub.hub_models`

from ywpi import hub_models as ywpi_models
from ywpi.logger import logger

logger.handlers.pop()


@dataclass
class Agent:
    id: str
    name: str
    methods: dict[str, RegisteredMethod]


def _serve_agent(
    input_channel: SyncChannel,
    output_channel: SyncChannel,
    agent: Agent
):
    service = SimpleMethodExecuter(agent.methods)

    hello_message = ywpi_models.RegisterAgentRequest(
        id=agent.id,
        name=agent.name,
        project=None,
        description=None,
        methods=service.methods,
    )

    try:
        exchanger = Exchanger(input_channel, output_channel, service)
        result = exchanger.call_register_agent(hello_message)
        good = result.result()
        if good.HasField('error'):
            raise Exception()

        exchanger.finish.result()
    except:
        pass
    finally:
        output_channel.close()


class SyncInput_AsyncOutput(SyncChannel):
    def __aiter__(self):
        return self

    async def __anext__(self):
        def get_item():
            with self.condition:
                while not self.messages and self.running:
                    self.condition.wait()
                if not self.running:
                    # raise Exception()
                    raise StopAsyncIteration()
                return self.messages.pop(0)

        with concurrent.futures.ThreadPoolExecutor() as pool:
            return await asyncio.get_running_loop().run_in_executor(
                pool, get_item
            )


class AsyncInput_SyncOutput_Wrapper(SyncChannel):
    def __init__(self, channel: Channel):
        super().__init__()
        self.channel = channel
        asyncio.create_task(self.background_task(channel))

    async def background_task(self, channel: Channel):
        async for message in channel:
            self.push(message)


async def create_channels(app: HubApp) -> tuple[SyncChannel, SyncChannel]:
    # input_channel: Async Input -> Sync Output (hub_to_agent)
    # output_channel: Sync Input -> Async Output (agent_to_hub)
    # OutputChannel -> Connect -> InputChannel

    output_channel = SyncInput_AsyncOutput()
    async_input_channel = app.Connect(output_channel, None)
    return (AsyncInput_SyncOutput_Wrapper(async_input_channel), output_channel)


async def run_agent(input_channel: SyncChannel, output_channel: SyncChannel, agent: Agent):
    try:
        with concurrent.futures.ThreadPoolExecutor() as pool:
            return await asyncio.get_running_loop().run_in_executor(
                pool,
                _serve_agent,
                input_channel,
                output_channel,
                agent
            )
    except:
        traceback.print_exc()

from contextlib import asynccontextmanager

@asynccontextmanager
async def create_app_with_agents(agents: list[Agent]) -> t.AsyncGenerator[HubApp, None]:
    app = HubApp()
    await app._init()
    input_channel, output_channel = await create_channels(app)
    agents_task = [
        asyncio.create_task(run_agent(input_channel, output_channel, agent))
        for agent in agents
    ]
    
    await asyncio.sleep(0.1) # Sleep required for waiting agent registration

    try:
        yield app
    finally:
        await asyncio.sleep(0.1) # Sleep required for finishing `io_manager.update_task_status` in agent
        input_channel.close()
        await asyncio.wait(agents_task)

import logging
logger = logging.getLogger('app')
logger.setLevel(logging.ERROR)


# async def main():
#     import logging
#     logger = logging.getLogger('app')
#     logger.setLevel(logging.ERROR)

#     def method():
#         print("Method execution")
#         return {
#             "key": "value"
#         }

#     agent = Agent(id="test-agent-id", name="test-agent-name", methods={
#         "method": RegisteredMethod(method, {}, {})
#     })
    
#     async with create_app_with_agents([agent]) as app:
#         @app.on_agent_connected
#         async def func(data):
#             print("Connected", data)

#         try:
#             result = await app.execute_method("test-agent-id", "method", {})
#             print("Re", result)
#         except:
#             traceback.print_exc()
#         print("Hello")


async def test_simple():
    outputs = {
        "key": "value"
    }
    def method():
        return outputs

    agent = Agent(id="test-agent-id", name="test-agent-name", methods={
        "method": RegisteredMethod(method, {}, {})
    })
    
    async with create_app_with_agents([agent]) as app:
        result = await app.execute_method("test-agent-id", "method", {})
        print("Re", result)
        assert result["key"] == outputs["key"] + "s"


async def test_simple_error():
    def method():
        raise RuntimeError()

    agent = Agent(id="test-agent-id", name="test-agent-name", methods={
        "method": RegisteredMethod(method, {}, {})
    })
    
    async with create_app_with_agents([agent]) as app:
        try:
            result = await app.execute_method("test-agent-id", "method", {})
        except hub_models.MethodExecutionError as e:
            assert e.source_exception_type == "RuntimeError"
        except BaseException as e:
            assert False
        else:
            assert False


async def test_custom_data_error():
    import pydantic

    class TestCustomErrorModel(pydantic.BaseModel):
        field: str

    class TestCustomError(BaseException):
        field: str
        serialization_model: TestCustomErrorModel

        def __init__(self, field):
            self.field = field

    def method():
        raise TestCustomError("value")

    agent = Agent(id="test-agent-id", name="test-agent-name", methods={
        "method": RegisteredMethod(method, {}, {})
    })
    
    async with create_app_with_agents([agent]) as app:
        try:
            result = await app.execute_method("test-agent-id", "method", {})
        except hub_models.MethodExecutionError as e:
            assert e.source_exception_type == "TestCustomError"
            assert e.data["field"] == "value"
        except BaseException as e:
            assert False
        else:
            assert False


async def main():
    # await test_simple()
    # await test_simple_error()
    await test_custom_data_error()


# async def main():
#     import logging
#     logger = logging.getLogger('app')
#     logger.setLevel(logging.ERROR)

#     app = HubApp()

#     @app.on_agent_connected
#     async def func(data):
#         print("Connected", data)

#     await app._init()
#     # hub_to_agent, agent_to_hub
#     input_channel, output_channel = await create_channels(app)


#     called = False
#     def method():
#         called = True
#         print("Method execution")

#     agent = Agent(id="test-agent-id", name="test-agent-name", methods={
#         "method": RegisteredMethod(method, {}, {})
#     })
#     task = asyncio.create_task(run_agent(input_channel, output_channel, agent))
#     await asyncio.sleep(0.1) # Sleep required for waiting agent registration

#     try:
#         await app.execute_method("test-agent-id", "method", {})
#     except:
#         traceback.print_exc()

#     await asyncio.sleep(0.1) # Sleep required for finishing `io_manager.update_task_status` in agent
#     input_channel.close()
#     await task
#     print("Hello")


if __name__ == "__main__":
    asyncio.run(main())

