import typing as t
from functools import wraps
from inspect import signature, isgeneratorfunction

import pydantic
import ywpi


T = t.TypeVar('T')


class Subscribtion(pydantic.BaseModel):
    agent_id: str
    method_name: str


class ContextUpdate(pydantic.BaseModel):
    context_id: str
    update: dict

    @pydantic.model_serializer()
    def serialize_model(self):
        return {
            "type": "ContextUpdate",
            "data": {
                "context_id": self.context_id,
                "update": self.update
            }
        }


class Context(pydantic.BaseModel, t.Generic[T]):
    id: str
    project_id: t.Optional[str] = None
    labels: t.Optional[list[ywpi.Label]] = None    
    subscribtions: list[Subscribtion]
    tp: str # type: str
    data: T

    def build_update(self, push={}, set={}):
        return ContextUpdate(
            context_id=self.id,
            update={
                "$push": push,
                "$set": set
            }
        )


class ContextId(pydantic.BaseModel):
    id: str


class InMemoryState(dict): ...


IN_MEMORY_STATES: dict[str, InMemoryState] = {}


def agent(fn):
    """
    Wrapper for chat agents
    ----
    
    Allow to recieve `State` parameter that statefull in-memory storage binded to context ID.

    Automatically handle `str` outputs and convert that to assistant message.
    """
    
    source_signature = signature(fn)
    parameters = []

    state_param_name = None
    for name, parameter in source_signature.parameters.items():
        if parameter.annotation is InMemoryState:
            state_param_name = name
        else:
            parameters.append(parameter)

    @wraps(fn)
    def wrapper(*args, **kwargs):
        context = None
        for k, v in kwargs.items():
            if isinstance(v, Context):
                context = v

        if context is None:
            raise RuntimeError("Context type not found in inputs")

        if not isgeneratorfunction(fn):
            if state_param_name is not None:
                if context.id not in IN_MEMORY_STATES:
                    IN_MEMORY_STATES[context.id] = InMemoryState()

                kwargs[state_param_name] = IN_MEMORY_STATES[context.id]

            outputs = fn(*args, **kwargs)

            if isinstance(outputs, str):
                yield context.build_update(push={
                    "messages": {
                        "role": "assistant",
                        "content": outputs
                    }
                })
            else:
                yield outputs if outputs is not None else {}
        else:
            if state_param_name is not None:
                if context.id not in IN_MEMORY_STATES:
                    IN_MEMORY_STATES[context.id] = InMemoryState()

                kwargs[state_param_name] = IN_MEMORY_STATES[context.id]

            for outputs in fn(*args, **kwargs):
                if outputs is None:
                    yield {}

                if isinstance(outputs, str):
                    yield context.build_update(push={
                        "messages": {
                            "role": "assistant",
                            "content": outputs
                        }
                    })
                else:
                    yield outputs if outputs is not None else {}

    wrapper.__signature__ = source_signature.replace(parameters=parameters)
    ywpi.decorators._register_method(wrapper)

    return wrapper


class LexicalNode(pydantic.BaseModel):
    children: list['LexicalNode'] = []
    type: str
    direction: t.Optional[t.Any] = None
    format: t.Any = None
    indent: int = 0
    textFormat: int = 0
    textStyle: str = ""
    uuid: str = ""

    text: t.Optional[str] = ""

    _key: str = None
    _index: int = None
    _parent: t.Optional['LexicalNode'] = None
    _virtual: bool = False

    def insert_after(self, node: 'LexicalNode') -> dict:
        """Return update dict"""
        return {
            "$push": {
                f"{self._parent._key}.children": {
                    "$each": [node],
                    "$position": self._index + 1
                }
            }
        }

    def insert_before(self, node: 'LexicalNode') -> dict:
        """Return update dict"""
        return {
            "$push": {
                f"{self._parent._key}.children": {
                    "$each": [node],
                    "$position": self._index
                }
            }
        }

    def append(self, node: 'LexicalNode') -> dict:
        """Return update dict"""
        return {
            "$push": {
                f"{self._parent._key}.children": node
            }
        }


class EditorState(pydantic.BaseModel):
    root: LexicalNode

    @staticmethod
    def __update_tree(node: LexicalNode, path: str, index: int | None = None, parent: LexicalNode | None = None):
        for idx, child_node in enumerate(node.children):
            EditorState.__update_tree(child_node, f"{path}.children.{idx}", index=idx, parent=node)

        node._key = path
        if index is not None:
            node._index = index
        if parent is not None:
            node._parent = parent

    @pydantic.model_validator(mode='after')
    def _update_internals(self):
        """
        Add additional fields `_key`, `_index`, `_parent` to build a nodes tree.
        Fields required for simplifying tree update.
        Internal `_key` not equal or linked with lexical `key`.
        """
        self.__update_tree(self.root, "tree.root")
        return self


