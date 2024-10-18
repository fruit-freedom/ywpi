import dataclasses
import typing as t
import inspect

from ywpi import types as ytypes

TYPE_NAMES = {
    str: 'str',
    int: 'int',
    float: 'float',
    ytypes.Text: 'text',
    bytes: 'bytes',
    ytypes.Image: 'image'
}

SERIALIZERS = {
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

DESERIALIZERS = {
    str: lambda v: v,
    int: lambda v: int(v),
    float: lambda v: float(v),
    ytypes.Image: cvt_image,
    ytypes.Text: lambda v: str(v)
}

# (From Type, To Type) -> Converter
TYPE_CONVERTERS = {
    (ytypes.Image, bytes): lambda v: bytes('image-data', encoding='utf-8'),
    (ytypes.Text, str): lambda v: str(v),
}

@dataclasses.dataclass
class InputTyping:
    name: str
    target_tp: t.Any
    source_tp: t.Any | None = None
    optional: bool = False

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

            inputs_dict[name] = InputTyping(
                name=TYPE_NAMES[source_tp],
                source_tp=source_tp,
                target_tp=target_tp,
                optional=param.default is not inspect.Parameter.empty
            )
        else:
            target_tp = tp
            if target_tp in DESERIALIZERS:
                source_tp = tp
                inputs_dict[name] = InputTyping(
                    name=TYPE_NAMES[source_tp],
                    source_tp=target_tp,
                    target_tp=target_tp,
                    optional=param.default is not inspect.Parameter.empty
                )
            else:
                raise KeyError(f'type {tp} has not got deserializer')
    return inputs_dict

def handle_args(data, inputs: dict[str, InputTyping]):
    result_args = {}
    for name, input in inputs.items():
        if name not in data:
            if input.optional:
                continue
            raise KeyError(f'argument {name} does not present in inputs')
        raw_value = data[name]
        value = DESERIALIZERS[input.source_tp](raw_value)

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


