import os

USE_RABBITMQ_EVENTS = bool(int(os.getenv('USE_RABBITMQ_EVENTS', 0)))
RQ_EXCHANGE_NAME        = 'ywpi.events'
RQ_USER                 = os.getenv('RQ_USER', 'admin')
RQ_PASSWORD             = os.getenv('RQ_PASSWORD', 'admin')
RQ_HOST                 = os.getenv('RQ_HOST', 'localhost')
RQ_PORT                 = os.getenv('RQ_PORT', '5672')
RQ_CONNECTION_STRING    = os.getenv('RQ_CONNECTION_STRING', f'amqp://{RQ_USER}:{RQ_PASSWORD}@{RQ_HOST}:{RQ_PORT}/')


# gRPC settings
YWPI_GRPC_MAX_MESSAGE_SIZE = int(os.getenv('YWPI_GRPC_MAX_MESSAGE_SIZE', 1024 * 1024 * 1024)) # Default 1G

YWPI_GRPC_KEEPALIVE_TIME_MS = int(os.getenv('YWPI_GRPC_KEEPALIVE_TIME_MS', 1_260_000)) # As server default 21 min (one min more than client)
YWPI_GRPC_KEEPALIVE_TIMEOUT_MS = int(os.getenv('YWPI_GRPC_KEEPALIVE_TIMEOUT_MS', 21_000)) # As server default 21 sec (one sec more than client)
