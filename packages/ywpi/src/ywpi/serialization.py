import inspect
import typing as t
import dataclasses
import pydantic

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

    # TODO: Remove assert and use exceptions
    assert not issubclass(inspect.Parameter.empty, tp)
    assert tp not in DESERIALIZERS

    # TODO: Handle input data type
    params = list(inspect.signature(fn).parameters.values())
    assert len(params) == 2
    data_tp = params[0].annotation
    assert not issubclass(inspect.Parameter.empty, data_tp)
    assert data_tp in (str, int, float, dict, list)

    DESERIALIZERS[tp] = fn
    TYPE_NAMES[tp] = tp_name
    return fn


def handle_outputs(data: t.Any) -> dict[str, t.Any]:
    if isinstance(data, dict):
        return data
    elif isinstance(data, (list, tuple, set)):
        return {
            '__others__': [ handle_outputs(d) for d in data ]
        }
    elif isinstance(data, pydantic.BaseModel):
        return data.model_dump(mode='json')
    elif dataclasses.is_dataclass(data):
        return dataclasses.asdict(data)
    elif type(data) in SERIALIZERS:
        return SERIALIZERS[type(data)](data)
    else:
        raise TypeError(f'Type {type(data)} has not got serialize handler')


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


def validate_bytes_with_attachments_ctx(data, info: pydantic.ValidationInfo) -> bytes:
    if isinstance(data, dict):
        try:
            attachments = info.context["attachments"]
        except:
            raise ValueError(f'attachments does not present in the context')

        try:
            key = data["$attachment"]
        except:
            raise ValueError('data does not has "$attachment" attribute')

        try:
            return attachments[key]
        except:
            raise ValueError(f'attachment with key "{key}" does not present in the context')

    return data


BytesValidator = pydantic.BeforeValidator(validate_bytes_with_attachments_ctx)
"""
Serializer require context with *attachments* dictionary.
"""


def serialize_bytes_with_attachments_ctx(data: bytes, info: pydantic.SerializationInfo):
    info.context["attachments"]["1"] = data
    return {
        "$attachment": "1"
    }


BytesSerializer = pydantic.PlainSerializer(serialize_bytes_with_attachments_ctx)
"""
Serializer require context with *attachments* dictionary.
Serializer replace binary content with reference and insert data into *attachments* dictionary,
"""
