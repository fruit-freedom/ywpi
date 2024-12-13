import inspect
import typing as t
import dataclasses

from ywpi.handle_args import SERIALIZERS, DESERIALIZERS, TYPE_NAMES

def serial(fn):
    """
    Build referenced json from python object.
    Method should return json serializable dict.

    Example of serializer that serialize CustomType to dict
    def fn(data: CustomType) -> dict: pass
    """
    data_tp = inspect.signature(fn).return_annotation
    assert data_tp in (str, int, float, dict, list)

    params = list(inspect.signature(fn).parameters.values())
    assert len(params) == 1
    tp = params[0].annotation
    assert not issubclass(inspect.Parameter.empty, tp)
    assert tp not in SERIALIZERS
    SERIALIZERS[tp] = fn
    return fn


def deserial(fn):
    """
    Build some python object from part of ywpi method input.
    Input could be one of allowed JSON filelds types (str, int, float, dict, list)

    Example of deserializer that require dict as input
    def fn(data: dict) -> CustomType: pass

    Example of deserializer that specify type name
    def fn(data: dict) -> t.Annotated[CustomType, "custom_type_name"]: pass
    """
    tp = inspect.signature(fn).return_annotation

    if t.get_origin(tp) is t.Annotated:
        tp_name = tp.__metadata__[0]
        tp = tp.__origin__
        assert type(tp_name) is str
    else:
        tp_name = tp.__name__

    assert not issubclass(inspect.Parameter.empty, tp)
    assert tp not in DESERIALIZERS

    # TODO: Handle input data type
    params = list(inspect.signature(fn).parameters.values())
    assert len(params) == 1
    data_tp = params[0].annotation
    assert not issubclass(inspect.Parameter.empty, data_tp)
    assert data_tp in (str, int, float, dict, list)

    DESERIALIZERS[tp] = fn
    TYPE_NAMES[tp] = tp_name
    return fn


# @dataclasses.dataclass
# class Ref:
#     ref: str
#     type: str

# # To ywpi type (serialization)
# @serializer
# def type_cvt(value: int):
#     if not isinstance(value, int):
#         raise TypeError(value)
#     return value

# # From ywpi type (deserialization)
# @deserializer
# def cvt(value) -> int:
#     # Downlaod image by ref
#     return value




