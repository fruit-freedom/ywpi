import typing as t

import pydantic


class Text: pass


class Image: pass


class Ref: pass


class File: pass


class LocalFile: pass

T = t.TypeVar('T')

# There are order of parent classes required
class Object(pydantic.BaseModel, t.Generic[T]):
    id: str
    project_id: t.Optional[str] = None
    tp: str
    data: T
