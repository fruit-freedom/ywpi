from google.protobuf.internal import containers as _containers
from google.protobuf.internal import enum_type_wrapper as _enum_type_wrapper
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from typing import ClassVar as _ClassVar, Iterable as _Iterable, Mapping as _Mapping, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class Rpc(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
    __slots__ = ()
    RPC_UNDEFINED: _ClassVar[Rpc]
    RPC_REGISTER_AGENT: _ClassVar[Rpc]
    RPC_HEARTBEAT_AGENT: _ClassVar[Rpc]
    RPC_START_TASK: _ClassVar[Rpc]
    RPC_ABORT_TASK: _ClassVar[Rpc]
    RPC_UPDATE_TASK: _ClassVar[Rpc]
RPC_UNDEFINED: Rpc
RPC_REGISTER_AGENT: Rpc
RPC_HEARTBEAT_AGENT: Rpc
RPC_START_TASK: Rpc
RPC_ABORT_TASK: Rpc
RPC_UPDATE_TASK: Rpc

class RequestMessage(_message.Message):
    __slots__ = ("rpc", "payload")
    RPC_FIELD_NUMBER: _ClassVar[int]
    PAYLOAD_FIELD_NUMBER: _ClassVar[int]
    rpc: Rpc
    payload: str
    def __init__(self, rpc: _Optional[_Union[Rpc, str]] = ..., payload: _Optional[str] = ...) -> None: ...

class ResponseMessage(_message.Message):
    __slots__ = ("payload", "error")
    PAYLOAD_FIELD_NUMBER: _ClassVar[int]
    ERROR_FIELD_NUMBER: _ClassVar[int]
    payload: str
    error: str
    def __init__(self, payload: _Optional[str] = ..., error: _Optional[str] = ...) -> None: ...

class Message(_message.Message):
    __slots__ = ("reply_to", "request", "response", "attachments")
    class AttachmentsEntry(_message.Message):
        __slots__ = ("key", "value")
        KEY_FIELD_NUMBER: _ClassVar[int]
        VALUE_FIELD_NUMBER: _ClassVar[int]
        key: str
        value: bytes
        def __init__(self, key: _Optional[str] = ..., value: _Optional[bytes] = ...) -> None: ...
    REPLY_TO_FIELD_NUMBER: _ClassVar[int]
    REQUEST_FIELD_NUMBER: _ClassVar[int]
    RESPONSE_FIELD_NUMBER: _ClassVar[int]
    ATTACHMENTS_FIELD_NUMBER: _ClassVar[int]
    reply_to: str
    request: RequestMessage
    response: ResponseMessage
    attachments: _containers.ScalarMap[str, bytes]
    def __init__(self, reply_to: _Optional[str] = ..., request: _Optional[_Union[RequestMessage, _Mapping]] = ..., response: _Optional[_Union[ResponseMessage, _Mapping]] = ..., attachments: _Optional[_Mapping[str, bytes]] = ...) -> None: ...

class PushTaskRequest(_message.Message):
    __slots__ = ("agent_id", "method", "params", "payload")
    AGENT_ID_FIELD_NUMBER: _ClassVar[int]
    METHOD_FIELD_NUMBER: _ClassVar[int]
    PARAMS_FIELD_NUMBER: _ClassVar[int]
    PAYLOAD_FIELD_NUMBER: _ClassVar[int]
    agent_id: str
    method: str
    params: str
    payload: str
    def __init__(self, agent_id: _Optional[str] = ..., method: _Optional[str] = ..., params: _Optional[str] = ..., payload: _Optional[str] = ...) -> None: ...

class PushTaskResponse(_message.Message):
    __slots__ = ("task_id", "error")
    TASK_ID_FIELD_NUMBER: _ClassVar[int]
    ERROR_FIELD_NUMBER: _ClassVar[int]
    task_id: str
    error: str
    def __init__(self, task_id: _Optional[str] = ..., error: _Optional[str] = ...) -> None: ...

class RunTaskResponse(_message.Message):
    __slots__ = ("task_id", "error", "outputs")
    TASK_ID_FIELD_NUMBER: _ClassVar[int]
    ERROR_FIELD_NUMBER: _ClassVar[int]
    OUTPUTS_FIELD_NUMBER: _ClassVar[int]
    task_id: str
    error: str
    outputs: str
    def __init__(self, task_id: _Optional[str] = ..., error: _Optional[str] = ..., outputs: _Optional[str] = ...) -> None: ...

class GetAgentsListRequest(_message.Message):
    __slots__ = ()
    def __init__(self) -> None: ...

class Input(_message.Message):
    __slots__ = ("name", "type")
    NAME_FIELD_NUMBER: _ClassVar[int]
    TYPE_FIELD_NUMBER: _ClassVar[int]
    name: str
    type: str
    def __init__(self, name: _Optional[str] = ..., type: _Optional[str] = ...) -> None: ...

class Method(_message.Message):
    __slots__ = ("name", "inputs")
    NAME_FIELD_NUMBER: _ClassVar[int]
    INPUTS_FIELD_NUMBER: _ClassVar[int]
    name: str
    inputs: _containers.RepeatedCompositeFieldContainer[Input]
    def __init__(self, name: _Optional[str] = ..., inputs: _Optional[_Iterable[_Union[Input, _Mapping]]] = ...) -> None: ...

class Agent(_message.Message):
    __slots__ = ("id", "name", "methods")
    ID_FIELD_NUMBER: _ClassVar[int]
    NAME_FIELD_NUMBER: _ClassVar[int]
    METHODS_FIELD_NUMBER: _ClassVar[int]
    id: str
    name: str
    methods: _containers.RepeatedCompositeFieldContainer[Method]
    def __init__(self, id: _Optional[str] = ..., name: _Optional[str] = ..., methods: _Optional[_Iterable[_Union[Method, _Mapping]]] = ...) -> None: ...

class GetAgentsListResponse(_message.Message):
    __slots__ = ("agents",)
    AGENTS_FIELD_NUMBER: _ClassVar[int]
    agents: _containers.RepeatedCompositeFieldContainer[Agent]
    def __init__(self, agents: _Optional[_Iterable[_Union[Agent, _Mapping]]] = ...) -> None: ...

class SubscribeOnAgentsRequest(_message.Message):
    __slots__ = ()
    def __init__(self) -> None: ...

class SubscribeOnAgentsResponse(_message.Message):
    __slots__ = ("payload", "error")
    PAYLOAD_FIELD_NUMBER: _ClassVar[int]
    ERROR_FIELD_NUMBER: _ClassVar[int]
    payload: str
    error: str
    def __init__(self, payload: _Optional[str] = ..., error: _Optional[str] = ...) -> None: ...
