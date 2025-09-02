FROM python:3.10-slim AS build

COPY hub/requirements.txt .

RUN pip install -r requirements.txt

FROM python:3.10-slim

WORKDIR /app

COPY --from=build /usr/local/lib/python3.10/site-packages /usr/local/lib/python3.10/site-packages
COPY --from=build /usr/local/bin /usr/local/bin

COPY hub hub

ENTRYPOINT ["python", "-m", "hub"]
