"""Agent that calls a method implemented by the hub during startup."""

from contextlib import contextmanager

import ywpi


@contextmanager
def lifespan(hub: ywpi.Hub):
    print("Calling hub.sum() ...")
    result = hub.execute_hub_method(
        "sum",
        {
            "left": 2,
            "right": 40,
        },
    )
    print(f"Hub response: {result}")

    yield


if __name__ == "__main__":
    ywpi.serve(
        id="hub-method-example-agent",
        name="Hub method example agent",
        lifespan=lifespan,
    )
