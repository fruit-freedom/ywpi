# Export variables from .env file
ifneq (,$(wildcard ./.env))
	include .env
	export
endif


.PHONY: sync_hub_models
sync_hub_models:
	cp packages/ywpi_hub/src/ywpi_hub/hub_models.py packages/ywpi/src/ywpi/hub_models.py
	sed -i '1i\# Copied from packages/ywpi_hub/src/ywpi_hub/hub_models.py DO NOT EDIT!\n' packages/ywpi/src/ywpi/hub_models.py

	cp packages/ywpi_hub/src/ywpi_hub/hub_models.py packages/server/src/server/hub_models.py
	sed -i '1i\# Copied from packages/ywpi_hub/src/ywpi_hub/hub_models.py DO NOT EDIT!\n' packages/server/src/server/hub_models.py


.PHONY: sync_hub_proto
sync_hub_proto:
	python -m grpc_tools.protoc \
		--python_out=packages/ywpi_hub/src/ywpi_hub \
		--grpc_python_out=packages/ywpi_hub/src/ywpi_hub \
		--pyi_out=packages/ywpi_hub/src/ywpi_hub \
		-I packages/ywpi_hub/src/ywpi_hub hub.proto
	python fixup_generated_files.py

	cp \
		packages/ywpi_hub/src/ywpi_hub/hub_pb2.py \
		packages/ywpi_hub/src/ywpi_hub/hub_pb2.pyi \
		packages/ywpi_hub/src/ywpi_hub/hub_pb2_grpc.py \
		packages/ywpi/src/ywpi

	cp \
		packages/ywpi_hub/src/ywpi_hub/hub_pb2.py \
		packages/ywpi_hub/src/ywpi_hub/hub_pb2.pyi \
		packages/ywpi_hub/src/ywpi_hub/hub_pb2_grpc.py \
		packages/server/src/server


.PHONY: run_server
run_server:
	python -m server.main


.PHONY: run_hub
run_hub:
	USE_RABBITMQ_EVENTS=1 python -m ywpi_hub	


.PHONY: run_web
run_web:
	cd web && npx vite --port 3001


.PHONY: open-web
open-web:
	google-chrome http://localhost:3001


.PHONY: build_ywpi
build_ywpi:
	uv build --package ywpi


.PHONY: build_ywpi_hub
build_ywpi_hub:
	uv build --package ywpi_hub


.PHONY: publish
publish:
	uv publish --token $(UV_PUBLISH_TOKEN)

