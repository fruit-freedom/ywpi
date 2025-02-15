import dataclasses
import typing as t
import inspect

from ywpi import types as ytypes
# from ywpi.stream import Stream

TYPE_NAMES = {
    str: 'str',
    int: 'int',
    float: 'float',
    ytypes.Text: 'text',
    bytes: 'bytes',
    ytypes.Image: 'image',
    # Stream: 'stream'
}


SERIALIZERS: dict[t.Any, t.Callable] = {
    str: lambda v: str(v),
    int: lambda v: int(v),
}


def cvt_image(value):
    ref = value['ref']
    tp = value['type']
    if tp != 'image':
        raise TypeError('ref image')
    return ytypes.Image()


def cvt_ref(value):
    ref = value['ref']
    return ytypes.Ref()

# def handle_stream(data: dict | list):
#     if isinstance(data, list):
#         return Stream(init_items=data)
#     return Stream(init_items=[data])

DESERIALIZERS: dict[t.Any, t.Callable] = {
    str: lambda v: v,
    int: lambda v: int(v),
    float: lambda v: float(v),
    ytypes.Image: cvt_image,
    ytypes.Text: lambda v: str(v),
    # Stream: handle_stream
}


# (From Type, To Type) -> Converter
TYPE_CONVERTERS = {
    (ytypes.Image, bytes): lambda v: bytes('image-data', encoding='utf-8'),
    (ytypes.Text, str): lambda v: str(v),
}


@dataclasses.dataclass
class InputTyping:
    """
    Fields:
        name: type name
        target_tp: python object representation of type. (Actually type)
        json_repr: json representation of type. Usually it is dict with ywpi Ref 
    """
    name: str
    target_tp: t.Any
    source_tp: t.Any | None = None
    optional: bool = False
    json_repr: t.Optional[t.Union[int, str, float, dict, list]] = None


def get_input_dict(fn) -> dict[str, InputTyping]:
    """
    Retrieve typing from function arguments
    """
    inputs_dict: dict[str, InputTyping] = {  }

    for name, param in inspect.signature(fn).parameters.items():
        if param.annotation is inspect.Parameter.empty:
            raise TypeError(f'argument {name} must has annotation (before llm)')
        tp = param.annotation
        if t.get_origin(tp) is t.Annotated:
            target_tp = tp.__origin__
            source_tp = tp.__metadata__[0]

            if source_tp not in DESERIALIZERS:
                raise KeyError(f'type {source_tp} has not got deserializer')

            if (source_tp, target_tp) not in TYPE_CONVERTERS:
                raise TypeError(f'no avalible conversation from {source_tp} to {target_tp}')

            if t.get_origin(source_tp) is not None:
                source_tp = t.get_origin(source_tp)

            inputs_dict[name] = InputTyping(
                name=TYPE_NAMES[source_tp],
                source_tp=source_tp,
                target_tp=target_tp,
                optional=param.default is not inspect.Parameter.empty
            )
        else:
            target_tp = tp
            # TODO: There probaly required deserialize subtypes (generic args)
            if t.get_origin(target_tp) is not None:
                target_tp = t.get_origin(target_tp)

            if target_tp in DESERIALIZERS:
                source_tp = target_tp
                inputs_dict[name] = InputTyping(
                    name=TYPE_NAMES[source_tp],
                    source_tp=target_tp,
                    target_tp=target_tp,
                    optional=param.default is not inspect.Parameter.empty
                )
            else:
                raise KeyError(f'type {tp} has not got deserializer')
    return inputs_dict


def handle_args(data: dict, inputs: dict[str, InputTyping], ctx: dict = {}):
    """
    Description:
        Convert `data` in Referenced JSON format to Python dictionary using `schema`.
        This process include:
            - Type conversation during `typing.Annotated` annotation
            - File downloading (If ywpi reference used)
            - Stream creation
        Create streams if required.

    Returns:
        Converted data.
    """
    result_args = {}
    for name, input in inputs.items():
        if name not in data:
            # TODO: Ignore if input type is `ywpi.Stream`
            if input.optional:
                continue
            raise KeyError(f'argument {name} does not present in inputs')
        raw_value = data[name]
        source_tp = t.get_origin(input.source_tp) if t.get_origin(input.source_tp) is not None else input.source_tp
        value = DESERIALIZERS[source_tp](raw_value)

        if input.source_tp is not input.target_tp:
            value = TYPE_CONVERTERS[(input.source_tp, input.target_tp)](value)

        result_args[name] = value
    return result_args


# import ywpi

# # def fn(text: str, image: t.Annotated[bytes, ywpi.Image]): pass
# def fn(text: str, image: t.Annotated[bytes, ywpi.Image] = None): pass

# # def fn(text: str, image: t.Annotated[bytes, ywpi.Image], thr: int = 1): pass


# inputs_dict = get_input_dict(fn)
# print(inputs_dict)

# res = handle_args(
#     {
#         'text': 'string',
#         'image': {
#             'ref': 46527,
#             'type': 'image',
#             'href': 'https://drive.ywpi.ru/o/46527'
#         }
#     },
#     # {
#     #     'text': InputTyping(name='str', target_tp=str, source_tp=str),
#     #     'image': InputTyping(name='image', target_tp=bytes, source_tp=ywpi.Image)
#     # }
#     inputs_dict
# )
# print(res)

# # print(type_hints['text'].__origin__, type_hints['text'].__metadata__, type_hints['text'])
# # print(t.get_origin(t.Annotated[str, ywpi.Text]) is t.Annotated)

@dataclasses.dataclass
class Type:
    name: str
    tp: t.Any
    args: t.Optional[list['Type']] = None


def handle_tp(tp: t.Any) -> Type:
    args = t.get_args(tp)
    orig = t.get_origin(tp) if args else tp

    if orig in (list, set):
        out = Type(name=orig.__name__, tp=orig)
        if args:
            out.args = [
                handle_tp(args[0])
            ]
        return out
    else:
        return Type(name=orig.__name__, tp=orig)


def handle_ret(fn):
    tp = inspect.signature(fn).return_annotation

    if not t.get_args(tp) and issubclass(inspect.Parameter.empty, tp): return

    return handle_tp(tp)


def get_output_dict(fn):
    t = handle_ret(fn)
    if t is not None:
        if t.tp in (list, set) and t.args is not None:
            return {
                '__others__': t.args[0]
            }
        return {}
    else:
        return {}

