import typing as t

import pydantic


PyObjectId = t.Annotated[str, pydantic.BeforeValidator(str)]

T = t.TypeVar("T")


class Paginated(pydantic.BaseModel, t.Generic[T]):
    items: list[T]
    total: int
    page: int
