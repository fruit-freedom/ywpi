import motor.motor_asyncio

client = motor.motor_asyncio.AsyncIOMotorClient('mongodb://mongo:mongo@localhost:27017/')
mongodb = client['ywpi']

agents_collection = mongodb['agents']
tasks_collection = mongodb['tasks']

projects_collection = mongodb['projects']
boards_collection = mongodb['boards']
objects_collection = mongodb['objects']
contexts_collection = mongodb['contexts']
nodes_collection = mongodb['nodes']
edges_collection = mongodb['edges']

execution_managers_collection = mongodb['execution_managers']
