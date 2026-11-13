import typing as t
from concurrent import futures

import pydantic

from ywpi.main import SimpleMethodExecuter
from ywpi import RegisteredMethod, InputTyping
from ywpi import hub_pb2, hub_models
from ywpi.handle_args import get_input_dict, InputTyping, get_output_dict, Type
import ywpi


class MockExchanger:
    def __init__(self) -> None:
        pass

    def call_update_task(self, payload: hub_models.UpdateTaskRequest):
        fut = futures.Future()
        fut.set_result("")
        return fut


def test_1():
    def bytes_inputs_method(data: bytes):
        print("Data", data)

    executer = SimpleMethodExecuter(
        {
            "bytes_inputs_method":
            RegisteredMethod(
                fn=bytes_inputs_method,
                inputs=get_input_dict(bytes_inputs_method),
                outputs=get_output_dict(bytes_inputs_method),
            )
        }
    )

    fut = executer.call_method(
        MockExchanger(),
        "1111",
        "bytes_inputs_method",
        {
            "data": {
                "$attachment": "key1"
            }
        },
        {
            "key1": b"some binary data"
        }
    )
    fut.result()


def test_2():
    class Model(pydantic.BaseModel):
        class File(pydantic.BaseModel):
            id: int
            content: t.Annotated[bytes, ywpi.serialization.BytesValidator]

        files: list['Model.File'] = []


    method_was_called = False

    def method(data: Model):
        nonlocal method_was_called
        method_was_called = True
        assert data.files[0].content == b"binary content"
        print("Data", data)

    executer = SimpleMethodExecuter(
        {
            "method":
            RegisteredMethod(
                fn=method,
                inputs=get_input_dict(method),
                outputs=get_output_dict(method),
            )
        }
    )

    fut = executer.call_method(
        MockExchanger(),
        "1111",
        "method",
        {
            "data": {
                "files": [
                    {
                        "id": 1,
                        "content": {
                            "$attachment": "key1"
                        }
                    }
                ]
            }
        },
        {
            "key1": b"binary content"
        }
    )
    fut.result()

    assert method_was_called


if __name__ == "__main__":
    test_2()


