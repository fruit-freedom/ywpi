import typing as t
import fastapi

router = fastapi.APIRouter()




@router.post('/api/webhooks')
async def handle(body: t.Annotated[dict, fastapi.Body()]):
    print(body)

