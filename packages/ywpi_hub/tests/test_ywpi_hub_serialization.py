import typing as t

import pydantic

from ywpi_hub.serialization import BytesSerializer, BytesValidator


class FileModel(pydantic.BaseModel):
    content: t.Annotated[bytes, BytesValidator, BytesSerializer]


class FilesModel(pydantic.BaseModel):
    first: FileModel
    second: FileModel


def test_multiple_bytes_fields_use_distinct_attachments():
    model = FilesModel(
        first=FileModel(content=b"first"),
        second=FileModel(content=b"second"),
    )
    context = {"attachments": {}}

    result = model.model_dump(mode="json", context=context)

    assert result == {
        "first": {"content": {"$attachment": "0"}},
        "second": {"content": {"$attachment": "1"}},
    }
    assert context["attachments"] == {
        "0": b"first",
        "1": b"second",
    }


def test_bytes_attachment_is_restored_from_context():
    model = FileModel.model_validate(
        {"content": {"$attachment": "0"}},
        context={"attachments": {"0": b"binary content"}},
    )

    assert model.content == b"binary content"
