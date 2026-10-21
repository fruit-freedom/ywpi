import pytest
import typing as t
import asyncio

from ywpi import RegisteredMethod
from ywpi.handle_args import get_input_dict, get_output_dict
from ywpi_hub import hub_models
from ywpi_hub import hub_pb2

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
async def test_execute_method_stream_end_to_end():
    import threading

    release_second_chunk = threading.Event()
    method_completed = threading.Event()

    def method():
        yield {"chunk": 1}
        release_second_chunk.wait(timeout=5)
        yield {"chunk": 2}
        method_completed.set()

    agent = Agent(id="test-agent-id", name="test-agent-name", methods={
        "method": RegisteredMethod(method, {}, {})
    })

    async with create_app_with_agents([agent]) as app:
        stream = app.execute_method_stream("test-agent-id", "method", {})

        # This goes through the real agent SDK, Exchanger, Hub.Connect and
        # RPC_UPDATE_TASK. The first chunk must arrive while the method is
        # still blocked before producing the second one.
        first = await asyncio.wait_for(anext(stream), timeout=1)
        assert first == {"chunk": 1}
        assert not method_completed.is_set()

        release_second_chunk.set()
        assert await anext(stream) == {"chunk": 2}
        with pytest.raises(StopAsyncIteration):
            await anext(stream)
        assert method_completed.is_set()


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
async def test_agent_starts_hub_task():
    callback_started = asyncio.Event()
    callback_finished = asyncio.Event()

    async def on_start_task(method_name: str, inputs: dict):
        assert method_name == 'hub_method'
        assert inputs == {'value': 42}
        callback_started.set()
        await callback_finished.wait()
        return {'result': 'ok'}

    agent = Agent(id="test-agent-id", name="test-agent-name", methods={})

    async with create_app_with_agents([agent], on_start_task=on_start_task) as app:
        response = await app.agents_repository.get('test-agent-id').connector._handle_reuest_cb(
            hub_pb2.RequestMessage(
                rpc=hub_pb2.Rpc.RPC_START_TASK,
                payload=hub_models.StartTaskRequest(
                    id='agent-request-id',
                    method='hub_method',
                    params={'value': 42},
                ).model_dump_json(),
            )
        )

        task = hub_models.StartTaskResponse.model_validate_json(response.payload)
        assert task.task_id is not None
        await callback_started.wait()
        assert task.status == 'success'
        callback_finished.set()
        await asyncio.sleep(0.1)


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

DEFAULT_RET_VALUE = {
    "key": "value"
}

@pytest.mark.asyncio
async def test_outputs_not_pydantic():
    from typing import List, Dict

    def method() -> List[Dict[str, str]]:
        return DEFAULT_RET_VALUE

    inputs = get_input_dict(method)
    outputs = get_output_dict(method)

    agent = Agent(id="test-agent-id", name="test-agent-name", methods={
        "method": RegisteredMethod(method, inputs, outputs)
    })

    async with create_app_with_agents([agent]) as app:
        recieved_outputs = await app.execute_method("test-agent-id", "method", {})
        assert recieved_outputs == DEFAULT_RET_VALUE


def test_outputs_default():
    from typing import List, Dict

    def method() -> List[Dict[str, str]]: return {}
    get_output_dict(method)

    def method() -> int: return {}
    get_output_dict(method)

    def method() -> list: return {}
    get_output_dict(method)

    def method() -> t.Any: return {}
    get_output_dict(method)
