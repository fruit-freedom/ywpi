import pydantic


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
