FROM python:3.12-slim AS build

COPY src/server src/server
COPY pyproject.toml pyproject.toml

RUN pip install .

FROM python:3.12-slim

COPY --from=build /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=build /usr/local/bin /usr/local/bin
COPY docker/docker-entrypoint.sh /usr/local/bin

ENV PYTHONUNBUFFERED=1

ENTRYPOINT ["docker-entrypoint.sh"]
