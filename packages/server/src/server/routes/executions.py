import pydantic
from fastapi import APIRouter, HTTPException

from server.hub_service import hub
from server import hub_models
from server.repositories.contexts import contexts_repository

router = APIRouter()


class CreateExecutionBody(pydantic.BaseModel):
    agent_id: str
    method: str
    inputs: dict
    silent: bool = False
    enrichment: bool = True


@router.post("/api/executions")
async def execute_method(body: CreateExecutionBody):
    method = hub.get_method(body.agent_id, body.method)

    # Mock enrichment logic
    resolved_inputs_names = set(body.inputs.keys())
    unresolved_inputs = list(
        filter(
            lambda e: e.name not in resolved_inputs_names,
            method.inputs
        )
    )
    additional_inputs = {}
    if len(unresolved_inputs) > 0:
        context = await contexts_repository.get("69774a8fc4b081a039ba7dcf")
        content = context.data["content"]
 
        for input in unresolved_inputs:
            if input.type.name == "str":
                additional_inputs[input.name] = content
            else:
                raise HTTPException(400, f"Enrichment does not support type: {input.type.name}")

    return await hub.execute_method(
        agent_id=body.agent_id,
        method_name=body.method,
        inputs={**body.inputs, **additional_inputs},
        silent=body.silent
    )

