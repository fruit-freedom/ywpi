import asyncio

from ywpi_hub.app import HubApp





class SimpleApp(HubApp):
    pass
    async def authenticate(self, api_key: str | None) -> bool:
        return api_key == "hello"


async def main():
    app = SimpleApp()
    await app.run()


if __name__ == "__main__":
    asyncio.run(main())


