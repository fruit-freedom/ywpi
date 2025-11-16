import typing as t


TaskAgentFnT = t.Callable[[], t.Union[str, t.Iterator[str]]]


def agent_task(fn: TaskAgentFnT):
    """
    Decorate function that implement "agent task" workflow
    """
    ...

@agent_task
def issue_helper(task: str):
    for out in ["# TO BE\n", "- Document page implemented\n", "- Document API implemented"]:
        yield out
    print("Create issue")


