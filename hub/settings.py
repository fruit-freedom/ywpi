import os

USE_RABBITMQ_EVENTS = bool(int(os.getenv('USE_RABBITMQ_EVENTS', 1)))
RQ_EXCHANGE_NAME        = 'ywpi.events'
RQ_USER                 = os.getenv('RQ_USER', 'admin')
RQ_PASSWORD             = os.getenv('RQ_PASSWORD', 'admin')
RQ_HOST                 = os.getenv('RQ_HOST', 'localhost')
RQ_PORT                 = os.getenv('RQ_PORT', '5672')
RQ_CONNECTION_STRING    = os.getenv('RQ_CONNECTION_STRING', f'amqp://{RQ_USER}:{RQ_PASSWORD}@{RQ_HOST}:{RQ_PORT}/')
