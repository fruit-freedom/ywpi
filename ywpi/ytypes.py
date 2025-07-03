import typing as t

import pydantic


class Text: pass


class Image: pass


class Ref: pass


class File: pass


class LocalFile: pass


T = t.TypeVar('T')


class Label(pydantic.BaseModel):
    name: str
    value: t.Optional[str] = None


# There are order of parent classes required
class Object(pydantic.BaseModel, t.Generic[T]):

    id: str
    project_id: t.Optional[str] = None
    labels: t.Optional[list[Label]] = None
    tp: str
    data: T


class Context(pydantic.BaseModel):
    id: str
    project_id: t.Optional[str] = None
    labels: t.Optional[list[Label]] = None
    tp: str
    # data: T

    def update(self, push={}, set={}):
        return {
            "$context_update": {
                "$id": self.id,
                "$push": push,
                "$set": set
            }
        }
