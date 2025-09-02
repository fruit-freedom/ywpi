






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