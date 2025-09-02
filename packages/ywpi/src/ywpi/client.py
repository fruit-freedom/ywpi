from ywpi.hub_pb2_grpc import HubStub




class Method:
    def call(self, *args, **params):
        if len(args):
            raise RuntimeError('call method can not recieve positional arguments')

    def to_langchain_tool(self):
        return None


class Client:
    def __init__(self, host):
        pass

    def get_method(self) -> Method:
        pass

    def get_methods(
        self,
        tag: list[str] | str = None,
        agent_class: list[str] | str = None,
        agent_id: list[str] | str = None,
    ) -> list[Method]:
        pass

    def call_method(self):
        pass


client = Client()
tools = [ m.to_langchain_tool() for m in client.get_methods(agent_class='MyWorker') ]

