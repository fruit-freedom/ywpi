import typing as t

T = t.TypeVar('T')


class Stream(t.Generic[T]):
    def __init__(
        self,
        get_item_callback: t.Callable[[], T],
        init_items: list | None = None
    ):
        self._init_items = init_items
        self._get_item_callback = get_item_callback

    def __next__(self) -> T:
        return self._get_item_callback()

    def __iter__(self):
        return self


__all__ = (
    'Stream',
)
