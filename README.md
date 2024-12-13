Startup

```bash
# For server
python -m grpc_tools.protoc --python_out=. --grpc_python_out=. --pyi_out=. -I . server/hub.proto

# For hub
python -m grpc_tools.protoc --python_out=. --grpc_python_out=. --pyi_out=. -I . hub/hub.proto


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



# Yields

```python
# Yield value with specific key
yield 'key_name', value

# Yield value in __others__ list
yield value

# Yield multiple keys
yield ywpi.Outputs({
    'key_1': value_1,
    'key_2': value_2
})

# Yield full outputs
yield InheritedFromDataclass
```


