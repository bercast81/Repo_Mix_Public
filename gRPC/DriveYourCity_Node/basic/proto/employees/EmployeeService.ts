// Original file: proto/employees.proto

import type * as grpc from '@grpc/grpc-js'
import type { MethodDefinition } from '@grpc/proto-loader'
import type { AddPhotoRequest as _employees_AddPhotoRequest, AddPhotoRequest__Output as _employees_AddPhotoRequest__Output } from '../employees/AddPhotoRequest';
import type { AddPhotoResponse as _employees_AddPhotoResponse, AddPhotoResponse__Output as _employees_AddPhotoResponse__Output } from '../employees/AddPhotoResponse';
import type { EmployeeRequest as _employees_EmployeeRequest, EmployeeRequest__Output as _employees_EmployeeRequest__Output } from '../employees/EmployeeRequest';
import type { EmployeeResponse as _employees_EmployeeResponse, EmployeeResponse__Output as _employees_EmployeeResponse__Output } from '../employees/EmployeeResponse';
import type { GetAllRequest as _employees_GetAllRequest, GetAllRequest__Output as _employees_GetAllRequest__Output } from '../employees/GetAllRequest';
import type { GetByBadgeNumberRequest as _employees_GetByBadgeNumberRequest, GetByBadgeNumberRequest__Output as _employees_GetByBadgeNumberRequest__Output } from '../employees/GetByBadgeNumberRequest';

export interface EmployeeServiceClient extends grpc.Client {
  AddPhoto(metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_employees_AddPhotoResponse__Output>): grpc.ClientWritableStream<_employees_AddPhotoRequest>;
  AddPhoto(metadata: grpc.Metadata, callback: grpc.requestCallback<_employees_AddPhotoResponse__Output>): grpc.ClientWritableStream<_employees_AddPhotoRequest>;
  AddPhoto(options: grpc.CallOptions, callback: grpc.requestCallback<_employees_AddPhotoResponse__Output>): grpc.ClientWritableStream<_employees_AddPhotoRequest>;
  AddPhoto(callback: grpc.requestCallback<_employees_AddPhotoResponse__Output>): grpc.ClientWritableStream<_employees_AddPhotoRequest>;
  addPhoto(metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_employees_AddPhotoResponse__Output>): grpc.ClientWritableStream<_employees_AddPhotoRequest>;
  addPhoto(metadata: grpc.Metadata, callback: grpc.requestCallback<_employees_AddPhotoResponse__Output>): grpc.ClientWritableStream<_employees_AddPhotoRequest>;
  addPhoto(options: grpc.CallOptions, callback: grpc.requestCallback<_employees_AddPhotoResponse__Output>): grpc.ClientWritableStream<_employees_AddPhotoRequest>;
  addPhoto(callback: grpc.requestCallback<_employees_AddPhotoResponse__Output>): grpc.ClientWritableStream<_employees_AddPhotoRequest>;
  
  GetAll(argument: _employees_GetAllRequest, metadata: grpc.Metadata, options?: grpc.CallOptions): grpc.ClientReadableStream<_employees_EmployeeResponse__Output>;
  GetAll(argument: _employees_GetAllRequest, options?: grpc.CallOptions): grpc.ClientReadableStream<_employees_EmployeeResponse__Output>;
  getAll(argument: _employees_GetAllRequest, metadata: grpc.Metadata, options?: grpc.CallOptions): grpc.ClientReadableStream<_employees_EmployeeResponse__Output>;
  getAll(argument: _employees_GetAllRequest, options?: grpc.CallOptions): grpc.ClientReadableStream<_employees_EmployeeResponse__Output>;
  
  GetByBadgeNumber(argument: _employees_GetByBadgeNumberRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_employees_EmployeeResponse__Output>): grpc.ClientUnaryCall;
  GetByBadgeNumber(argument: _employees_GetByBadgeNumberRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_employees_EmployeeResponse__Output>): grpc.ClientUnaryCall;
  GetByBadgeNumber(argument: _employees_GetByBadgeNumberRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_employees_EmployeeResponse__Output>): grpc.ClientUnaryCall;
  GetByBadgeNumber(argument: _employees_GetByBadgeNumberRequest, callback: grpc.requestCallback<_employees_EmployeeResponse__Output>): grpc.ClientUnaryCall;
  getByBadgeNumber(argument: _employees_GetByBadgeNumberRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_employees_EmployeeResponse__Output>): grpc.ClientUnaryCall;
  getByBadgeNumber(argument: _employees_GetByBadgeNumberRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_employees_EmployeeResponse__Output>): grpc.ClientUnaryCall;
  getByBadgeNumber(argument: _employees_GetByBadgeNumberRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_employees_EmployeeResponse__Output>): grpc.ClientUnaryCall;
  getByBadgeNumber(argument: _employees_GetByBadgeNumberRequest, callback: grpc.requestCallback<_employees_EmployeeResponse__Output>): grpc.ClientUnaryCall;
  
