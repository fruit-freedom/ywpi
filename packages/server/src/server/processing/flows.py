import asyncio
import typing
import traceback

from aiochannel import Channel

from .common import Reference
from .chains import Scope
from .flow_nodes import RunnerFlowNode, ReduceFlowNode, MapFlowNode

import settings

class YieldChannel:
    class EndProcessingMessage: pass

    def __init__(self, target_refs: dict[Reference, str], max_size: int = 0) -> None:
        self.target_refs = target_refs
        self.channel = Channel(max_size)

    def __aiter__(self):
        return self

    async def __anext__(self):
        return await self.channel.__anext__()

    async def put(self, scope: Scope, idx: int | None = None):
        payload = { name: scope[ref] for ref, name in self.target_refs.items() }
        if len(payload):
            await self.channel.put((payload, idx))

    def close(self):
        self.channel.close()

    async def send_end_processing_message(self):
        await self.channel.put((YieldChannel.EndProcessingMessage(), None))

class AbstractFlow:
    """
    A part of graph execution.
    Difference between runner and flow is that they operate with scope directly.
    Runner know nothing about scope. Flow operate with other `Flow`s or `FlowNode`s.

    - Update scope inplace.
    """
    async def run(self, scope: Scope, channel: YieldChannel | None = None): raise NotImplementedError()

class LinearFlow(AbstractFlow):
    def __init__(self, steps: list[RunnerFlowNode | AbstractFlow]) -> None:
        self.steps = steps

    async def run(self, scope: Scope, channel: YieldChannel | None = None):
        try:
            for step in self.steps:
                if isinstance(step, RunnerFlowNode):
                    inputs = scope.resolve_references(step.inputs)
                    outputs = await step.run(inputs)
                    scope.update({ step.outputs[key]: outputs[key] for key in step.outputs })
                elif isinstance(step, AbstractFlow):
                    await step.run(scope, channel)
                else:
                    raise RuntimeError()
        except BaseException as e:
            await channel.send_end_processing_message()
            raise e

async def wrapper(
    coro: typing.Coroutine,
    deps: tuple[typing.Awaitable] | None = None,
    callback: typing.Callable | None = None,
    error_callback: typing.Callable | None = None
):
    try:
        if deps:
            await asyncio.gather(*deps)
        return await coro
    except Exception as e:
        print(traceback.format_exc())
        if error_callback:
            error_callback(e)
    finally:
        if callback:
            callback()

CREATE_TASK_SEMAPHORE = asyncio.Semaphore(settings.MAX_PARALLEL_TASKS)

async def create_task(
    coro: typing.Coroutine,
    deps: tuple[typing.Awaitable] | None = None,
    error_callback: typing.Callable | None = None
):
    await CREATE_TASK_SEMAPHORE.acquire()
    return asyncio.create_task(
        wrapper(
            coro,
            deps=deps,
            callback=lambda: CREATE_TASK_SEMAPHORE.release(),
            error_callback=error_callback
        )
    )

class MapReduceFlow(AbstractFlow):
    """
    Map reduce usually have one sequence for `map`
    and parallel or sequence (if order required) for reduce.
    `flow`
    """
    def __init__(self, map: MapFlowNode, flow: AbstractFlow, reduce: ReduceFlowNode) -> None:
        self.map = map
        self.flow = flow
        self.reduce = reduce
        self.exception: Exception | None = None

    async def run_reduce(self, scope: Scope, channel: YieldChannel | None):
        await self.reduce.reduce(scope.resolve_references(self.reduce.inputs))
        if channel:
            await channel.put(scope)

    def error_callback(self, exc):
        self.exception = exc

    async def run(self, global_scope: Scope, channel: YieldChannel | None = None):
        last_reduce_task: asyncio.Future | None = None

        try:
            async for outputs in self.map.run(global_scope.resolve_references(self.map.inputs)):
                if self.exception:
                    raise asyncio.CancelledError()

                scope = global_scope.copy()
                scope.update({ self.map.outputs[key]: outputs[key] for key in self.map.outputs })
                flow_task = await create_task(self.flow.run(scope), error_callback=self.error_callback)

                awaits = (flow_task, last_reduce_task) if last_reduce_task else (flow_task,) # Or (flow_task,)
                reduce_task = await create_task(self.run_reduce(scope, channel), awaits, error_callback=self.error_callback)

                last_reduce_task = reduce_task

            if last_reduce_task:
                await last_reduce_task
            outputs = await self.reduce.run({})
            global_scope.update({ self.reduce.outputs[key]: outputs[key] for key in self.reduce.outputs })
        except BaseException as e:
            # TODO: Cancel all pending tasks
            await channel.send_end_processing_message()
            raise e

class ParallelFlow(AbstractFlow):
    def __init__(self, steps: list[RunnerFlowNode | AbstractFlow]) -> None:
        self.steps = steps

    async def run_parallel(self, step, scope):
        inputs = scope.resolve_references(step.inputs)
        outputs = await step.run(inputs)
        scope.update({ step.outputs[key]: outputs[key] for key in step.outputs })

    async def run(self, scope: Scope, channel: YieldChannel | None = None):
        tasks: list[asyncio.Task] = []
        for step in self.steps:
            if isinstance(step, RunnerFlowNode):
                tasks.append(await create_task(self.run_parallel(step, scope)))
            elif isinstance(step, AbstractFlow):
                raise NotImplementedError()
            else:
                raise RuntimeError(f'{type(step)}')
        await asyncio.gather(*tasks)

class BatchFlow(AbstractFlow):
    """
    Map reduce usually have one sequence for `map`
    and parallel or sequence (if order required) for reduce.
    `flow`
    """
    def __init__(self, scopes: list[Scope], flow: AbstractFlow) -> None:
        self.scopes = scopes
        self.flow = flow
        self.exception: Exception | None = None

    async def process_scope(self, scope: Scope, idx: int, channel: YieldChannel | None):
        await self.flow.run(scope)
        if channel:
            await channel.put(scope, idx)

    def error_callback(self, exc):
        self.exception = exc

    async def run(self, global_scope: Scope, channel: YieldChannel | None = None):
        tasks: list[asyncio.Task] = []

        try:
            for scope_idx, batch_scope in enumerate(self.scopes):
                if self.exception:
                    raise asyncio.CancelledError()

                scope = global_scope.copy()
                scope.update_from_scope(batch_scope)
                tasks.append(
                    await create_task(self.process_scope(scope, scope_idx, channel), error_callback=self.error_callback)
                )

            await asyncio.gather(*tasks)
        except BaseException as e:
            # TODO: Cancel all pending tasks
            await channel.send_end_processing_message()
            raise e
