.PHONY: sync_hub_models
sync_hub_models:
	cp packages/ywpi_hub/src/ywpi_hub/hub_models.py packages/ywpi/src/ywpi/hub_models.py
	sed -i '1i\# Copied from hub/hub_models.py DO NOT EDIT!\n' packages/ywpi/src/ywpi/hub_models.py

	cp packages/ywpi_hub/src/ywpi_hub/hub_models.py server/app/hub_models.py
	sed -i '1i\# Copied from hub/hub_models.py DO NOT EDIT!\n' server/app/hub_models.py


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
		server/app


.PHONY: run_server
run_server:
	python -m server.main


.PHONY: run_hub
run_hub:
	python -m ywpi_hub	


.PHONY: run_web
run_web:
	cd web && npx vite --port 3001


.PHONY: open-web
open-web:
	google-chrome http://localhost:3001
