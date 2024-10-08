import logging

FORMATTER = logging.Formatter("[%(asctime)s] %(levelname)s %(message)s")

logger = logging.getLogger('app')
logger.setLevel(logging.DEBUG)

console_handler = logging.StreamHandler()
logger.addHandler(console_handler)
console_handler.setFormatter(FORMATTER)
