from typing import Any

class IStepRunner:
    """
    Interface for step runner. 
    """
    async def initialize(self, params: dict[str, Any]) -> None: raise NotImplementedError()

    async def destruct(self): raise NotImplementedError()

    async def run(self, inputs): raise NotImplementedError()

class IStepHandler:
    """
    Interface for step creator.
    Provide information about input / output formats.
    """
    def required_params(self): return { }

    def required_inputs(self) -> dict[str, Any]: raise NotImplementedError()

    def produced_outputs(self) -> dict[str, Any]: raise NotImplementedError()

    def method(self) -> str: raise NotImplementedError()

    def __call__(self) -> IStepRunner: raise NotImplementedError()

class BaseStep:
    """
    Interface for united step.
    """
    STEP_CLASSES_DICT: dict[str, "BaseStep"] = {}

    def __init_subclass__(cls, **kwargs):
        super().__init_subclass__(**kwargs)
        if not hasattr(cls, 'method'):
            raise TypeError(f'{cls.__name__} must have a "method" function attribute')

        BaseStep.STEP_CLASSES_DICT[cls.method()] = cls

    @staticmethod
    def register_handler_class(cls: IStepHandler):
        print('Registering method:', cls.method())
        BaseStep.STEP_CLASSES_DICT[cls.method()] = cls

    @staticmethod
    def get_handler_class(data):
        if 'method' not in data:
            raise TypeError('"method" attribute required')

        method = data['method']
        if method not in BaseStep.STEP_CLASSES_DICT:
            raise KeyError(f'method "{method}" has not got class handler')

        return BaseStep.STEP_CLASSES_DICT[method]

    @staticmethod
    def method() -> str: raise NotImplementedError()

    @staticmethod
    def required_params() -> dict[str, type[Any]]: return { }

    @staticmethod
    def required_inputs() -> dict[str, type[Any]]: raise NotImplementedError()

    @staticmethod
    def produced_outputs() -> dict[str, type[Any]]: raise NotImplementedError()

    async def run(self, inputs: dict[str, Any]) -> dict[str, Any]: raise NotImplementedError()

    async def run_generator(self, inputs: dict[str, Any]) -> dict[str, Any]: raise NotImplementedError()

    async def initialize(self, params: dict[str, Any]) -> None: pass

    async def destruct(self) -> None: pass
