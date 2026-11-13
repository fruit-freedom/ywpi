import dataclasses
import typing as t
import inspect
import types
import pydantic
import pydantic_core

from ywpi import ytypes
# from ywpi.stream import Stream

TYPE_NAMES = {
    str: 'str',
    int: 'int',
    float: 'float',
    ytypes.Text: 'text',
    bytes: 'bytes',
    ytypes.Image: 'image',
    ytypes.Object: 'object',
    ytypes.Context: 'context',
    list: 'list',
    # Stream: 'stream'
}


SERIALIZERS: dict[t.Any, t.Callable] = {
    str: lambda v: str(v),
    int: lambda v: int(v),
}


def cvt_image(value, *args):
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
    str: lambda v, _: v,
    int: lambda v, _: int(v),
    float: lambda v, _: float(v),
    ytypes.Image: cvt_image,
    ytypes.Text: lambda v, _: str(v),
    ytypes.Object: lambda v, _: ytypes.Object.model_validate(v),
    ytypes.Context: lambda v, _: ytypes.Context.model_validate(v),
    # Stream: handle_stream
}


# (From Type, To Type) -> Converter
TYPE_CONVERTERS = {
    (ytypes.Image, bytes): lambda v: bytes('image-data', encoding='utf-8'),
    (ytypes.Text, str): lambda v: str(v),
}


@dataclasses.dataclass
class Type:
    name: str
    tp: t.Any
    args: t.Optional[list['Type']] = dataclasses.field(default_factory=list)


def is_union_type(tp: t.Any) -> bool:
    """Return whether *tp* is a ``typing.Union`` or PEP 604 union."""
    return t.get_origin(tp) in (t.Union, types.UnionType)


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
    args: t.Optional[list['Type']] = dataclasses.field(default_factory=list)
    description: t.Optional[str] = None


def handle_pydantic_field(field_info: pydantic.fields.FieldInfo):
    # Return tuple (description, optional)
    return (field_info.description, not isinstance(field_info.default, pydantic_core.PydanticUndefinedType))


def get_type_name(tp):
    if tp not in TYPE_NAMES:
        if issubclass(tp, pydantic.BaseModel):
            return tp.__name__
        raise TypeError('Type should be registered in `TYPE_NAMES`')

    return TYPE_NAMES[tp]


def get_input_dict(fn) -> dict[str, InputTyping]:
    """
    Retrieve typing from function arguments
    """
    inputs_dict: dict[str, InputTyping] = {  }

    for name, param in inspect.signature(fn).parameters.items():
        if param.annotation is inspect.Parameter.empty:
            raise TypeError(f'argument {name} must has annotation (before llm)')
        tp = param.annotation

        if isinstance(param.default, pydantic.fields.FieldInfo):
            description, optional = handle_pydantic_field(param.default)
        else:
            description, optional = None, param.default is not inspect.Parameter.empty

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
                name=get_type_name(source_tp),
                source_tp=source_tp,
                target_tp=target_tp,
                optional=optional,
                description=description
            )
        else:
            target_tp = tp

            # Keep the complete union annotation.  Reducing it to its origin
            # (typing.Union/types.UnionType) loses the concrete alternatives
            # and makes both registration and deserialization impossible.
            if is_union_type(tp):
                input_type = handle_tp(tp)
                inputs_dict[name] = InputTyping(
                    name=input_type.name,
                    source_tp=tp,
                    target_tp=tp,
                    optional=optional,
                    args=input_type.args,
                    description=description
                )
                continue

            # TODO: There probaly required deserialize subtypes (generic args)
            if t.get_origin(target_tp) is not None:
                target_tp = t.get_origin(target_tp)

            if target_tp in DESERIALIZERS:
                source_tp = target_tp
                inputs_dict[name] = InputTyping(
                    name=get_type_name(source_tp),
                    source_tp=target_tp,
                    target_tp=target_tp,
                    optional=optional,
                    description=description
                )
            elif issubclass(target_tp, pydantic.BaseModel):
                source_tp = target_tp

                args = pydantic._internal._generics.get_args(source_tp)

                type_args = []
                if len(args):
                    source_tp = pydantic._internal._generics.get_origin(source_tp)
                    arg0 = args[0]
                    type_args = [
                        Type(
                            name=get_type_name(arg0),
                            tp=arg0,
                        )
                    ]

                inputs_dict[name] = InputTyping(
                    name=get_type_name(source_tp),
                    source_tp=target_tp,
                    target_tp=target_tp,
                    args=type_args,
                    optional=optional,
                    description=description
                )
            else:
                input_type = handle_tp(tp)
                inputs_dict[name] = InputTyping(
                    name=get_type_name(input_type.tp),
                    source_tp=input_type.tp,
                    target_tp=input_type.tp,
                    optional=param.default is not inspect.Parameter.empty,
                    args=input_type.args
                )
                # raise KeyError(f'type {tp} has not got deserializer')
    return inputs_dict


