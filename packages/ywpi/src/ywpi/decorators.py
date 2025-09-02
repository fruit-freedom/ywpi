import inspect
import typing
import types
import dataclasses
import enum

from .handle_args import get_input_dict, InputTyping, get_output_dict, Type

class Spec(enum.Enum):
    API_METHOD = '__ywpi_api_method__'
    CLASS_API_METHODS = '__ywpi_class_api_methods__'


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


@dataclasses.dataclass
class RegisteredMethod:
    fn: typing.Callable
    inputs: dict[str, InputTyping]
    outputs: dict[str, Type]
    description: typing.Optional[str] = None
    labels: typing.Optional[list[str]] = None


REGISTERED_METHODS: dict[str, RegisteredMethod] = {}
DEFAULT_DESCRIPTION = 'No description provided'


def _register_method(func, description: str = None, labels: list[str] = None):
    inputs = get_input_dict(func)
    outputs = get_output_dict(func)

    if description is None:
        description = func.__doc__

    REGISTERED_METHODS[func.__name__] = RegisteredMethod(
        fn=func,
        inputs=inputs,
        outputs=outputs,
        description=description,
        labels=labels
    )
    return func


def method(func=None, description: str = None, labels: list[str] = None):
    if func is None:
        def wrapper(func):
            return _register_method(
                func=func,
                description=description,
                labels=labels,
            )
        return wrapper
    else:
        return _register_method(
            func=func,
            description=description,
            labels=labels,
        )
