from typing import Any
import json
import asyncio

import unittest

from .chains import Chain
from .steps import BaseStep

class ProxyStep(BaseStep):
    @staticmethod
    def method() -> str:
        return 'test/proxy'

    @staticmethod
    def required_inputs() -> dict[str, type[Any]]:
        return { 'value': int }

    @staticmethod
    def produced_outputs() -> dict[str, type[Any]]:
        return { 'value': int }

    async def run(self, inputs: dict[str, Any]) -> dict[str, Any]:
        return { 'value': inputs['value'] }

class AlwaysFirstStep(BaseStep):
    @staticmethod
    def method() -> str:
        return 'test/always_first'

    @staticmethod
    def required_inputs() -> dict[str, type[Any]]:
        return { }

    @staticmethod
    def produced_outputs() -> dict[str, type[Any]]:
        return { 'ack': int }

    async def run(self, inputs: dict[str, Any]) -> dict[str, Any]:
        return { 'ack': 1 }


simple_value_proxy = '''
{
    "steps": {
        "1": {
            "method": "test/proxy",
            "inputs": {
                "value": {
                    "$ref": "#/payload/value"
                }
            },
            "outputs": {
                "value": null
            }
        }
    },
    "payload": {
        "value": null
    },
    "returns": {
        "value": {
            "$ref": "#/steps/1/outputs/value"
        }
    }
}
'''

simple_operation_reordering = '''
{
    "steps": {
        "1": {
            "method": "test/proxy",
            "inputs": {
                "value": { "$ref": "#/steps/2/outputs/ack" }
            },
            "outputs": {
                "value": null
            }
        },
        "2": {
            "method": "test/always_first",
            "inputs": { },
            "outputs": { "ack": null }
        }
    },
    "payload": { },
    "returns": {
        "value": { "$ref": "#/steps/1/outputs/value" }
    }
}
'''

simple_condition = {
    "steps": {
        "1": {
            "method": "builtins/if_empty",
            "inputs": {
                "items": { "$ref": "#/payload/items" }
            },
            "outputs": {
                "verdict": None
            }
        },
        "2": {
            "method": "builtins/proxy",
            "conditions": [
                { "$ref": "#/steps/1/outputs/verdict" }
            ],
            "inputs": {
                "value": { "$ref": "#/payload/items" }
            },
            "outputs": {
                "value": None
            }
        }
    },
    "payload": {
        "items": None
    },
    "returns": {
        "items": { "$ref": "#/steps/2/outputs/value" }
    }
}


class TestMapperStep(BaseStep):
    ITERATIONS_NUMBER = 5

    @staticmethod
    def method() -> str:
        return 'test/simple-mapper'

    @staticmethod
    def required_inputs() -> dict[str, type[Any]]:
        return { }

    @staticmethod
    def produced_outputs() -> dict[str, type[Any]]:
        return { 'value': int }

    async def run_generator(self, inputs: dict[str, Any]) -> dict[str, Any]:
        for i in range(self.ITERATIONS_NUMBER):
            yield { 'value': i }

class TestReducerStep(BaseStep):
    @staticmethod
    def method() -> str:
        return 'test/simple-reducer'

    @staticmethod
    def required_inputs() -> dict[str, type[Any]]:
        return { 'value': list[Any] }

    @staticmethod
    def produced_outputs() -> dict[str, type[Any]]:
        return { }

    async def run(self, inputs: dict[str, type[Any]]) -> dict[str, Any]:
        return {
            'sum': sum(inputs['value'])
        }

