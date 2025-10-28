import asyncio
import concurrent.futures
import traceback
from dataclasses import dataclass
import typing as t
from contextlib import asynccontextmanager

from aiochannel import Channel


from ywpi_hub.app import HubApp
# Remember that this process has two copies of same file: `ywpi.hub_models` and `ywpi_hub.hub_models`
# Use it with attention: agent part should use `ywpi.hub_models` while
# hub part should use `ywpi_hub.hub_models`
from ywpi import hub_models as ywpi_models

from ywpi import SimpleMethodExecuter
from ywpi import RegisteredMethod
from ywpi import Exchanger, Channel as SyncChannel

# Disable twice registered logging
from ywpi.logger import logger
logger.handlers.pop()

import logging
logger = logging.getLogger('app')
logger.setLevel(logging.ERROR)


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
