import motor.motor_asyncio

client = motor.motor_asyncio.AsyncIOMotorClient('mongodb://mongo:mongo@localhost:27017/')
mongodb = client['ywpi']

agents_collection = mongodb['agents']
tasks_collection = mongodb['tasks']

