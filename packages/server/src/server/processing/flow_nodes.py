import typing

from .common import Reference
from .runners import AbstractReduce, AbstractMap, AbstractRunner

class AbstractFlowNode:
    """
    A part of execution graph.
    """
    def __init__(
            self,
            inputs: dict[str, Reference] = {},
            outputs: dict[str, Reference] = {}
        ) -> None:
        self.inputs: dict[str, Reference] = inputs
        self.outputs: dict[str, Reference] = outputs

class ReduceFlowNode(AbstractFlowNode):
    def __init__(self, runner: AbstractReduce, inputs: dict[str, Reference] = {}, outputs: dict[str, Reference] = {}) -> None:
        super().__init__(inputs, outputs)
        self.runner = runner

    async def reduce(self, inputs: dict[str, typing.Any]):
        return await self.runner.reduce(inputs)

    async def run(self, inputs: dict[str, typing.Any]):
        return await self.runner.run(inputs)

class MapFlowNode(AbstractFlowNode):
    def __init__(self, runner: AbstractMap, inputs: dict[str, Reference] = {}, outputs: dict[str, Reference] = {}) -> None:
        super().__init__(inputs, outputs)
        self.runner = runner

    async def run(self, inputs: dict[str, typing.Any]):
        counter = 0
        async for outputs in self.runner.run(inputs):
            yield outputs
            # counter += 1
            # if counter >= 4:
            #     break

class RunnerFlowNode(AbstractFlowNode):
    def __init__(self, runner: AbstractRunner, inputs: dict[str, Reference] = {}, outputs: dict[str, Reference] = {}) -> None:
        super().__init__(inputs, outputs)
        self.runner = runner

    async def run(self, inputs: dict[str, typing.Any]):
        return await self.runner.run(inputs)
