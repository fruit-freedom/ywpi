from typing import Any, Coroutine, AsyncIterator

from .common import Reference
from .steps import BaseStep

class BaseComputeBlock:
    def __init__(self, data: dict = None) -> None:
        self.promised_inputs: dict[str, Reference] = {}
        self.promised_outputs: dict[str, Reference] = {}
        self.conditions: list[Reference] = []

        if 'conditions' in data:
            self.conditions = [*data['conditions']]

        self.mapper = False
        self.reducer = False

    async def initialize(self) -> None: pass

    async def destruct(self) -> None: pass

    async def run(self, promises: dict[str, Any]) -> dict[Reference, Any]: raise NotImplementedError()

    # async def run_generator(self, promises: dict[str, Any]) -> AsyncGenerator[dict[Reference, Any]]: raise NotImplementedError()

class StepComputeBlock(BaseComputeBlock):
    def __init__(self, step_class: type[BaseStep], data: dict) -> None:
        super().__init__(data)
        self.inputs: dict[str, Any] = {} # Hardcoded inputs
        self.params: dict[str, Any] = {}

        self.step_class = step_class
        self.step = step_class()

        self.data = data

        self._add_dependencies_and_resolves(data)

    def _add_dependencies_and_resolves(self, data):
        '''
        This method fill dependencies and promisies lists.

        All steps should have common structure like:
            ```json
            {
                "method": "provider/method-name",
                "conditions": [], // Optinally
                "params": { }, // Optinally
                "inputs": { },
                "outputs": { }
            }
            ```
        Step can resolve `PromiseValue` in `outputs` section and
        recieve `ReferenceValue` in `inputs` section.
        All informations about references and promises provided by
        `get_dependencies()` and `get_resolves()` methods.
        '''

        if len(self.step_class.required_params()) > 0:
            if 'params' not in data:
                raise KeyError(f'Step {self} has not reqired params section')
            params = data['params']
            for name, tp in self.step_class.required_params().items():
                if name not in params:
                    raise KeyError(f'Step {self} has not required params "{name}"')
                self.params[name] = params[name]

        inputs = data['inputs']
        for name, tp in self.step_class.required_inputs().items():
            if name not in inputs:
                raise KeyError(f'Step {self} reqiured "{name}" input')

            arg = inputs[name]
            if type(arg) == Reference:
                self.promised_inputs[name] = arg
            else:
                self.inputs[name] = arg

        outputs = data['outputs']
        for name, value in outputs.items():
            if type(value) != Reference and value is not None:
                raise RuntimeError(f'Step {self} has resolved output "{name}" as "{value}"')
            self.promised_outputs[name] = value

        if '__mapper__' in data:
            self.mapper = True

        if '__reducer__' in data:
            if self.mapper:
                raise RuntimeError('mapper ComputationBlock can be reducer')
            self.reducer = True

    def __repr__(self) -> str:
        return f'ComputationBlock(method="{self.step_class.method()}")'

    async def initialize(self) -> None:
        await self.step.initialize(self.params)

    async def destruct(self):
        await self.step.destruct()

    async def run(self, promises: dict[str, Any]) -> dict[Reference, Any]:
        """
        Assert all reference are resolved and run step.
        """
        # Prepare inputs
        for name in self.promised_inputs:
            if name not in promises:
                raise RuntimeError(f'Step {self} has unresolved input "{name}"')

        # TODO: Debug runtime type checking

        outputs = await self.step.run({**self.inputs, **promises})

        if type(outputs) != dict:
            raise TypeError(f'Step {self} run() does not return dict')

        # Prepare ouputs
        prepared_outputs: dict[Reference, Any] = {}
        for name, tp in self.promised_outputs.items():
            if name not in outputs:
                raise RuntimeError(f'Step {self} does not return "{name}" output')
            
            prepared_outputs[self.promised_outputs[name]] = outputs[name]

        return prepared_outputs

    async def run_generator(self, promises: dict[str, Any]) -> AsyncIterator[dict[Reference, Any]]:
        """
        Assert all reference are resolved and run step.
        """
        assert self.mapper

        # Prepare inputs
        for name in self.promised_inputs:
            if name not in promises:
                raise RuntimeError(f'Step {self} has unresolved input "{name}"')

        # TODO: Debug runtime type checking

        async for outputs in self.step.run_generator({**self.inputs, **promises}):
            if type(outputs) != dict:
                raise TypeError(f'Step {self} run() does not return dict')

            # Prepare ouputs
            prepared_outputs: dict[Reference, Any] = {}
            for name, tp in self.promised_outputs.items():
                if name not in outputs:
                    raise RuntimeError(f'Step {self} does not return "{name}" output')
                
                prepared_outputs[self.promised_outputs[name]] = outputs[name]

            yield prepared_outputs

class MapReduceComputationalBlock(BaseComputeBlock):
    pass

# class ReturnsComputationBlock(BaseComputeBlock):
#     @staticmethod
#     def from_returns(data: dict):
#         inputs: dict[str, Any] = {}
#         promised_inputs: dict[str, Reference] = {}
#         for name, value in data.items():
#             if type(value) == Reference:
#                 promised_inputs[name] = value
#             else:
#                 inputs[name] = value

#         return ReturnsComputationBlock(promised_inputs, inputs)

#     def __init__(self, promised_inputs: dict[str, Reference], inputs: dict[str, Any] = {}) -> None:
#         super().__init__()
#         self.promised_inputs = promised_inputs
#         self.inputs = inputs

#     def __repr__(self) -> str:
#         return f'ReturnsComputationBlock()'

#     async def run(self, promises: dict[str, Any]) -> dict[Reference, Any]:
#         # Check inputs
#         for name in self.promised_inputs:
#             if name not in promises:
#                 raise RuntimeError(f'Return computation block has unresolved input "{name}"')
        
#         return {**promises, **self.inputs}
