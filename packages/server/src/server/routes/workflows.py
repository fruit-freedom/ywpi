import typing as t
import asyncio

import fastapi

from server.hub_repository import AgentDeleted
from server.processing.api import to_chains_workflow
from server.processing.chains import Chain
from server.processing.models import Wf
from server.processing.steps import BaseStep, IStepHandler, IStepRunner
from server.hub_service import hub
from server import hub_models
from server.repositories.utils import Paginated
from server.repositories.workflows import Workflow, workflows_repository
from server.repositories.agents import agents_repository


class HubMethodStep(IStepRunner):
    def __init__(self, agent_id: str, method_name: str):
        self._method_name = method_name
        self._agent_id = agent_id

    async def initialize(self, params: dict[str, t.Any]) -> None: pass

    async def destruct(self): pass

    async def run(self, inputs):
        return await hub.execute_method(self._agent_id, self._method_name, inputs)


class HubMethod(IStepHandler):
    def __init__(self, agent_id: str, method_name: str, inputs: dict, outputs: dict):
        self._method_name = method_name
        self._agent_id = agent_id
        self._inputs = inputs
        self._outputs = outputs

    def required_params(self): return { }

    def required_inputs(self) -> dict[str, t.Any]:
        return self._inputs

    def produced_outputs(self) -> dict[str, t.Any]:
        return self._outputs

    def method(self):
        return f"{self._agent_id}/{self._method_name}"

    def __call__(self):
        return HubMethodStep(self._agent_id, self._method_name)


def register_agent(agent: hub_models.RegisterAgentRequest):
    for method in agent.methods:
        BaseStep.register_handler_class(
            HubMethod(
                agent.id,
                method.name,
                {
                    i.name: str
                    for i in method.inputs
                },
                {
                    o.name: str
                    for o in method.outputs
                }
            )
        )


async def lifespan(app: fastapi.APIRouter):
    async def update_agents():
        async for message in hub.agents_respoitory.subscribe_on_updates():
            if isinstance(message, hub_models.RegisterAgentRequest):
                register_agent(message)
            elif isinstance(message, AgentDeleted):
                pass
            elif isinstance(message, dict):
                for agent in message.values():
                    register_agent(agent)
                await agents_repository.set_agents_activity(list(message))
            else:
                print("Error: unknown message type", message)

    task = asyncio.create_task(update_agents())
    yield
    task.cancel()


router = fastapi.APIRouter(lifespan=lifespan, prefix="/api/workflows", tags=["Workflows"])


@router.post('/execute')
async def execute_workflow(body: t.Annotated[dict, fastapi.Body()]) -> dict:
    print(body)
    workflow = to_chains_workflow(Wf.model_validate(body))

    chain, payload = Chain.from_dict(workflow)
    returns = await chain.run(payload)
    print(returns)
    return returns

import pydantic


class ChainDescription(pydantic.BaseModel):
    steps: dict[str, t.Any]
    returns: dict[str, t.Any]
    payload: dict[str, t.Any]


@router.post('/execute_chain')
async def execute_chain(chain_json: t.Annotated[dict, fastapi.Body()]) -> dict:
    chain, payload = Chain.from_dict(chain_json)
    returns = await chain.run(payload)
    return returns


@router.post("")
async def create_workflow(body: t.Annotated[Workflow, fastapi.Body()]):
    return await workflows_repository.create(body)


@router.get("")
async def workflows_list() -> Paginated[Workflow]:
    workflows, count = await workflows_repository.list_and_count()
    return Paginated(items=workflows, total=count, page=1)


@router.get("/{workflow_id}")
async def get_workflow(workflow_id: str):
    return await workflows_repository.get(workflow_id)


@router.delete("/{workflow_id}")
async def delete_workflow(workflow_id: str):
    await workflows_repository.delete(workflow_id)


@router.patch("/{workflow_id}")
async def update_workflow(workflow_id: str, body: t.Annotated[dict, fastapi.Body()]):
    await workflows_repository.update(workflow_id, body)