  Save(argument: _employees_EmployeeRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_employees_EmployeeResponse__Output>): grpc.ClientUnaryCall;
  Save(argument: _employees_EmployeeRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_employees_EmployeeResponse__Output>): grpc.ClientUnaryCall;
  Save(argument: _employees_EmployeeRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_employees_EmployeeResponse__Output>): grpc.ClientUnaryCall;
  Save(argument: _employees_EmployeeRequest, callback: grpc.requestCallback<_employees_EmployeeResponse__Output>): grpc.ClientUnaryCall;
  save(argument: _employees_EmployeeRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_employees_EmployeeResponse__Output>): grpc.ClientUnaryCall;
  save(argument: _employees_EmployeeRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_employees_EmployeeResponse__Output>): grpc.ClientUnaryCall;
  save(argument: _employees_EmployeeRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_employees_EmployeeResponse__Output>): grpc.ClientUnaryCall;
  save(argument: _employees_EmployeeRequest, callback: grpc.requestCallback<_employees_EmployeeResponse__Output>): grpc.ClientUnaryCall;
  
  SaveAll(metadata: grpc.Metadata, options?: grpc.CallOptions): grpc.ClientDuplexStream<_employees_EmployeeRequest, _employees_EmployeeResponse__Output>;
  SaveAll(options?: grpc.CallOptions): grpc.ClientDuplexStream<_employees_EmployeeRequest, _employees_EmployeeResponse__Output>;
  saveAll(metadata: grpc.Metadata, options?: grpc.CallOptions): grpc.ClientDuplexStream<_employees_EmployeeRequest, _employees_EmployeeResponse__Output>;
  saveAll(options?: grpc.CallOptions): grpc.ClientDuplexStream<_employees_EmployeeRequest, _employees_EmployeeResponse__Output>;
  
}

export interface EmployeeServiceHandlers extends grpc.UntypedServiceImplementation {
  AddPhoto: grpc.handleClientStreamingCall<_employees_AddPhotoRequest__Output, _employees_AddPhotoResponse>;
  
  GetAll: grpc.handleServerStreamingCall<_employees_GetAllRequest__Output, _employees_EmployeeResponse>;
  
  GetByBadgeNumber: grpc.handleUnaryCall<_employees_GetByBadgeNumberRequest__Output, _employees_EmployeeResponse>;
  
  Save: grpc.handleUnaryCall<_employees_EmployeeRequest__Output, _employees_EmployeeResponse>;
  
  SaveAll: grpc.handleBidiStreamingCall<_employees_EmployeeRequest__Output, _employees_EmployeeResponse>;
  
}

export interface EmployeeServiceDefinition extends grpc.ServiceDefinition {
  AddPhoto: MethodDefinition<_employees_AddPhotoRequest, _employees_AddPhotoResponse, _employees_AddPhotoRequest__Output, _employees_AddPhotoResponse__Output>
  GetAll: MethodDefinition<_employees_GetAllRequest, _employees_EmployeeResponse, _employees_GetAllRequest__Output, _employees_EmployeeResponse__Output>
  GetByBadgeNumber: MethodDefinition<_employees_GetByBadgeNumberRequest, _employees_EmployeeResponse, _employees_GetByBadgeNumberRequest__Output, _employees_EmployeeResponse__Output>
  Save: MethodDefinition<_employees_EmployeeRequest, _employees_EmployeeResponse, _employees_EmployeeRequest__Output, _employees_EmployeeResponse__Output>
  SaveAll: MethodDefinition<_employees_EmployeeRequest, _employees_EmployeeResponse, _employees_EmployeeRequest__Output, _employees_EmployeeResponse__Output>
}
