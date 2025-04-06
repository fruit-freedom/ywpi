import typing as t
import threading
import traceback

from .connection import AbstractConnection
from . import serialization
from . import hub_models
from .logger import logger
from .handle_args import handle_args as params_from_dict
from .stream import Stream

T = t.TypeVar('T')


class Queue(t.Generic[T]):
    """
    Implement custom queue because of requiring `shutdown` method.
    Only Python 3.13 Queue has `shutdown` method.
    """
    def __init__(self, init_items: list | None = None):
        self._lock = threading.Lock()
        self._cond = threading.Condition(self._lock)
        self._items: list[T] = []
        if init_items is not None:
            self._items = init_items.copy()
        self._terminated = False

    def put(self, item: T):
        with self._lock:
            self._items.append(item)

    def terminate(self):
        with self._cond:
            self._terminated = True
            self._cond.notify_all()

    def get(self) -> T:
        with self._cond:
            if len(self._items) <= 0 and not self._terminated: # List empty
                self._cond.wait_for(lambda: len(self._items) > 0 or self._terminated)

                if len(self._items) <= 0 or self._terminated:
                    raise StopIteration()

            return self._items.pop(0)


class IOManager:
    def __init__(
        self,
        task_id: str,
        io_schema: dict, # Actually inputs schema
        connection: AbstractConnection
    ):
        self._lock = threading.Lock()
        self._cv = threading.Condition()
        self._streams: dict[str, Queue] = {}
        self._connection = connection
        self._task_id = task_id
        self._io_schema = io_schema

    @property
    def task_id(self):
        return self._task_id

    def handle_outputs(self, outputs: t.Union[dict, tuple, t.Any]):
        """
        Handle method outputs.
        """
        return self._connection.call_update_task(
            hub_models.UpdateTaskRequest(id=self._task_id, outputs=serialization.handle_outputs(outputs))
        )

    def handle_inputs(self, inputs: dict[str, t.Any]) -> dict[str, t.Any]:
        params = params_from_dict(inputs, self._io_schema)

        streams: dict[str, Stream] = {}

        for k, v in params.items():
            if isinstance(v, Stream):
                streams[k] = v

        return params

    def update_task_status(self, status: str, final_outputs: dict = None):
        outputs = None
        try:
            outputs = serialization.handle_outputs(final_outputs) if final_outputs is not None else None
        except:
            logger.warning(f'Error while converting final task outputs: {traceback.format_exc()}')
            status = 'failed'

        return self._connection.call_update_task(hub_models.UpdateTaskRequest(
            id=self._task_id,
            status=status,
            outputs=outputs
        ))

    def append_stream(self, stream_id: str, init_items: list | None = None):
        with self._lock:
            if stream_id in self._streams:
                raise KeyError(f'stream "{stream_id}" already exists')
            self._streams[stream_id] = Queue(init_items)

    def get_stream_item(self, stream_id: str):
        """
        Stream call this method to retrieve next item.
        """
        with self._lock:
            if stream_id in self._streams:
                stream = self._streams[stream_id]
            else:
                raise KeyError()

        return stream.get()

    def update_inputs(self, inputs: dict[str, t.Any]):
        """
        Exchanger call this method to append item to stream.
        """
        with self._lock:
            for k, v in inputs:
                if k in self._streams:
                    self._streams[k].put(v)
                else:
                    logger.warning(f'Task "{self._task_id}" does not has stream "{k}"')
