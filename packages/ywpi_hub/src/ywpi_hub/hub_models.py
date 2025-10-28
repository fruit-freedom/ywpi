import typing as t

import pydantic


class InputDescription(pydantic.BaseModel):
    name: str
    type: str


class Type(pydantic.BaseModel):
    name: str
    args: t.Optional[list['Type']] = None


class Field(pydantic.BaseModel):
    name: str
    type: Type
    description: t.Optional[str] = None


class Label(pydantic.BaseModel):
    name: str
    value: t.Optional[str] = None


class Subscribtion(pydantic.BaseModel):
    selector: dict


class Method(pydantic.BaseModel):
    name: str
    inputs: list[Field]
    outputs: list[Field]
    description: t.Optional[str] = None
    labels: t.Optional[list[Label]] = None
    subscribtions: t.Optional[list[Subscribtion]] = None
    openai_schema: t.Optional[dict] = None # OpenAI compatible function schema


class RegisterAgentRequest(pydantic.BaseModel):
    id: str
    name: str
    project: t.Optional[str] = None
    description: t.Optional[str] = None
    methods: list[Method]


class RegisterAgentResponse(pydantic.BaseModel):
    pass


class StartTaskRequest(pydantic.BaseModel):
    id: str
    method: str
    params: dict[str, t.Any] = { }
    attachments: t.MutableMapping[str, bytes] = { } # Type from protobuf


class StartTaskResponse(pydantic.BaseModel):
    status: str = 'success'


class StartTrackinTaskResponse(pydantic.BaseModel):
    id: str

ErrorTypeT = t.Union[t.Literal['MethodExecutionError', 'MethodCallError'], str]

class Error(pydantic.BaseModel):
    type: t.Union[t.Literal['MethodExecutionError', 'MethodCallError'], str] # Exception type
    traceback: t.Optional[str] = None
    data: t.Optional[dict] = None


class UpdateTaskRequest(pydantic.BaseModel):
    """
    `error` field ignored if `status != failed`
    """
    id: str
    status: t.Optional[str] = None
    outputs: t.Optional[dict] = None
    error: t.Optional[Error] = None


class UpdateTaskResponse(pydantic.BaseModel):
    pass


# Exceptions (should be in distinct file)


class YwpiException(BaseException):
    type: str # TODO: Remove `type` from exception and create `UnknownException` class with fiedl type
    traceback: t.Optional[str] = None
    data: t.Optional[dict] = None

    _subclasses: dict[str, t.Type['YwpiException']] = {}

    """
    Base serializable exception that contains json serializable `data`.
    """
    def __init__(
        self,
        *args,
        type: str = "YwpiException", # RuntimeError, TypeError
        data: t.Optional[dict] = None,
        traceback: str = None
    ):
        super().__init__(*args)
        self.type = type
        self.data = data
        self.traceback = traceback

    @classmethod
    def from_error(cls, error: Error):
        if error.type in YwpiException._subclasses:
            return YwpiException._subclasses[type](type=error.type, data=error.data, traceback=error.traceback)

        return YwpiException(type=error.type, data=error.data, traceback=error.traceback)

    def to_error(self) -> Error:
        return Error(
            type=self.type,
            data=self.data,
            traceback=self.traceback
        )

    @classmethod
    def from_data(cls, type: ErrorTypeT, data: t.Optional[dict] = None, traceback: t.Optional[str] = None):
        if type in YwpiException._subclasses:
            return YwpiException._subclasses[type](type=type, data=data, traceback=traceback)

        return YwpiException(type=type, data=data, traceback=traceback)

    def __init_subclass__(cls, **kwargs):
        # Collect all subclass exceptions
        YwpiException._subclasses[cls.__name__] = cls


class AgentNotFoundError(YwpiException): ...


class MethodNotFoundError(YwpiException): ...


class MethodCallError(YwpiException):
    """Base class for communication errors"""


class MethodExecutionError(YwpiException):
    """
    Base class for user defined method exceptions. It is container for exceptions that method raised.

    Why is this class container for exception?
    In both cases information about error inheritance will be losted, but in encapsulation
    case (current implementation) we got information about **place** where it was raised - in user method.
    In simple inheritance from `MethodExecutionError` we should save additional property about inheritance fact.
    """

    source_exception_type: str
    data: t.Optional[dict] = None # User defined optional payload

    def __init__(self, *args, type = "MethodExecutionError", data = None, traceback = None):
        super().__init__(*args, type=type, data=data, traceback=traceback)
        self.source_exception_type = data["source_exception_type"]
        self.data = data["data"]
