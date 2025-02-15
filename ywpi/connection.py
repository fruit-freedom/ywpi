from concurrent import futures

import pydantic

from . import hub_pb2
from . import hub_pb2_grpc
from . import hub_models


class AbstractConnection:
    def call(
        self,
        rpc: hub_pb2.Rpc,
        payload: pydantic.BaseModel
    ) -> futures.Future[hub_pb2.ResponseMessage]: raise NotImplementedError()

    def call_register_agent(
        self,
        payload: hub_models.RegisterAgentRequest
    ) -> futures.Future[hub_pb2.ResponseMessage]: raise NotImplementedError()

    def call_update_task(
        self,
        payload: hub_models.UpdateTaskRequest
    ) -> futures.Future[hub_pb2.ResponseMessage]: raise NotImplementedError()
