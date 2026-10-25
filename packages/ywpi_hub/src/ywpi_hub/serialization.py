import pydantic


def validate_bytes_with_attachments_ctx(data, info: pydantic.ValidationInfo) -> bytes:
    if isinstance(data, dict):
        try:
            attachments = info.context["attachments"]
        except Exception:
            raise ValueError("attachments does not present in the context")

        try:
            key = data["$attachment"]
        except Exception:
            raise ValueError('data does not has "$attachment" attribute')

        try:
            return attachments[key]
        except Exception:
            raise ValueError(f'attachment with key "{key}" does not present in the context')

    return data


BytesValidator = pydantic.BeforeValidator(validate_bytes_with_attachments_ctx)


def serialize_bytes_with_attachments_ctx(data: bytes, info: pydantic.SerializationInfo):
    key = str(len(info.context["attachments"]))
    info.context["attachments"][key] = data
    return {
        "$attachment": key
    }


BytesSerializer = pydantic.PlainSerializer(serialize_bytes_with_attachments_ctx)
"""
Serializer require context with *attachments* dictionary.
Serializer replace binary content with reference and insert data into *attachments* dictionary,
"""
