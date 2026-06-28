import asyncio
from typing import Any, Iterable, AsyncIterator
import itertools
from dataclasses import dataclass
import time

from .common import Reference
from .computation_block import BaseComputeBlock, StepComputeBlock
from .parsing import referencify
from .steps import BaseStep
from . import utils

"""
Chain Merging
-------------

There few problems with computational graph merge.
One of them is understanding that step configuration is
equal to one another step.
Equality is:
    - Steps recieve all the same inputs
    - Steps have same params

"""

def build_running_queue(
    steps: list[BaseComputeBlock],
    required_returns: Iterable[Reference],
    resolved_refs: set[Reference] | None = None
):
    """
    Require to merge by sequence of steps.
    If steps path from mountain are duplicated with other then they are equal.

    Running queue:

    [Step_1, [Map_Step1, Map_Step2], Step_2]

    [Block1, [Map1_Block1, [Map2_Block1, Map2_Block2], Map2_Block2], Block4]


    MapReduced blocks: all blocks that


    Require mark reducer because all dependent steps potentially could be reducers.

    TODO: IMPORTANT: Could be sequence [M, S1, R, S2] that actually means that
        mapper has S1 and S2 supported states and one reducer. But actually interpret as
    """
    running_queue: list[StepComputeBlock] = []
    resolved_refs: set[Reference] = resolved_refs if resolved_refs is not None else set()

    while len(steps):
        residual_steps: list[BaseComputeBlock] = []
        for step in steps:
            if resolved_refs.issuperset(set(step.promised_inputs.values()) | set(step.conditions)):
                resolved_refs = resolved_refs.union(step.promised_outputs.values())
                running_queue.append(step)
            else:
                residual_steps.append(step)

        if len(residual_steps) == len(steps):
            raise KeyError(f'Recurrent dependencies in calculation tree. \
                Next references can not be resolved for: {residual_steps} \
                Deps: {residual_steps[0].promised_inputs}'
            )

        steps = residual_steps

    if not set(resolved_refs).issuperset(required_returns):
        raise KeyError(f'"returns" dependencies did not resolve. \
            Required returns: {required_returns} \
            Resolved refs: {resolved_refs}'
        )

    mr_grouped_queue: list[StepComputeBlock | list] = []
    cur_step_idx = 0
    while cur_step_idx < len(running_queue):
        if not running_queue[cur_step_idx].mapper:
            mr_grouped_queue.append(running_queue[cur_step_idx])
            cur_step_idx += 1
            continue
        
        mapper_steps: list[BaseComputeBlock] = [running_queue[cur_step_idx] ]
        cur_step_idx += 1
        while cur_step_idx < len(running_queue):
            if running_queue[cur_step_idx].reducer:
                break
            mapper_steps.append(running_queue[cur_step_idx])
            cur_step_idx += 1
        mr_grouped_queue.append(mapper_steps)

    return mr_grouped_queue

class Scope:
    """
    Scope contains only referenced variables.

    Inline variables (that can be resolved during chain initialization)
    are not a part of the scope.
    """
    def __init__(self, predefined_variables: dict[Reference, Any] | None = None) -> None:
        self.variables = predefined_variables if predefined_variables is not None else {}

    def __repr__(self) -> str:
        return self.variables.__repr__()

    def __getitem__(self, key):
        return self.variables.__getitem__(key)

    def copy(self):
        return Scope(self.variables.copy())

    def resolve_references(self, variables: dict[str, Reference]) -> dict[str, Any]:
        result = {}
        for name, ref in variables.items():
            if ref not in self.variables:
                raise RuntimeError(f'Scope does not has reference "{ref}"')            
            result[name] = self.variables[ref]
        return result

    def resolve_references_weak(self, variables: dict[str, Reference]) -> dict[str, Any]:
        return {
            name: self.variables.get(ref, None) for name, ref in variables.items()
        }

    def update(self, variables: dict[Reference, Any]):
        for ref, value in variables.items():
            if ref in self.variables:
                raise RuntimeError(f'Reference "{ref}" already resolved')
            self.variables[ref] = value

    def update_from_scope(self, scope: "Scope"):
        for ref, value in scope.variables.items():
            if ref in self.variables:
                raise RuntimeError(f'Reference "{ref}" already resolved')
            self.variables[ref] = value

    def assert_all_true(self, references: list[Reference]):
        for ref in references:
            if ref not in self.variables:
                raise RuntimeError(f'reference {ref} does not resolved')
            if not self.variables[ref]:
                return False
        return True

