import typing as t
import functools
from inspect import signature

import pydantic

import ywpi


# TODO: # Add support for LexicalNode, list[LexicalNode], Markdown, Streaming
TaskAgentFnT = t.Callable[[], t.Union[str]]


class AgentTaskOutputs(pydantic.BaseModel):
    result: t.Optional[str] = None


class AgentTask(pydantic.BaseModel):
    description: str


def agent_task(fn: TaskAgentFnT):
    """
    Decorate function that implement "agent task" workflow.

    Possible inputs:
    - Context[Markdown]
    - Selection
    - AgentTask
    """

    @functools.wraps(fn)
    def wrapper(*args, **kwargs):
        return AgentTaskOutputs(result=fn(*args, **kwargs))

    # Replace outputs annotation
    sig = signature(wrapper)
    wrapper.__signature__ = sig.replace(
        parameters=list(sig.parameters.values()),
        return_annotation=AgentTaskOutputs
    )

    return ywpi.method(wrapper, labels=["contexts.agent_task"])
