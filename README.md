Startup

```bash
# For other (global)
python -m grpc_tools.protoc --python_out=. --grpc_python_out=. --pyi_out=. -I . hub.proto

# For ywpi package
python -m grpc_tools.protoc --python_out=. --grpc_python_out=. --pyi_out=. -I . ywpi/hub.proto
```



ywpi-hub
----

Service has not any state, only runtime. For each changes it is simply send event in RQ.


```bash
python -m hub.main

python -m ywpi.main
```



# Support various types of drives

Declare its own `DriveHub` class.



# Features
- REST API interface for develop
- gRPC interface for production

