import typing as t
import traceback
# import asyncio

import fastapi
import pydantic
from bson import ObjectId

# from server import hub_models

# from ..db import contexts_collection
from server.hub_service import hub


from server.repositories.contexts import Context, Label, Subscribtion, contexts_repository
from server.services.contexts_service import contexts_service

"""
Iterfaces:


- TaskPerform
- ContextSubscribtion
"""


async def lifespan(app: fastapi.FastAPI):
    async with hub.lifespan():
        async with contexts_service:
            yield


router = fastapi.APIRouter(lifespan=lifespan)


@router.post('/api/projects/{project_id}/contexts', tags=['contexts'])
async def create_context(
    project_id: str,
    tp: t.Annotated[str, fastapi.Body()],
    data: t.Annotated[dict, fastapi.Body()] = {},
    name: t.Annotated[t.Optional[str], fastapi.Body()] = None,
    labels: t.Annotated[t.Optional[list[Label]], fastapi.Body()] = [],
) -> Context:
    context = Context(
        tp=tp,
        data=data,
        project_id=project_id,
        labels=labels,
        name=name
    )

    return await contexts_service.create(context)


@router.get('/api/projects/{project_id}/contexts/{context_id}', tags=['contexts'])
async def get_context(project_id: str, context_id: str) -> Context:
    try:
        return await contexts_service.get(context_id)
    except:
        raise fastapi.HTTPException(status_code=404)


@router.get('/api/projects/{project_id}/contexts', tags=['contexts'])
async def get_contexts_list(
    project_id: str,
    q: t.Optional[str] = None
) -> list[Context]:
    contexts, count = await contexts_service.list_and_count(project_id, q)
    return contexts


@router.patch('/api/projects/{project_id}/contexts/{context_id}', tags=['contexts'])
async def update_context(
    project_id: str,
    context_id: str,
    labels: t.Annotated[t.Optional[list[Label]], fastapi.Body()] = None,
    data: t.Annotated[t.Optional[dict], fastapi.Body()] = None,
) -> Context:
    if data is not None:
        raise fastapi.HTTPException(400, "data update does not implemented")

    await contexts_service.update(
        context_id,
        {
            '$set': {
                'labels': [
                    l.model_dump(mode='json') for l in labels
                ]
            }
        }
    )


class CreateTraceBody(pydantic.BaseModel):
    trace: str

@router.post('/api/projects/{project_id}/contexts/{context_id}/traces', tags=['contexts'])
async def add_trace(
    project_id: str,
    context_id: str,
    body: CreateTraceBody
):
    await contexts_repository.add_trace(context_id, body.trace)


@router.post('/api/projects/{project_id}/contexts/{context_id}/apply', tags=['contexts'])
async def apply_update_to_context(
    project_id: str,
    context_id: str,
    update: t.Annotated[dict, fastapi.Body()] = None,
    shadow_update: t.Annotated[t.Optional[bool], fastapi.Body()] = False,
    subscribtions: t.Annotated[t.Optional[list[Subscribtion]], fastapi.Body()] = None,
) -> Context | None:
    """
    Example update:
    ```json
    {
        "$push": {
            "messages": {
                "role": "user",
                "content": "Hello"
            }
        }
    }
    ```
    """

    if shadow_update or subscribtions is not None:
        raise fastapi.HTTPException(400, "shadow_update and subscribtions does not supported")

    return await contexts_service.update(context_id, update)

    updated_context = None
    if subscribtions is not None:
        updated_context = await contexts_repository.set_subscribtions(context_id, subscribtions)

    if update is not None:
        updated_context = Context.model_validate(
            await apply_context_update(context_id, update)
        )

        if not shadow_update:
            for sub in updated_context.subscribtions:
                try:
                    # Arg should be ctx
                    task_id = await hub.execute_method_async(
                        sub.agent_id,
                        sub.method_name,
                        { "ctx": updated_context.model_dump(mode='json') }
                    )
                    print("Created task", task_id)
                except:
                    traceback.print_exc()


    # Select context type
    # If type == "Chat"
    #   Select all methods filtering by subscribtions fields

    return updated_context


@router.delete('/api/projects/{project_id}/contexts/{context_id}', tags=['contexts'])
async def delete_context(project_id: str, context_id: str):
    deleted = await contexts_service.delete(context_id)

    if not deleted:
        raise fastapi.HTTPException(status_code=404)
