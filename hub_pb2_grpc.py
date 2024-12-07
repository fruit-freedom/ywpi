# Generated by the gRPC Python protocol compiler plugin. DO NOT EDIT!
"""Client and server classes corresponding to protobuf-defined services."""
import grpc
import warnings

import hub_pb2 as hub__pb2

GRPC_GENERATED_VERSION = '1.64.0'
GRPC_VERSION = grpc.__version__
EXPECTED_ERROR_RELEASE = '1.65.0'
SCHEDULED_RELEASE_DATE = 'June 25, 2024'
_version_not_supported = False

try:
    from grpc._utilities import first_version_is_lower
    _version_not_supported = first_version_is_lower(GRPC_VERSION, GRPC_GENERATED_VERSION)
except ImportError:
    _version_not_supported = True

if _version_not_supported:
    warnings.warn(
        f'The grpc package installed is at version {GRPC_VERSION},'
        + f' but the generated code in hub_pb2_grpc.py depends on'
        + f' grpcio>={GRPC_GENERATED_VERSION}.'
        + f' Please upgrade your grpc module to grpcio>={GRPC_GENERATED_VERSION}'
        + f' or downgrade your generated code using grpcio-tools<={GRPC_VERSION}.'
        + f' This warning will become an error in {EXPECTED_ERROR_RELEASE},'
        + f' scheduled for release on {SCHEDULED_RELEASE_DATE}.',
        RuntimeWarning
    )


class HubStub(object):
    """Missing associated documentation comment in .proto file."""

    def __init__(self, channel):
        """Constructor.

        Args:
            channel: A grpc.Channel.
        """
        self.Connect = channel.stream_stream(
                '/Hub/Connect',
                request_serializer=hub__pb2.Message.SerializeToString,
                response_deserializer=hub__pb2.Message.FromString,
                _registered_method=True)
        self.PushTask = channel.unary_unary(
                '/Hub/PushTask',
                request_serializer=hub__pb2.PushTaskRequest.SerializeToString,
                response_deserializer=hub__pb2.PushTaskResponse.FromString,
                _registered_method=True)
        self.GetAgentsList = channel.unary_unary(
                '/Hub/GetAgentsList',
                request_serializer=hub__pb2.GetAgentsListRequest.SerializeToString,
                response_deserializer=hub__pb2.GetAgentsListResponse.FromString,
                _registered_method=True)


class HubServicer(object):
    """Missing associated documentation comment in .proto file."""

    def Connect(self, request_iterator, context):
        """Missing associated documentation comment in .proto file."""
        context.set_code(grpc.StatusCode.UNIMPLEMENTED)
        context.set_details('Method not implemented!')
        raise NotImplementedError('Method not implemented!')

    def PushTask(self, request, context):
        """Missing associated documentation comment in .proto file."""
        context.set_code(grpc.StatusCode.UNIMPLEMENTED)
        context.set_details('Method not implemented!')
        raise NotImplementedError('Method not implemented!')

    def GetAgentsList(self, request, context):
        """Missing associated documentation comment in .proto file."""
        context.set_code(grpc.StatusCode.UNIMPLEMENTED)
        context.set_details('Method not implemented!')
        raise NotImplementedError('Method not implemented!')


def add_HubServicer_to_server(servicer, server):
    rpc_method_handlers = {
            'Connect': grpc.stream_stream_rpc_method_handler(
                    servicer.Connect,
                    request_deserializer=hub__pb2.Message.FromString,
                    response_serializer=hub__pb2.Message.SerializeToString,
            ),
            'PushTask': grpc.unary_unary_rpc_method_handler(
                    servicer.PushTask,
                    request_deserializer=hub__pb2.PushTaskRequest.FromString,
                    response_serializer=hub__pb2.PushTaskResponse.SerializeToString,
            ),
            'GetAgentsList': grpc.unary_unary_rpc_method_handler(
                    servicer.GetAgentsList,
                    request_deserializer=hub__pb2.GetAgentsListRequest.FromString,
                    response_serializer=hub__pb2.GetAgentsListResponse.SerializeToString,
            ),
    }
    generic_handler = grpc.method_handlers_generic_handler(
            'Hub', rpc_method_handlers)
    server.add_generic_rpc_handlers((generic_handler,))
    server.add_registered_method_handlers('Hub', rpc_method_handlers)


 # This class is part of an EXPERIMENTAL API.
class Hub(object):
    """Missing associated documentation comment in .proto file."""

    @staticmethod
    def Connect(request_iterator,
            target,
            options=(),
            channel_credentials=None,
            call_credentials=None,
            insecure=False,
            compression=None,
            wait_for_ready=None,
            timeout=None,
            metadata=None):
        return grpc.experimental.stream_stream(
            request_iterator,
            target,
            '/Hub/Connect',
            hub__pb2.Message.SerializeToString,
            hub__pb2.Message.FromString,
            options,
            channel_credentials,
            insecure,
            call_credentials,
            compression,
            wait_for_ready,
            timeout,
            metadata,
            _registered_method=True)

    @staticmethod
    def PushTask(request,
            target,
            options=(),
            channel_credentials=None,
            call_credentials=None,
            insecure=False,
            compression=None,
            wait_for_ready=None,
            timeout=None,
            metadata=None):
        return grpc.experimental.unary_unary(
            request,
            target,
            '/Hub/PushTask',
            hub__pb2.PushTaskRequest.SerializeToString,
            hub__pb2.PushTaskResponse.FromString,
            options,
            channel_credentials,
            insecure,
            call_credentials,
            compression,
            wait_for_ready,
            timeout,
            metadata,
            _registered_method=True)

    @staticmethod
    def GetAgentsList(request,
            target,
            options=(),
            channel_credentials=None,
            call_credentials=None,
            insecure=False,
            compression=None,
            wait_for_ready=None,
            timeout=None,
            metadata=None):
        return grpc.experimental.unary_unary(
            request,
            target,
            '/Hub/GetAgentsList',
            hub__pb2.GetAgentsListRequest.SerializeToString,
            hub__pb2.GetAgentsListResponse.FromString,
            options,
            channel_credentials,
            insecure,
            call_credentials,
            compression,
            wait_for_ready,
            timeout,
            metadata,
            _registered_method=True)
