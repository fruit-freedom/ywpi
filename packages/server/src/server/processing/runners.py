import typing

class AbstractMap:
    def __init__(self) -> None: pass
    # async def __aiter__(self): raise NotImplementedError()
    # async def __anext__(self, *args): raise NotImplementedError()
    async def run(self, inputs: dict[str, typing.Any]): raise NotImplementedError()

class AbstractReduce:
    async def reduce(self, inputs: dict[str, typing.Any]) -> dict[str, typing.Any]: raise NotImplementedError()
    async def run(self, inputs: dict[str, typing.Any]) -> dict[str, typing.Any]: raise NotImplementedError()

class AbstractRunner:
    def __init__(self) -> None: pass
    async def run(self, inputs: dict[str, typing.Any]) -> dict[str, typing.Any]: raise NotImplementedError()
    async def destruct(self): pass
