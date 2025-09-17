






Supported annotation variants
```python
import typing
import ywpi

def fn(
    a1: int,
    a2: str,
    a3: float,

    # String as text
    a4: typing.Annotated[str, ywpi.Text],

    # File content
    a5: typing.Annotated[bytes, ywpi.File],

    # File reference
    a6: typing.Annotated[ywpi.Ref, ywpi.File],
):
    pass
```



Referenced JSON

```json
{
    "output_str": {
        "type": "str",
        "value": ""
    },
    "output_int": {
        "type": "int",
        "value": 0
    },
    "output_url": {
        "type": "url",
        "value": "https://python.org/"
    },
    "output_ref": {
        "type": "ref",
        "value": {
            "drive_id": "",
            "preview_href": ""
        }
    }
}
```



#### Multiple level of serialization
1. *Application* - regular python dictionary with python objects
2. *Hub* - serialize dictionary in `StartTaskRequest` model
    - Referencify `bytes` values with *attachments*
3. *gRPC* - serialize `StartTaskRequest` to string via `JSON` string + `attachments` map




### Serialization for model with bytes fields
Ywpi pass additional context to pydantic `model_validate` method.
Context has next format:
```python
{
    "attachments": {
        "attachment_key": b"binary content"
    }
}
```


```python
class Model(pydantic.BaseModel):
    class File(pydantic.BaseModel):
        content: bytes 

        @pydantic.field_validator('content', mode='before')
        def validate(data, info: pydantic.ValidationInfo) -> bytes:
            print("Validate", data, "\n")
            if isinstance(data, dict):
                key = data["$attachment"]
                if key in info.context["attachments"]:
                    return info.context["attachments"][key]
                else:
                    raise ValueError(f'conten with key "{key}" does not present in the attachments')
            return data

    files: list['Model.File'] = []
```


