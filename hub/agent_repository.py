import dataclasses










class AbstractChannel:
    async def __aiter__(self): pass
    async def __anext__(self): pass
    async def write_message(self): pass

class AbstractStreamReader: pass

# Write then Read
# Client
class AbstractAgent:
    async def on_message(self): pass
    async def start_task(self): pass
    async def abort_task(self): pass

# Read then Write
# Server
class AbstractHub:
    async def on_message(self): pass
    async def update_task(self): pass
    async def register_agent(self): pass



@dataclasses.dataclass
class AgentDescription:
    pass


class AgentRepository:
    def __init__(self) -> None:
        self.agents: dict[str, AgentDescription] = {}

    def get_agent(self):
        pass

    def add_agent(self, ):
        pass

    def remove_agent(self):
        pass