MAP_REDUCE_SIMPLE_CHAIN = {
    "steps": {
        "1": {
            "method": "test/simple-mapper",
            "__mapper__": True,
            "inputs": { },
            "outputs": {
                "value": None
            }
        },
        "2": {
            "method": "builtins/proxy",
            "inputs": {
                "value": { "$ref": "#/steps/1/outputs/value" }
            },
            "outputs": { "value": None }
        },
        "3": {
            "method": "test/simple-reducer",
            "__reducer__": True,
            "inputs": {
                "value": { "$ref": "#/steps/2/outputs/value" }
            },
            "outputs": {
                "sum": None
            }
        }
    },
    "payload": { },
    "returns": {
        "sum": {
            "$ref": "#/steps/3/outputs/sum"
        }
    }
}

MAP_REDUCE_YIELD_SIMPLE_CHAIN = {
    "steps": {
        "1": {
            "method": "test/simple-mapper",
            "__mapper__": True,
            "inputs": { },
            "outputs": {
                "value": None
            }
        },
        "2": {
            "method": "builtins/proxy",
            "inputs": {
                "value": { "$ref": "#/steps/1/outputs/value" }
            },
            "outputs": { "value": None }
        },
        "3": {
            "method": "test/simple-reducer",
            "__reducer__": True,
            "inputs": {
                "value": { "$ref": "#/steps/2/outputs/value" }
            },
            "outputs": {
                "sum": None
            }
        }
    },
    "payload": { },
    "returns": {
        "sum": {
            "$ref": "#/steps/3/outputs/sum"
        }
    },
    "yields": {
        "current_number": {
            "$ref": "#/steps/2/outputs/value"
        }
    }
}

class TestSimple(unittest.IsolatedAsyncioTestCase):
    async def test_chain_proxy(self):
        chain, payload = Chain.from_dict(json.loads(simple_value_proxy))
        self.assertEqual(len(payload), 0, 'Payload valued should not present')

        result = await chain.run({ 'value': 1 })
        self.assertEqual(result['value'], 1, 'Incorrect proxy value')

        result = await chain.run({ 'value': 2 })
        self.assertEqual(result['value'], 2, 'Incorrect proxy value in second run')

        await chain.desctruct()

    async def test_operatrion_reordering(self):
        chain, payload = Chain.from_dict(json.loads(simple_operation_reordering))
        self.assertEqual(len(payload), 0, 'Payload valued should not present')

        self.assertEqual(len(chain.commands), 2, 'Wrong steps number')

        result = await chain.run({})
        self.assertEqual(result['value'], 1, 'Incorrect proxy value')

        await chain.desctruct()

    async def test_conditions_simple(self):
        chain, payload = Chain.from_dict(simple_condition)
        self.assertEqual(len(payload), 0, 'Payload valued should not present')
        self.assertEqual(len(chain.commands), 2, 'Wrong steps number')

        result = await chain.run({ 'items': [] })
        self.assertDictEqual(result, { 'items': [] }, 'Condition ignored')

        result = await chain.run({ 'items': [1] })
        self.assertDictEqual(result, { 'items': None }, 'Condition ignored')

        await chain.desctruct()

    async def test_map_reduce_simple(self):
        chain, payload = Chain.from_dict(MAP_REDUCE_SIMPLE_CHAIN)
        self.assertEqual(len(payload), 0, 'Payload valued should not present')
        # TODO: add multiple steps in MR
        result = await chain.run({ })
        self.assertDictEqual(result, { 'sum': sum(range(TestMapperStep.ITERATIONS_NUMBER)) }, 'Invalid map iteration number')

        await chain.desctruct()

    async def test_map_reduce_yield_simple(self):
        chain, payload = Chain.from_dict(MAP_REDUCE_YIELD_SIMPLE_CHAIN)
        self.assertEqual(len(payload), 0, 'Payload valued should not present')

        iteration = 0
        async for last, output in chain.run_with_yields({ }):
            if not last:
                self.assertEqual(output, { 'current_number': iteration })
                iteration += 1
            else:
                self.assertDictEqual(output, { 'sum': sum(range(TestMapperStep.ITERATIONS_NUMBER)) }, 'Invalid map iteration number')

        await chain.desctruct()

if __name__ == '__main__':
    unittest.main()
