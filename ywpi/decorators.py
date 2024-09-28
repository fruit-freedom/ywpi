# Migrate repo

class Index:
    pass

class logsy:
    class Image: pass
    class GeoTIFF: pass
    class GeoJSON: pass


# REST API interface for develop
# gRPC interface for production

import typing
import types
import dataclasses


# import fastapi
# app = fastapi.FastAPI()



import enum

class Spec(enum.Enum):
    API_METHOD = '__ywpi_api_method__'
    CLASS_API_METHODS = '__ywpi_class_api_methods__'


import inspect
import functools

INSTANCES_DICT = { }

class Image: pass


TYPES_DICT = {
    # Image: Annotated[fastapi.File, fastapi.Form()],
    # str: fastapi.UploadFile
    # str: int
}

def m(file: str):
    return file.filename

TYPES_MAPPERS_DICT = {
    str: m
}

@dataclasses.dataclass
class MethodDescription:
    parameters: list[inspect.Parameter]
    return_annotation: inspect.Parameter
    bind_method: bool = True

def service(cls):
    api_methods = {}
    for attrname in cls.__dict__:
        attrname: str
        if attrname.startswith('__'):
            continue

        if not hasattr(cls.__dict__[attrname], '__call__'):
            continue

        func = cls.__dict__[attrname]

        if hasattr(func, Spec.API_METHOD.value):
            signature = inspect.signature(func)
            print('API method parameters', list(signature.parameters.values()))

            paramenters = list(signature.parameters.values())
            bind_method = isinstance(func, types.FunctionType)
            if bind_method:
                paramenters.pop(0)

            api_methods[func.__name__] = MethodDescription(
                parameters=paramenters,
                return_annotation=signature.return_annotation,
                bind_method=bind_method
            )

    setattr(cls, Spec.CLASS_API_METHODS.value, api_methods)
    return cls

def api(func):
    setattr(func, Spec.API_METHOD.value, {})
    return func



@service
class Agent:
    def __init__(self) -> None:
        self.counter = 0

    @api
    @staticmethod
    def preprocessing(number: int):
        import time
        time.sleep(3)
        print('YEEEEE WE RUN PREPROCSSING with', number)

    @api
    def predict(self, image_path: str, number: int) -> dict:
        self.counter += 1
        print('IMAGEPATH', image_path)
        print('NUMBER', number)
        return {
            'counter': self.counter
        }

    @api
    def forward(self, filepath: str):
        pass

class ServiceController:
    def __init__(self, worker_id: str = 'worker-1'):
        self.worker_id = worker_id

    async def heartbeat(): pass

    async def loop(self):
        while True:
            good = await self.heartbeat()
            # await asyncio.sleep(4)

    def append_task(self, payload: dict):
        pass


TO_YWPI_TYPES: dict[typing.Any, typing.Callable] = { }
def to_ywpi_type(fn):
    params = list(inspect.signature(fn).parameters.values())
    assert len(params) == 1
    tp = params[0].annotation
    assert not issubclass(inspect.Parameter.empty, tp)
    assert tp not in TO_YWPI_TYPES
    TO_YWPI_TYPES[tp] = fn
    return fn

FROM_YWPI_TYPES: dict[typing.Any, typing.Callable] = { }
def from_ywpi_type(fn):
    tp = inspect.signature(fn).return_annotation
    assert not issubclass(inspect.Parameter.empty, tp)
    assert tp not in FROM_YWPI_TYPES
    FROM_YWPI_TYPES[tp] = fn
    return fn


# JSON types string, number, object
{
    "ref": "",
    "type": ""
}

@dataclasses.dataclass
class Ref:
    ref: str
    type: str


# To ywpi type
@to_ywpi_type
def type_cvt(value: int):
    return value

# From ywpi type
@from_ywpi_type
def cvt(value) -> int:
    # Downlaod image by ref
    return value

# instance = Agent()

# Agent.predict(instance, **{ 'image_path': 'path', 'number': 1 })

# methods = Agent.__dict__[Spec.CLASS_API_METHODS.value]
# print(methods)

# Agent.__dict__['predict'](instance, **{ 'image_path': 'path', 'number': 1 })


def launch_method(cls, method, args):
    pass



# Declare input parameters
# Declare output parameters
# Declare legend
# Declare description
# Declare name

# Name, Description, Input values, Output values, Parameters dict, Legend

# Easy tools for building image from sources
# Easy tools for deploying


