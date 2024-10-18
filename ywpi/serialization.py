import inspect
import typing as t
import dataclasses

SERIALIZERS: dict[t.Any, t.Callable] = { }

def serializer(fn):
    params = list(inspect.signature(fn).parameters.values())
    assert len(params) == 1
    tp = params[0].annotation
    assert not issubclass(inspect.Parameter.empty, tp)
    assert tp not in SERIALIZERS
    SERIALIZERS[tp] = fn
    return fn

DESERIALIZERS: dict[t.Any, t.Callable] = { }

def deserializer(fn):
    tp = inspect.signature(fn).return_annotation
    assert not issubclass(inspect.Parameter.empty, tp)
    assert tp not in DESERIALIZERS
    DESERIALIZERS[tp] = fn
    return fn

@dataclasses.dataclass
class Ref:
    ref: str
    type: str

# To ywpi type (serialization)
@serializer
def type_cvt(value: int):
    if not isinstance(value, int):
        raise TypeError(value)
    return value

# From ywpi type (deserialization)
@deserializer
def cvt(value) -> int:
    # Downlaod image by ref
    return value




