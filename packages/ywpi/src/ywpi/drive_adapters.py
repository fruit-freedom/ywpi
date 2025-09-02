import pydantic
import typing

from abc import ABC



sample_ref = {
    "__adapter__": "YwpiDriveAdapter",
    "type": "",
    "ref": "",
}

class DriveRef(pydantic.BaseModel):
    adapter: str = pydantic.Field(alias='__adapter__')
    type: str
    ref: str

class AbstractDriveAdapter:
    def materialize_ref(self, ref: DriveRef) -> typing.Any: pass
    def referencify_object(self, obj: typing.Any) -> DriveRef: pass


def handle_args(data: dict, drive_adapter: AbstractDriveAdapter):
    for name, value in data:
        if isinstance(value, dict):
            drive_adapter.materialize_ref(value)
        else:
            pass



# Multiple drive targets & sources
# Default ywpi drive

