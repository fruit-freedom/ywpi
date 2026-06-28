from fastapi import APIRouter
import pydantic


router = APIRouter()


class Repository:
    async def add_context(self, text: str):
        pass

    async def get_contexts(self) -> list[str]:
        pass



@router.get("/context-providing-api")
async def get_contexts(task: str):
    pass


class AddContextBody(pydantic.BaseModel):
    text: str


@router.post("/context-providing-api")
async def add_context(body: AddContextBody):
    pass


