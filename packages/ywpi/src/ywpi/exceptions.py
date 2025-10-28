import typing as t

import pydantic


def get_exception_serialization_model(e: BaseException) -> type[pydantic.BaseModel] | None:
    exception_tp = type(e)
    type_hints = t.get_type_hints(exception_tp)
    model_tp = type_hints.get("serialization_model", None)
    if model_tp is not None and issubclass(model_tp, pydantic.BaseModel):
        return model_tp

