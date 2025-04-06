from .tasks_respository import TaskDescription
from .agents_repository import repository

class Stream:
    def __init__(self, task: TaskDescription):
        self.task = task
        self.items = []

    def push_item(self):
        agent = repository.get(self.task.agent_id)






