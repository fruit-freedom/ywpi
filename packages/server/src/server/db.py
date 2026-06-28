import motor.motor_asyncio
from server import settings


client = motor.motor_asyncio.AsyncIOMotorClient(settings.MONGO_CONNECTION_STRING)
mongodb = client['ywpi']

agents_collection = mongodb['agents']
tasks_collection = mongodb['tasks']

projects_collection = mongodb['projects']
boards_collection = mongodb['boards']
objects_collection = mongodb['objects']
contexts_collection = mongodb['contexts']
nodes_collection = mongodb['nodes']
edges_collection = mongodb['edges']
workflows_collection = mongodb['workflows']

execution_managers_collection = mongodb['execution_managers']
