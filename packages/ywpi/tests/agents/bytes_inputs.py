import typing as t

import pydantic

import ywpi


class Model(pydantic.BaseModel):
    class File(pydantic.BaseModel):
        id: int
        content: t.Annotated[bytes, ywpi.serialization.BytesValidator]

    files: list['Model.File'] = []


@ywpi.method
def bytes_pydantic_serialization_method(data: Model):
    print("Data", data)

# @ywpi.method
# def bytes_inputs_method(data: bytes):
#     print("Data", data)
