import typing as t
import functools
from inspect import signature

import pydantic

import ywpi


# TODO: # Add support for LexicalNode, list[LexicalNode], Markdown
CompletitionFnT = t.Callable[[], t.Union[str]]


class CompletitionOutputs(pydantic.BaseModel):
    completition: t.Optional[str] = None


def completition(fn: CompletitionFnT):
    """
    Decorate function that implement "autocomplete" (completition) workflow

    Possible inputs:
    - Context[Markdown]
    - Selection
    """

    @functools.wraps(fn)
    def wrapper(*args, **kwargs):
        return CompletitionOutputs(completition=fn(*args, **kwargs))

    # Replace outputs annotation
    sig = signature(wrapper)
    wrapper.__signature__ = sig.replace(
        parameters=list(sig.parameters.values()),
        return_annotation=CompletitionOutputs
    )

    return ywpi.method(wrapper, labels=["contexts/completition"])