def _deserialize_value(
    data: t.Any,
    tp: Type,
    attachments: t.MutableMapping[str, bytes],
):
    """Deserialize a value described by ``Type`` recursively.

    Union alternatives are intentionally attempted in declaration order,
    matching Pydantic's ``left_to_right`` union mode.
    """
    if is_union_type(tp.tp):
        errors = []
        for alternative in tp.args or []:
            try:
                return _deserialize_value(data, alternative, attachments)
            except Exception as error:
                errors.append(error)

        alternatives = ', '.join(arg.name for arg in tp.args or [])
        details = '; '.join(str(error) for error in errors)
        raise TypeError(
            f'value does not match any type in Union[{alternatives}]'
            + (f': {details}' if details else '')
        ) from (errors[-1] if errors else None)

    if tp.tp is type(None):
        if data is None:
            return None
        raise TypeError('value is not None')

    if tp.tp in DESERIALIZERS:
        return DESERIALIZERS[tp.tp](data, attachments)

    if tp.tp is list:
        if type(data) is not list:
            raise TypeError('input type is not list')
        if not tp.args:
            return data
        return [_deserialize_value(item, tp.args[0], attachments) for item in data]

    if tp.tp is set:
        if type(data) not in (list, set):
            raise TypeError('input type is not list or set')
        if not tp.args:
            return set(data)
        return {
            _deserialize_value(item, tp.args[0], attachments)
            for item in data
        }

    if tp.tp is bytes:
        return attachments[data['$attachment']]

    if inspect.isclass(tp.tp) and issubclass(tp.tp, pydantic.BaseModel):
        return tp.tp.model_validate(data, context={'attachments': attachments})

    raise RuntimeError(f'no handle for type {tp.tp}')


def handle_arg(data: dict, tp: Type, attachments: t.MutableMapping[str, bytes]):
    return _deserialize_value(data, tp, attachments)


def handle_args(data: dict, inputs: dict[str, InputTyping], attachments: t.MutableMapping[str, dict], ctx: dict = {}):
    """
    Description:
        Convert `data` in Referenced JSON format to Python dictionary using `schema`.
        This process include:
            - Type conversation during `typing.Annotated` annotation
            - File downloading (If ywpi reference used)
            - Stream creation
        Create streams if required.

        Binary content parsing: { "$attachment": "<attachment key>" }

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

        source_tp = input.source_tp
        source_type = Type(name=input.name, tp=source_tp, args=input.args)
        value = _deserialize_value(raw_value, source_type, attachments)

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


def handle_tp(tp: t.Any) -> Type:
    if is_union_type(tp):
        return Type(
            name='union',
            tp=tp,
            args=[handle_tp(arg) for arg in t.get_args(tp)],
        )

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

    if inspect.isclass(tp) and issubclass(tp, pydantic.BaseModel):
        return {
            k: handle_tp(v.annotation)
            for k, v in tp.model_fields.items()
        }

    return handle_tp(tp)


def get_output_dict(fn):
    t = handle_ret(fn)
    if t is not None:
        if isinstance(t, dict):
            return t

        if t.tp in (list, set) and t.args is not None and len(t.args) > 0:
            return {
                '__others__': t.args[0]
            }
        return {}
    else:
        return {}
