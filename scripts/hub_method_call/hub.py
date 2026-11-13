"""Small hub used by scripts/hub_method_call/agent.py."""

import asyncio

from ywpi_hub.app import HubApp


async def on_start_task(method_name: str, inputs: dict) -> dict:
    if method_name != "sum":
        raise ValueError(f"Unknown hub method: {method_name}")

    return {
        "result": inputs["left"] + inputs["right"],
    }


async def main() -> None:
    app = HubApp()
    app.on_start_task(on_start_task)
    await app.run()


if __name__ == "__main__":
    asyncio.run(main())
