









class AgentsRepository:
    async def start_task(self, agent_id: str, method_name: str, inputs: dict) -> dict:
        """
        Start task and return after task completition.

        Return task outputs.
        """
        ...

    async def start_task_async(self, agent_id: str, method_name: str, inputs: dict) -> str:
        """
        Start task and return immediately.

        Return task ID.
        """
        ...

    def snapshot(self):
        """
        Take repository snapshot for listing agents.
        Snapshot required because agents repository can be frequently updated.
        """
        pass

    def _register_add_agent(self):
        pass





class HubApp:
    def on_agent_event():
        pass

    def on_task_event():
        pass


app = HubApp()



@app.on_agent_event
async def on_agent_connected(repo: AgentsRepository):
    pass


@app.on_task_event
async def on_agent_connected():
    pass


