import pytest

from ywpi import RegisteredMethod
from ywpi_hub import hub_models

from utils import Agent, create_app_with_agents


@pytest.mark.asyncio
async def test_simple():
    outputs = {
        "key": "value"
    }
    def method():
        return outputs

    agent = Agent(id="test-agent-id", name="test-agent-name", methods={
        "method": RegisteredMethod(method, {}, {})
    })
    
    async with create_app_with_agents([agent]) as app:
        recieved_outputs = await app.execute_method("test-agent-id", "method", {})
        print("Outputs", recieved_outputs)
        assert recieved_outputs == outputs


@pytest.mark.asyncio
async def test_simple_error():
    def method():
        raise RuntimeError()

    agent = Agent(id="test-agent-id", name="test-agent-name", methods={
        "method": RegisteredMethod(method, {}, {})
    })
    
    async with create_app_with_agents([agent]) as app:
        with pytest.raises(hub_models.MethodExecutionError) as e:
            outputs = await app.execute_method("test-agent-id", "method", {})

        assert e.value.source_exception_type == "RuntimeError"
        assert e.value.data is None


@pytest.mark.asyncio
async def test_custom_data_error():
    import pydantic

    class TestCustomErrorModel(pydantic.BaseModel):
        field: str

    class TestCustomError(BaseException):
        field: str
        serialization_model: TestCustomErrorModel

        def __init__(self, field):
            self.field = field

    def method():
        raise TestCustomError("value")

    agent = Agent(id="test-agent-id", name="test-agent-name", methods={
        "method": RegisteredMethod(method, {}, {})
    })
    
    async with create_app_with_agents([agent]) as app:
        with pytest.raises(hub_models.MethodExecutionError) as e:
            outputs = await app.execute_method("test-agent-id", "method", {})

        assert e.value.source_exception_type == "TestCustomError"
        assert e.value.data == { "field": "value" }


@pytest.mark.asyncio
async def test_custom_data_error_wrong_model():
    import pydantic

    class TestCustomErrorModel(pydantic.BaseModel):
        field: str
        other_required_field: str

    class TestCustomError(BaseException):
        field: str
        serialization_model: TestCustomErrorModel

        def __init__(self, field):
            self.field = field

    def method():
        raise TestCustomError("value")

    agent = Agent(id="test-agent-id", name="test-agent-name", methods={
        "method": RegisteredMethod(method, {}, {})
    })
    
    async with create_app_with_agents([agent]) as app:
        with pytest.raises(hub_models.MethodExecutionError) as e:
            outputs = await app.execute_method("test-agent-id", "method", {})

        assert e.value.source_exception_type == "TestCustomError"
        assert e.value.data is None


@pytest.mark.asyncio
async def test_custom_data_error_no_serialization_model():
    class TestCustomError(BaseException):
        field: str
        serialization_model: int

        def __init__(self, field):
            self.field = field

    def method():
        raise TestCustomError("value")

    agent = Agent(id="test-agent-id", name="test-agent-name", methods={
        "method": RegisteredMethod(method, {}, {})
    })
    
    async with create_app_with_agents([agent]) as app:
        with pytest.raises(hub_models.MethodExecutionError) as e:
            outputs = await app.execute_method("test-agent-id", "method", {})

        assert e.value.source_exception_type == "TestCustomError"
        assert e.value.data is None
