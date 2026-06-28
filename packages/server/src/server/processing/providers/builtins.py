import os
from typing import Any
import asyncio

from ..steps import BaseStep
from .. import steps_types

class ProxyStep(BaseStep):
    @staticmethod
    def method() -> str:
        return 'builtins/proxy'

    @staticmethod
    def required_inputs() -> dict[str, type[Any]]:
        return { 'value': int }

    @staticmethod
    def produced_outputs() -> dict[str, type[Any]]:
        return { 'value': int }

    async def run(self, inputs: dict[str, Any]) -> dict[str, Any]:
        return { 'value': inputs['value'] }

class SleepStep(BaseStep):
    @staticmethod
    def method() -> str:
        return 'builtins/sleep'

    @staticmethod
    def required_inputs() -> dict[str, type[Any]]:
        return { 'value': Any }

    @staticmethod
    def produced_outputs() -> dict[str, type[Any]]:
        return { }

    async def run(self, inputs: dict[str, Any]) -> dict[str, Any]:
        await asyncio.sleep(1)
        return { }

class LogStep(BaseStep):
    @staticmethod
    def method() -> str:
        return 'builtins/log'

    @staticmethod
    def required_inputs() -> dict[str, type[Any]]:
        return { 'value': Any }

    @staticmethod
    def produced_outputs() -> dict[str, type[Any]]:
        return { }

    async def run(self, inputs: dict[str, Any]) -> dict[str, Any]:
        print(f"[LOG STEP] {inputs['value']}")
        return { }

class IfEmptyStep(BaseStep):
    @staticmethod
    def method() -> str:
        return 'builtins/if_empty'

    @staticmethod
    def required_inputs() -> dict[str, type[Any]]:
        return { 'items': Any }

    @staticmethod
    def produced_outputs() -> dict[str, type[Any]]:
        return { 'verdict': bool }

    async def run(self, inputs: dict[str, Any]) -> dict[str, Any]:
        return { 'verdict': len(inputs['items']) == 0 }

try:
    import cv2

    class ReadImagesFromDirStep(BaseStep):
        @staticmethod
        def method() -> str:
            return 'cv2/read-images-from-dir'

        @staticmethod
        def required_inputs() -> dict[str, type[Any]]:
            return { 'dir': str }

        @staticmethod
        def produced_outputs() -> dict[str, type[Any]]:
            return { 'image': steps_types.RawImage }

        async def run_generator(self, inputs: dict[str, Any]) -> dict[str, Any]:
            filenames = filter(
                lambda fn: fn.endswith(('.jpg', '.jpeg', '.JPG', '.png')),
                os.listdir(os.path.join('/images', inputs['dir']))
            )
            for filename in filenames:
                abs_path = os.path.join('/images', inputs['dir'], filename)
                rel_path = os.path.join(inputs['dir'], filename)
                image = cv2.imread(abs_path)
                yield { 'image': steps_types.RawImage(data=image, path=os.path.join('/images', rel_path)) }

except:
    pass

