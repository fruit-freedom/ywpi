FROM python:3.12-slim AS build

COPY src/ywpi_hub src/ywpi_hub
COPY pyproject.toml pyproject.toml

RUN pip install . aio_pika

FROM python:3.12-slim

COPY --from=build /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=build /usr/local/bin /usr/local/bin

ENTRYPOINT ["python", "-m", "ywpi_hub"]
