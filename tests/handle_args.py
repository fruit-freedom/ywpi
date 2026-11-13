import unittest
import typing as t
from typing import Literal

from ywpi.handle_args import handle_args, get_input_dict, InputTyping, handle_ret, Type, get_output_dict
from ywpi.serialization import serial, deserial
import ywpi


class TestGetInputDict(unittest.TestCase):
    def test_simple(self):
        def fn(string: str, integer: int, double: float): pass

        inputs_dict = get_input_dict(fn)
        self.assertDictEqual(inputs_dict, {
            'string': InputTyping(name='str', target_tp=str, source_tp=str),
            'integer': InputTyping(name='int', target_tp=int, source_tp=int),
            'double': InputTyping(name='float', target_tp=float, source_tp=float)
        })

    def test_simple_annotated(self):
        def fn(text: str, image: t.Annotated[bytes, ywpi.Image]): pass

        inputs_dict = get_input_dict(fn)
        self.assertDictEqual(inputs_dict, {
            'text': InputTyping(name='str', target_tp=str, source_tp=str),
            'image': InputTyping(name='image', target_tp=bytes, source_tp=ywpi.Image)
        })

    def test_simple_optional(self):
        def fn(text: str, image: t.Annotated[bytes, ywpi.Image] = None): pass

        inputs_dict = get_input_dict(fn)
        self.assertDictEqual(inputs_dict, {
            'text': InputTyping(name='str', target_tp=str, source_tp=str),
            'image': InputTyping(name='image', target_tp=bytes, source_tp=ywpi.Image, optional=True)
        })
    
    def test_no_arguments(self):
        def fn(): pass

        inputs_dict = get_input_dict(fn)
        self.assertDictEqual(inputs_dict, {})

    def test_custom_deserializer_simple(self):
        class CustomType: pass

        @deserial
        def custom_deserial(data: dict) -> CustomType: pass

        def fn(arg: CustomType): pass

        inputs_dict = get_input_dict(fn)
        self.assertDictEqual(inputs_dict, {
            'arg': InputTyping(name='CustomType', target_tp=CustomType, source_tp=CustomType)
        })

    def test_custom_deserializer_simple(self):
        class CustomType: pass

        @deserial
        def custom_deserial(data: dict) -> t.Annotated[CustomType, 'custom_type_name']: pass

        def fn(arg: CustomType): pass

        inputs_dict = get_input_dict(fn)
        self.assertDictEqual(inputs_dict, {
            'arg': InputTyping(name='custom_type_name', target_tp=CustomType, source_tp=CustomType)
        })

    def test_union_input_types(self):
        class UserMessageV1(pydantic.BaseModel):
            value: int

        class FutureResolvedMessageV1(pydantic.BaseModel):
            value: str

        def fn(message: t.Union[UserMessageV1, FutureResolvedMessageV1]): pass

        inputs_dict = get_input_dict(fn)
        self.assertEqual(inputs_dict['message'].name, 'union')
        self.assertEqual(
            inputs_dict['message'].args,
            [
                Type(name='UserMessageV1', tp=UserMessageV1),
                Type(name='FutureResolvedMessageV1', tp=FutureResolvedMessageV1),
            ]
        )

    def test_pep604_union_input_types(self):
        class UserMessageV1(pydantic.BaseModel):
            value: int

        class FutureResolvedMessageV1(pydantic.BaseModel):
            value: str

        def fn(message: UserMessageV1 | FutureResolvedMessageV1): pass

        inputs_dict = get_input_dict(fn)
        self.assertEqual(inputs_dict['message'].name, 'union')
        self.assertEqual(
            [arg.tp for arg in inputs_dict['message'].args],
            [UserMessageV1, FutureResolvedMessageV1]
        )


import dataclasses
import pydantic

# @dataclasses.dataclass
# class Test:
#     number: int


class Test(pydantic.BaseModel):
    number: int


class Document(pydantic.BaseModel):
    id: str




def fn() -> list[Document]: pass