class Observer:
    async def notify_watchers(self, outputs: dict[Reference, Any]): raise NotImplementedError()

async def map_reduce_run(steps: list[BaseComputeBlock], global_scope: Scope) -> dict[Reference, Any]:
    """
    Take steps from mapper to reducer (not include).
    """
    assert steps[0].mapper

    mapper = steps[0]
    other_steps = steps[1:]

    accumulate_scope: dict[Reference, list[Any]] = {}
    inputs = global_scope.resolve_references(mapper.promised_inputs)
    async for outputs in mapper.run_generator(inputs):
        local_scope = Scope(global_scope.variables.copy())
        local_scope.update(outputs)
        for step in other_steps:
            if isinstance(step, BaseComputeBlock):
                if not local_scope.assert_all_true(step.conditions):
                    break
                inputs = local_scope.resolve_references(step.promised_inputs)
                start_time = time.time()
                outputs = await step.run(inputs)
                elapsed_time = time.time() - start_time
                print(f'Elapsed time: {elapsed_time}')
                local_scope.update(outputs)
            elif isinstance(step, list):
                raise NotImplementedError('Nested map reduces does not supported')
                outputs = map_reduce_run(None, local_scope)
                local_scope.update_from_scope(outputs)
            else:
                raise RuntimeError(f'Unsupported step type {type(step)}')

        for ref, value in local_scope.variables.items():
            if ref in accumulate_scope:
                accumulate_scope[ref].append(value)
            else:
                accumulate_scope[ref] = [ value ]

    return accumulate_scope

async def map_reduce_run_with_yields(
    steps: list[BaseComputeBlock],
    global_scope: Scope,
    yields: dict[Reference, str]={}
) -> dict[Reference, Any]:
    """
    Take steps from mapper to reducer (not include).
    """
    assert steps[0].mapper

    mapper = steps[0]
    other_steps = steps[1:]

    accumulate_scope: dict[Reference, list[Any]] = {}
    inputs = global_scope.resolve_references(mapper.promised_inputs)
    async for outputs in mapper.run_generator(inputs):
        local_scope = Scope(global_scope.variables.copy())
        local_scope.update(outputs)
        for step in other_steps:
            if isinstance(step, BaseComputeBlock):
                if not local_scope.assert_all_true(step.conditions):
                    break
                inputs = local_scope.resolve_references(step.promised_inputs)
                outputs = await step.run(inputs)
                local_scope.update(outputs)
            elif isinstance(step, list):
                raise NotImplementedError('Nested map reduces does not supported')
                outputs = map_reduce_run(None, local_scope)
                local_scope.update_from_scope(outputs)
            else:
                raise RuntimeError(f'Unsupported step type {type(step)}')

        yield_values: dict[str, Any] = {}
        for ref, value in local_scope.variables.items():
            if ref in accumulate_scope:
                accumulate_scope[ref].append(value)
            elif ref not in global_scope.variables:
                accumulate_scope[ref] = [ value ]

            if ref in yields:
                yield_values[yields[ref]] = value
        if len(yield_values):
            yield False, yield_values

    yield True, accumulate_scope

# async def map_reduce_run_with_yields(
#     steps: list[BaseComputeBlock],
#     global_scope: Scope,
#     yields: dict[Reference, str]={}
# ) -> dict[Reference, Any]:
#     """
#     Take steps from mapper to reducer (not include).
#     """
#     assert steps[0].mapper

#     mapper = steps[0]
#     other_steps = steps[1:]

#     accumulate_scope: dict[Reference, list[Any]] = {}
#     inputs = global_scope.resolve_references(mapper.promised_inputs)

#     async def process_task(outputs):
#         local_scope = Scope(global_scope.variables.copy())
#         local_scope.update(outputs)
#         for step in other_steps:
#             if isinstance(step, BaseComputeBlock):
#                 if not local_scope.assert_all_true(step.conditions):
#                     break
#                 inputs = local_scope.resolve_references(step.promised_inputs)
#                 outputs = await step.run(inputs)
#                 local_scope.update(outputs)
#             elif isinstance(step, list):
#                 raise NotImplementedError('Nested map reduces does not supported')
#                 outputs = map_reduce_run(None, local_scope)
#                 local_scope.update_from_scope(outputs)
#             else:
#                 raise RuntimeError(f'Unsupported step type {type(step)}')

