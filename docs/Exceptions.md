Errors
----


### Custom exceptions / errors

If you want to use your own exceptions types and propogate additional `payload` throught it you can implement two classes:

```python
# Pydantic model that store serialization schema
class AlgorithmErrorModel(pydantic.BaseModel):
    description: str # User custom types


# Custom exception
class AlgorithmError(BaseException):
    description: str # User custom types

    # `serialization_model` field declare pydantic model that will be used for serializing
    serialization_model: AlgorithmErrorModel

    def __init__(self, description: str):
        self.description = description
```

After raising exception this will be serialized and transfer to client as `MethodExecutionError` with custom `data` attribute.

> Ywpi will use `from_attributes=True` flag during exception validation.


### Description

#### Error handling

gRPC methods:
`RunTask` - return error in response
`PushTask` - publish error in event store

Python API
`ywpi.execute_method` - raise errors (`MethodExecutionError`, `MethodCallError` and etc)
`ywpi_hub.execute_method` - raise errors (method internal or ywpi communications)


#### Exception
```txt
---- MethodCallError
- Finding agent and methods
- RPC connection with agent
- Validating inputs
- Internal ywpi errors

---- MethodExecutionError
- Running user defined func

---- MethodCallError
- Validate outputs
- RPC call for updating task
- Internal ywpi errors


------------------------------------------------------------
| MethodExecutionError                                     |
|                                                          |
|                                                          |
|  -----------------------------------------------         |
|  | CustomException                             |         |
|  |                                             |         |
|  |                                             |         |
|  | serialization_model: pydantic.BaseModel     |         |
|  -----------------------------------------------         |    
|                                                          |
------------------------------------------------------------
```
