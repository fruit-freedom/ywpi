.PHONY: sync_hub_models
sync_hub_models:
	cp hub/hub_models.py ywpi/hub_models.py
	sed -i '1i\# Copied from hub/hub_models.py DO NOT EDIT!\n' ywpi/hub_models.py

	cp hub/hub_models.py server/hub_models.py
	sed -i '1i\# Copied from hub/hub_models.py DO NOT EDIT!\n' server/hub_models.py


.PHONY: sync_hub_proto
sync_hub_proto:
	python -m grpc_tools.protoc --python_out=. --grpc_python_out=. --pyi_out=. -I . hub/hub.proto

	cp hub/hub.proto ywpi/hub.proto && \
		python -m grpc_tools.protoc --python_out=. --grpc_python_out=. --pyi_out=. -I . ywpi/hub.proto && \
		rm ywpi/hub.proto

	cp hub/hub.proto server/hub.proto && \
		python -m grpc_tools.protoc --python_out=. --grpc_python_out=. --pyi_out=. -I . server/hub.proto && \
		rm server/hub.proto
