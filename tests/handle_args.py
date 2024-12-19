import unittest
import typing as t

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



