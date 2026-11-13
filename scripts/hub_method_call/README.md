# Hub method call example

The example demonstrates an agent calling a method implemented by the hub.

Run the hub in one terminal:

```bash
PYTHONPATH=packages/ywpi_hub/src python scripts/hub_method_call/hub.py
```

Then run the agent in another terminal:

```bash
PYTHONPATH=packages/ywpi/src python scripts/hub_method_call/agent.py
```

The agent should print:

```text
Calling hub.sum() ...
Hub response: {'result': 42}
```

The agent stays connected after the lifespan startup code finishes. Stop it
with `Ctrl-C`.
