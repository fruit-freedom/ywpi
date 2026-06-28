import pydantic

from server.repositories.utils import PyObjectId


class Mapping(pydantic.BaseModel):
    id: PyObjectId = pydantic.Field(alias='_id', serialization_alias='id', default=None)
    description: str
    agent_id: str
    method_name: str
    meta: dict


class MappingsRespoitory:
    pass