class TestHandleRet(unittest.TestCase):
    def test_simple(self):
        def no_annotation(): pass
        self.assertEqual(
            handle_ret(no_annotation),
            None
        )

        @dataclasses.dataclass
        class DataclassType: pass
        def simple_dataclass() -> list[DataclassType]: pass
        self.assertEqual(
            handle_ret(simple_dataclass),
            Type('list', tp=list, args=[
                Type('DataclassType', DataclassType)
            ])
        )

        class PydanticType(pydantic.BaseModel):
            number: int
        def simple_pydantic() -> list[PydanticType]: pass
        self.assertEqual(
            handle_ret(simple_pydantic),
            Type('list', tp=list, args=[
                Type('PydanticType', PydanticType)
            ])
        )

        def simple_pydantic_2() -> PydanticType: pass
        self.assertEqual(
            handle_ret(simple_pydantic_2),
            Type('PydanticType', PydanticType)
        )

        def only_list() -> list: pass
        self.assertEqual(
            handle_ret(only_list),
            Type('list', tp=list)
        )

    def test_simple_get_outputs_dict(self):
        def no_annotation(): pass
        self.assertDictEqual(get_output_dict(no_annotation), { })

        def list_only(): pass
        self.assertDictEqual(get_output_dict(list_only), { })

        class PydanticType(pydantic.BaseModel):
            number: int
        def simple_pydantic() -> list[PydanticType]: pass
        self.assertDictEqual(
            get_output_dict(simple_pydantic),
            {
                '__others__': Type(name='PydanticType', tp=PydanticType)
            }
        )


class TestUnionDeserialization(unittest.TestCase):
    def test_union_of_message_models_uses_the_matching_message_type(self):
        class MessageV1(pydantic.BaseModel):
            pass

        class UserMessageV1(MessageV1):
            discriminator_type: Literal['UserMessageV1']
            content: str

        class UserFeedbackResponseMessageV1(MessageV1):
            discriminator_type: Literal['UserFeedbackRequestMessageV1']
            request_id: str
            type: str
            data: dict[str, t.Any]

        class EventMessageV1(MessageV1):
            discriminator_type: Literal['EventMessageV1']
            type: str
            data: dict[str, t.Any]

        def fn(message: UserMessageV1 | UserFeedbackResponseMessageV1 | EventMessageV1): pass

        inputs = get_input_dict(fn)
        payloads = [
            (
                {
                    'discriminator_type': 'UserMessageV1',
                    'content': 'hello',
                },
                UserMessageV1,
            ),
            (
                {
                    'discriminator_type': 'UserFeedbackRequestMessageV1',
                    'request_id': 'request-1',
                    'type': 'accepted',
                    'data': {'reason': 'ok'},
                },
                UserFeedbackResponseMessageV1,
            ),
            (
                {
                    'discriminator_type': 'EventMessageV1',
                    'type': 'created',
                    'data': {'entity_id': 'entity-1'},
                },
                EventMessageV1,
            ),
        ]

        for payload, expected_type in payloads:
            with self.subTest(expected_type=expected_type.__name__):
                result = handle_args({'message': payload}, inputs, {})['message']
                self.assertIsInstance(result, expected_type)
                self.assertEqual(result.discriminator_type, payload['discriminator_type'])

    def test_union_uses_left_to_right_order(self):
        def fn(value: str | int): pass

        inputs = get_input_dict(fn)
        self.assertEqual(
            handle_args({'value': '123'}, inputs, {}),
            {'value': '123'}
        )

    def test_union_deserializes_pydantic_models(self):
        class UserMessageV1(pydantic.BaseModel):
            value: int

        class FutureResolvedMessageV1(pydantic.BaseModel):
            value: str

        def fn(message: UserMessageV1 | FutureResolvedMessageV1): pass

        inputs = get_input_dict(fn)
        result = handle_args(
            {'message': {'value': '123'}},
            inputs,
            {},
        )
        self.assertIsInstance(result['message'], UserMessageV1)
        self.assertEqual(result['message'].value, 123)

    def test_union_accepts_none(self):
        def fn(value: str | None): pass

        inputs = get_input_dict(fn)
        self.assertEqual(handle_args({'value': None}, inputs, {}), {'value': None})

    def test_union_reports_when_all_alternatives_fail(self):
        def fn(value: int | float): pass

        inputs = get_input_dict(fn)
        with self.assertRaises(TypeError):
            handle_args({'value': 'not-a-number'}, inputs, {})


if __name__ == '__main__':
    # print(type(Test(1)).__name__)

    # ret = handle_ret(fn)
    # print(ret)
    unittest.main()


# def fn(text: str, image: t.Annotated[bytes, ywpi.Image], thr: int = 1): pass
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
#     inputs_dict
# )
# print(res)

