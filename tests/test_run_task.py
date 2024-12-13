import warnings
warnings.simplefilter("ignore", UserWarning)

import unittest

import json

import hub_pb2
import hub_pb2_grpc
import grpc



class Simple(unittest.TestCase):
    def test_method_simple(self):
        with grpc.insecure_channel('localhost:50051') as channel:
            greeter_stub = hub_pb2_grpc.HubStub(channel)

            method = 'method_no_args'
            params = { }
            agent_id = 'test'

            response: hub_pb2.RunTaskResponse = greeter_stub.RunTask(
                hub_pb2.PushTaskRequest(
                    agent_id=agent_id,
                    method=method,
                    params=json.dumps(params),
                    payload='{}'
                )
            )

            self.assertEqual(json.loads(response.outputs), {
                'test_key': 'test_value'
            })


    def test_method_simple_yields(self):
        with grpc.insecure_channel('localhost:50051') as channel:
            greeter_stub = hub_pb2_grpc.HubStub(channel)

            method = 'method_no_args_yields'
            params = { }
            agent_id = 'test'

            response: hub_pb2.RunTaskResponse = greeter_stub.RunTask(
                hub_pb2.PushTaskRequest(
                    agent_id=agent_id,
                    method=method,
                    params=json.dumps(params),
                    payload='{}'
                )
            )

            self.assertDictEqual(json.loads(response.outputs), {
                'first_key': 'first_value',
                'second_key': 'second_value'
            })


if __name__ == '__main__':
    unittest.main()

