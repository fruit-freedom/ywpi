# -*- coding: utf-8 -*-
# Generated by the protocol buffer compiler.  DO NOT EDIT!
# source: app/hub.proto
# Protobuf Python Version: 5.26.1
"""Generated protocol buffer code."""
from google.protobuf import descriptor as _descriptor
from google.protobuf import descriptor_pool as _descriptor_pool
from google.protobuf import symbol_database as _symbol_database
from google.protobuf.internal import builder as _builder
# @@protoc_insertion_point(imports)

_sym_db = _symbol_database.Default()




DESCRIPTOR = _descriptor_pool.Default().AddSerializedFile(b'\n\rapp/hub.proto\"4\n\x0eRequestMessage\x12\x11\n\x03rpc\x18\x01 \x01(\x0e\x32\x04.Rpc\x12\x0f\n\x07payload\x18\x03 \x01(\t\"Q\n\x0fResponseMessage\x12\x14\n\x07payload\x18\x02 \x01(\tH\x00\x88\x01\x01\x12\x12\n\x05\x65rror\x18\x03 \x01(\tH\x01\x88\x01\x01\x42\n\n\x08_payloadB\x08\n\x06_error\"p\n\x07Message\x12\x10\n\x08reply_to\x18\x01 \x01(\t\x12\"\n\x07request\x18\x02 \x01(\x0b\x32\x0f.RequestMessageH\x00\x12$\n\x08response\x18\x03 \x01(\x0b\x32\x10.ResponseMessageH\x00\x42\t\n\x07message\"T\n\x0fPushTaskRequest\x12\x10\n\x08\x61gent_id\x18\x01 \x01(\t\x12\x0e\n\x06method\x18\x02 \x01(\t\x12\x0e\n\x06params\x18\x03 \x01(\t\x12\x0f\n\x07payload\x18\x04 \x01(\t\"R\n\x10PushTaskResponse\x12\x14\n\x07task_id\x18\x01 \x01(\tH\x00\x88\x01\x01\x12\x12\n\x05\x65rror\x18\x02 \x01(\tH\x01\x88\x01\x01\x42\n\n\x08_task_idB\x08\n\x06_error\"s\n\x0fRunTaskResponse\x12\x14\n\x07task_id\x18\x01 \x01(\tH\x00\x88\x01\x01\x12\x12\n\x05\x65rror\x18\x02 \x01(\tH\x01\x88\x01\x01\x12\x14\n\x07outputs\x18\x03 \x01(\tH\x02\x88\x01\x01\x42\n\n\x08_task_idB\x08\n\x06_errorB\n\n\x08_outputs\"\x16\n\x14GetAgentsListRequest\"#\n\x05Input\x12\x0c\n\x04name\x18\x01 \x01(\t\x12\x0c\n\x04type\x18\x02 \x01(\t\".\n\x06Method\x12\x0c\n\x04name\x18\x01 \x01(\t\x12\x16\n\x06inputs\x18\x02 \x03(\x0b\x32\x06.Input\";\n\x05\x41gent\x12\n\n\x02id\x18\x01 \x01(\t\x12\x0c\n\x04name\x18\x02 \x01(\t\x12\x18\n\x07methods\x18\x03 \x03(\x0b\x32\x07.Method\"/\n\x15GetAgentsListResponse\x12\x16\n\x06\x61gents\x18\x01 \x03(\x0b\x32\x06.Agent*\x86\x01\n\x03Rpc\x12\x11\n\rRPC_UNDEFINED\x10\x00\x12\x16\n\x12RPC_REGISTER_AGENT\x10\x01\x12\x17\n\x13RPC_HEARTBEAT_AGENT\x10\x02\x12\x12\n\x0eRPC_START_TASK\x10\x03\x12\x12\n\x0eRPC_ABORT_TASK\x10\x04\x12\x13\n\x0fRPC_UPDATE_TASK\x10\x05\x32\xc8\x01\n\x03Hub\x12!\n\x07\x43onnect\x12\x08.Message\x1a\x08.Message(\x01\x30\x01\x12/\n\x08PushTask\x12\x10.PushTaskRequest\x1a\x11.PushTaskResponse\x12-\n\x07RunTask\x12\x10.PushTaskRequest\x1a\x10.RunTaskResponse\x12>\n\rGetAgentsList\x12\x15.GetAgentsListRequest\x1a\x16.GetAgentsListResponseb\x06proto3')

_globals = globals()
_builder.BuildMessageAndEnumDescriptors(DESCRIPTOR, _globals)
_builder.BuildTopDescriptorsAndMessages(DESCRIPTOR, 'app.hub_pb2', _globals)
if not _descriptor._USE_C_DESCRIPTORS:
  DESCRIPTOR._loaded_options = None
  _globals['_RPC']._serialized_start=775
  _globals['_RPC']._serialized_end=909
  _globals['_REQUESTMESSAGE']._serialized_start=17
  _globals['_REQUESTMESSAGE']._serialized_end=69
  _globals['_RESPONSEMESSAGE']._serialized_start=71
  _globals['_RESPONSEMESSAGE']._serialized_end=152
  _globals['_MESSAGE']._serialized_start=154
  _globals['_MESSAGE']._serialized_end=266
  _globals['_PUSHTASKREQUEST']._serialized_start=268
  _globals['_PUSHTASKREQUEST']._serialized_end=352
  _globals['_PUSHTASKRESPONSE']._serialized_start=354
  _globals['_PUSHTASKRESPONSE']._serialized_end=436
  _globals['_RUNTASKRESPONSE']._serialized_start=438
  _globals['_RUNTASKRESPONSE']._serialized_end=553
  _globals['_GETAGENTSLISTREQUEST']._serialized_start=555
  _globals['_GETAGENTSLISTREQUEST']._serialized_end=577
  _globals['_INPUT']._serialized_start=579
  _globals['_INPUT']._serialized_end=614
  _globals['_METHOD']._serialized_start=616
  _globals['_METHOD']._serialized_end=662
  _globals['_AGENT']._serialized_start=664
  _globals['_AGENT']._serialized_end=723
  _globals['_GETAGENTSLISTRESPONSE']._serialized_start=725
  _globals['_GETAGENTSLISTRESPONSE']._serialized_end=772
  _globals['_HUB']._serialized_start=912
  _globals['_HUB']._serialized_end=1112
# @@protoc_insertion_point(module_scope)