class Markdown(pydantic.BaseModel):
    content: str = None
    tree: EditorState = None


def append_keys(state: dict, path: str, index: int = None):
    if "children" in state:
        for idx, c in enumerate(state["children"]):
            append_keys(c, f"{path}.children.{idx}", index=idx)

    state["_key"] = path
    if index is not None:
        state["_index"] = index





# model = EditorState.model_validate(state)
# print(model.root.children[0].insert_after("<Node>"))
# print(model.root.children[0].insert_before("<Node>"))
# print(model.root.children[0].append("<Node>"))





class Selection(pydantic.BaseModel):
    nodes: dict[str, LexicalNode]
    text: str

    @pydantic.model_validator(mode='after')
    def _update_internals(self):
        """
        Add additional fields `_key`, `_index`, `_parent` to build a nodes tree.
        Fields required for simplifying tree update.
        Internal `_key` not equal or linked with lexical `key`.
        """
        for k, v in self.nodes.items():
            v._key = k
            v._index = int(k.split(".")[-1])
            indexes = tuple(filter(lambda e: e.isdigit(), k.split(".")))
            parent_index = indexes[:-1]
            parent = "tree.root." + ".".join(map(lambda e: f"children.{e}", parent_index))

            if parent in self.nodes: # Parent also in the selection
                v._parent = self.nodes[parent]
            else:
                key = parent.removeprefix("tree.root.")
                if not len(key):
                    # TODO: Reuse virtual node
                    root = LexicalNode(type="root")
                    root._key = "tree.root"
                    root._index = 0
                    root._virtual = True
                    v._parent = root
                else:
                    virtual_parent_node = LexicalNode(type="undefined")
                    virtual_parent_node._key = "tree.root." + key
                    virtual_parent_node._index = int(k.split(".")[-1])
                    virtual_parent_node._virtual = True
                    v._parent = virtual_parent_node
                    # We know full paths and all parents (without additional info)
                    # But has not got any
                    # TODO: Handle this case
                    # print("Warning: required virtual parent for", parent, key)

        return self

    @pydantic.model_validator(mode='after')
    def _update_internals(self):
        """
        Add additional fields `_key`, `_index`, `_parent` to build a nodes tree.
        Fields required for simplifying tree update.
        Internal `_key` not equal or linked with lexical `key`.
        """
        for k, v in self.nodes.items():
            v._key = k
            v._index = int(k.split(".")[-1])
            indexes = tuple(filter(lambda e: e.isdigit(), k.split(".")))
            parent_index = indexes[:-1]
            parent = "tree.root." + ".".join(map(lambda e: f"children.{e}", parent_index))

            if parent in self.nodes: # Parent also in the selection
                v._parent = self.nodes[parent]
            else:
                key = parent.removeprefix("tree.root.")
                if not len(key):
                    # TODO: Reuse virtual node
                    root = LexicalNode(type="root")
                    root._key = "tree.root"
                    root._index = 0
                    root._virtual = True
                    v._parent = root
                else:
                    virtual_parent_node = LexicalNode(type="undefined")
                    virtual_parent_node._key = "tree.root." + key
                    virtual_parent_node._index = int(k.split(".")[-1])
                    virtual_parent_node._virtual = True
                    v._parent = virtual_parent_node
                    # We know full paths and all parents (without additional info)
                    # But has not got any
                    # TODO: Handle this case
                    # print("Warning: required virtual parent for", parent, key)

        return self



paths = {
    "tree.root.children.3.children.6": LexicalNode(type="text"),
    # "tree.root.children.3": LexicalNode(type="paragraph"),
    # "tree.root.children.4": LexicalNode(type="paragraph"),
    "tree.root.children.4.children.0": LexicalNode(type="text"),
    "tree.root.children.4.children.1": LexicalNode(type="text"),
    "tree.root.children.4.children.2": LexicalNode(type="text"),
    # "tree.root.children.5": LexicalNode(type="paragraph"),
    "tree.root.children.5.children.0": LexicalNode(type="text"),
}


selection = Selection.model_validate({
    "nodes": paths,
    "text": "Text"
})

print(
    selection.nodes["tree.root.children.4.children.1"].insert_after(LexicalNode(type="code"))
)