#         yield_values: dict[str, Any] = {}
#         for ref, value in local_scope.variables.items():
#             if ref in accumulate_scope:
#                 accumulate_scope[ref].append(value)
#             elif ref not in global_scope.variables:
#                 accumulate_scope[ref] = [ value ]

#             if ref in yields:
#                 yield_values[yields[ref]] = value
#         return yield_values

#     pending: list[asyncio.Task] = []
#     async for outputs in mapper.run_generator(inputs):
#         pending.append(process_task(outputs))

#     while True:
#         done, pending = await asyncio.wait(pending, return_when=asyncio.FIRST_COMPLETED)
#         for future in done:
#             yield False, future.result()
#         if len(pending) == 0:
#             break

#     yield True, accumulate_scope

class Chain:
    @staticmethod
    def from_dict(data):
        payload_promises, predefined_payload = referencify(data)

        commands: list[BaseComputeBlock] = []
        for step_data in data['steps'].values():
            step_class = BaseStep.get_handler_class(step_data)
            commands.append(StepComputeBlock(step_class, step_data))

        if not set(payload_promises).issuperset(predefined_payload):
            raise RuntimeError(f'Not enough predefined payloads')

        required_returns: dict[str, Reference] = data['returns']
        yields: dict[str, Reference] = data['yields'] if 'yields' in data else None

        commands = build_running_queue(commands, required_returns.values(), set(payload_promises.values()))
        return Chain(commands, payload_promises, required_returns, yields=yields), predefined_payload

    def __init__(self,
        commands: list[BaseComputeBlock],
        payload_promises: dict[str, Reference],
        required_returns: dict[str, Reference],
        yields: dict[str, Reference] | None = None
    ) -> None:
        self.commands = commands
        self.payload_promises = payload_promises
        self.required_returns = required_returns
        self.observer = Observer()
        self.yields: dict[Reference, str] = { yields[name]: name for name in yields } if yields is not None else { }

    async def initialize(self):
        for step in utils.traverse(self.commands):
            await step.initialize()

    async def desctruct(self):
        for step in utils.traverse(self.commands):
            await step.destruct()

    async def run(
        self,
        payload: dict[str, Any] | list[dict[str, Any]]
    ):
        """
        Run chain. Return last output.
        """

        if len(self.yields):
            print('[WARNING] `Chain.run()` does not support yield.')

        # Transform (name -> value) to (reference -> value)
        referenced_payload: dict[Reference, Any] = {}
        for name, reference in self.payload_promises.items():
            if name not in payload:
                raise KeyError(f'Payload missing required key "{name}"')
            referenced_payload[reference] = payload[name]

        scope = Scope(referenced_payload)

        for step in self.commands:
            if isinstance(step, BaseComputeBlock):
                if not scope.assert_all_true(step.conditions):
                    break
                inputs = scope.resolve_references(step.promised_inputs) 
                outputs = await step.run(inputs)
                scope.update(outputs)

            elif isinstance(step, list):
                if not scope.assert_all_true(step[0].conditions):
                    break
                outputs = await map_reduce_run(step, scope) # Scope inheritance
                scope.update(outputs)
            else:
                raise RuntimeError(f'Unsupported step type {type(step)}')
        
        return scope.resolve_references_weak(self.required_returns)

    async def run_with_yields(self, payload: dict[str, Any] | list[dict[str, Any]]) -> AsyncIterator[tuple[bool, dict[str, Any]]]:
        """
        Run chain. Return each yielded results.
        Yields has meanings only for Map - Reduce steps.
        """

        # Transform (name -> value) to (reference -> value)
        referenced_payload: dict[Reference, Any] = {}
        for name, reference in self.payload_promises.items():
            if name not in payload:
                raise KeyError(f'Payload missing required key "{name}"')
            referenced_payload[reference] = payload[name]

        scope = Scope(referenced_payload)

        for step in self.commands:
            if isinstance(step, BaseComputeBlock):
                if not scope.assert_all_true(step.conditions):
                    break
                inputs = scope.resolve_references(step.promised_inputs)
                outputs = await step.run(inputs)
                scope.update(outputs)

            elif isinstance(step, list):
                if not scope.assert_all_true(step[0].conditions):
                    break

                async for last, outputs in map_reduce_run_with_yields(step, scope, self.yields):
                    if not last:
                        yield False, outputs
                    else:
                        scope.update(outputs)
            else:
                raise RuntimeError(f'Unsupported step type {type(step)}')
        
        yield True, scope.resolve_references_weak(self.required_returns)
