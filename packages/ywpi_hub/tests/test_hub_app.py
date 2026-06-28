import asyncio
import typing as t

import pydantic

from ywpi_hub.connection import HubApp
from ywpi_hub.serialization import BytesSerializer


class Model(pydantic.BaseModel):
    class File(pydantic.BaseModel):
        id: int
        content: t.Annotated[bytes, BytesSerializer]

    files: list['Model.File'] = []


async def main():
    app = HubApp()

    # async def execution():
    #     await asyncio.sleep(2)
    #     await app.execute_method("test", "bytes_inputs_method", {
    #         "data": b"binary content"
    #     })

    async def execution():
        await asyncio.sleep(2)
        await app.execute_method("test", "bytes_pydantic_serialization_method", {
            "data": Model(files=[Model.File(id=1, content=b"binary content")])
        })

    asyncio.create_task(execution())
    await app.run()


def runserver():
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        pass


if __name__ == '__main__':
    runserver()

