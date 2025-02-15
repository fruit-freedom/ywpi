import os

STORAGE_DIRECTORY = os.getenv('STORAGE_DIRECTORY', 'storage')
USE_RABBITMQ_EVENTS = bool(int(os.getenv('USE_RABBITMQ_EVENTS', 1)))

RQ_EXCHANGE_NAME        = 'ywpi.events'
RQ_USER                 = os.getenv('RQ_USER', 'admin')
RQ_PASSWORD             = os.getenv('RQ_PASSWORD', 'admin')
RQ_HOST                 = os.getenv('RQ_HOST', 'localhost')
RQ_PORT                 = os.getenv('RQ_PORT', '5672')
RQ_CONNECTION_STRING    = os.getenv('RQ_CONNECTION_STRING', f'amqp://{RQ_USER}:{RQ_PASSWORD}@{RQ_HOST}:{RQ_PORT}/')

DB_HOST      = os.getenv('DB_HOST', 'localhost')
DB_PORT      = os.getenv('DB_PORT', 5432)
DB_USER      = os.getenv('DB_USER', 'postgres')
DB_PASSWORD  = os.getenv('DB_PASSWORD', 'postgres')
DB_NAME      = os.getenv('DB_NAME', 'logsy')
DATABASE_URL = f'postgresql+asyncpg://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}'

SQLITE_DB_PATH = os.getenv('SQLITE_DB_PATH', 'sqlite.db')

USE_SQLITE_BACKEND = bool(int(os.getenv('USE_SQLITE_BACKEND', 0)))
if USE_SQLITE_BACKEND:
    DATABASE_URL = f'sqlite+aiosqlite:///{SQLITE_DB_PATH}'

PREPROCESSING_SERVICE_HOST = os.getenv('PREPROCESSING_SERVICE_HOST', 'localhost')
PREPROCESSING_SERVICE_PORT = int(os.getenv('PREPROCESSING_SERVICE_PORT', 50051))
PREPROCESSING_GRPC_CONNECTION_STRING = f'{PREPROCESSING_SERVICE_HOST}:{PREPROCESSING_SERVICE_PORT}'

PUBLIC_PATH = os.getenv('PUBLIC_PATH', '/logsy-server')
