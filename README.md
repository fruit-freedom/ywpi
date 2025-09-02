# YWPI

AI agents context platform.


## Quick start

Install ywpi package:
```bash
pip install ywpi
```

Create `main.py` with following content:
```python
import typing as t

import ywpi


@ywpi.method
def make_summary(text: t.Annotated[str, ywpi.Text]):
    yield {
        "summary": "Text..."
    }
```

Run agent:
```bash
ywpi run main.py --id summary-agent
```


## Run builtin methods

#### Search method
```bash
python -m ywpi.cli run --id 1234 agents/search/main.py
docker compose --project-directory agents/search up
```















agents, tools -> ywpi.Agent
context template -> configuration
context -> chat instance


Agent
```json
{
    "name": "",
    "versions": {
        {
            "name": "v1",
            "image": "",
            "inputs": {},
            "outputs": {}
        }
    },
}
```


Agent:
    - Other agents list
    - Tools list


```yaml
agents:
    programmer:
        image: cr.ru/programmer-agents
        spec:
            additional_property: true 
            max_program_size: 120Kb
            model:
            base_url: http://api.proxyapi.ru
            model: gpt4o
        topics:
            - programmer
    planner:
        image: cr.ru/planner-common-agent
            spec:
            additional_property: true
            model_as_tool: true
        tools:
            - llm
        topics:
            - default
    executer:
        image: cr.ru/planner-common-agent
        spec:
            additional_property: true
            model_as_tool: true
        tools:
            - llm
            - code-execution
            - selector:
                kind: common
        topics:
            - code-execution
topics:
    default:
    code-execution:
    programmer:
tools:
    llm:
        name: 'llm/gemma3'
        spec:
            model: gemma3:latest
    code-execution:
        spec:
            timeout: 10s
            max_memory: 40Mb
```



### Init project in dev mode
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install uv
uv pip install -e packages/ywpi

# Hub
uv pip install -e packages/ywpi_hub

# Server
uv pip install -e packages/server
```

Add dependency to package
```bash
uv add --package <ywpi/ywpi_hub> <packages...>

uv sync --package ywpi_hub --all-groups
```




