// Original file: ../proto/Dock.proto

import type * as grpc from '@grpc/grpc-js'
import type { MethodDefinition } from '@grpc/proto-loader'
import type { CreateDockRequest as _DriveYourCity_CreateDockRequest, CreateDockRequest__Output as _DriveYourCity_CreateDockRequest__Output } from '../DriveYourCity/CreateDockRequest';
import type { DockResponse as _DriveYourCity_DockResponse, DockResponse__Output as _DriveYourCity_DockResponse__Output } from '../DriveYourCity/DockResponse';
import type { GetAllDocks as _DriveYourCity_GetAllDocks, GetAllDocks__Output as _DriveYourCity_GetAllDocks__Output } from '../DriveYourCity/GetAllDocks';
import type { GetDockByIdRequest as _DriveYourCity_GetDockByIdRequest, GetDockByIdRequest__Output as _DriveYourCity_GetDockByIdRequest__Output } from '../DriveYourCity/GetDockByIdRequest';
import type { IsDockAvailableRequest as _DriveYourCity_IsDockAvailableRequest, IsDockAvailableRequest__Output as _DriveYourCity_IsDockAvailableRequest__Output } from '../DriveYourCity/IsDockAvailableRequest';
import type { IsDockAvailableResponse as _DriveYourCity_IsDockAvailableResponse, IsDockAvailableResponse__Output as _DriveYourCity_IsDockAvailableResponse__Output } from '../DriveYourCity/IsDockAvailableResponse';

export interface IDockServiceClient extends grpc.Client {
  CreateDock(argument: _DriveYourCity_CreateDockRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_DriveYourCity_DockResponse__Output>): grpc.ClientUnaryCall;
  CreateDock(argument: _DriveYourCity_CreateDockRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_DriveYourCity_DockResponse__Output>): grpc.ClientUnaryCall;
  CreateDock(argument: _DriveYourCity_CreateDockRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_DriveYourCity_DockResponse__Output>): grpc.ClientUnaryCall;
  CreateDock(argument: _DriveYourCity_CreateDockRequest, callback: grpc.requestCallback<_DriveYourCity_DockResponse__Output>): grpc.ClientUnaryCall;
  createDock(argument: _DriveYourCity_CreateDockRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_DriveYourCity_DockResponse__Output>): grpc.ClientUnaryCall;
  createDock(argument: _DriveYourCity_CreateDockRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_DriveYourCity_DockResponse__Output>): grpc.ClientUnaryCall;
  createDock(argument: _DriveYourCity_CreateDockRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_DriveYourCity_DockResponse__Output>): grpc.ClientUnaryCall;
  createDock(argument: _DriveYourCity_CreateDockRequest, callback: grpc.requestCallback<_DriveYourCity_DockResponse__Output>): grpc.ClientUnaryCall;
  
  GetAllDocks(argument: _DriveYourCity_GetAllDocks, metadata: grpc.Metadata, options?: grpc.CallOptions): grpc.ClientReadableStream<_DriveYourCity_DockResponse__Output>;
  GetAllDocks(argument: _DriveYourCity_GetAllDocks, options?: grpc.CallOptions): grpc.ClientReadableStream<_DriveYourCity_DockResponse__Output>;
  getAllDocks(argument: _DriveYourCity_GetAllDocks, metadata: grpc.Metadata, options?: grpc.CallOptions): grpc.ClientReadableStream<_DriveYourCity_DockResponse__Output>;
  getAllDocks(argument: _DriveYourCity_GetAllDocks, options?: grpc.CallOptions): grpc.ClientReadableStream<_DriveYourCity_DockResponse__Output>;
  
  GetDockById(argument: _DriveYourCity_GetDockByIdRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_DriveYourCity_DockResponse__Output>): grpc.ClientUnaryCall;
  GetDockById(argument: _DriveYourCity_GetDockByIdRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_DriveYourCity_DockResponse__Output>): grpc.ClientUnaryCall;
  GetDockById(argument: _DriveYourCity_GetDockByIdRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_DriveYourCity_DockResponse__Output>): grpc.ClientUnaryCall;
  GetDockById(argument: _DriveYourCity_GetDockByIdRequest, callback: grpc.requestCallback<_DriveYourCity_DockResponse__Output>): grpc.ClientUnaryCall;
  getDockById(argument: _DriveYourCity_GetDockByIdRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_DriveYourCity_DockResponse__Output>): grpc.ClientUnaryCall;
  getDockById(argument: _DriveYourCity_GetDockByIdRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_DriveYourCity_DockResponse__Output>): grpc.ClientUnaryCall;
  getDockById(argument: _DriveYourCity_GetDockByIdRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_DriveYourCity_DockResponse__Output>): grpc.ClientUnaryCall;
  getDockById(argument: _DriveYourCity_GetDockByIdRequest, callback: grpc.requestCallback<_DriveYourCity_DockResponse__Output>): grpc.ClientUnaryCall;
  
  IsDockAvailable(argument: _DriveYourCity_IsDockAvailableRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_DriveYourCity_IsDockAvailableResponse__Output>): grpc.ClientUnaryCall;
  IsDockAvailable(argument: _DriveYourCity_IsDockAvailableRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_DriveYourCity_IsDockAvailableResponse__Output>): grpc.ClientUnaryCall;
  IsDockAvailable(argument: _DriveYourCity_IsDockAvailableRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_DriveYourCity_IsDockAvailableResponse__Output>): grpc.ClientUnaryCall;
  IsDockAvailable(argument: _DriveYourCity_IsDockAvailableRequest, callback: grpc.requestCallback<_DriveYourCity_IsDockAvailableResponse__Output>): grpc.ClientUnaryCall;
  isDockAvailable(argument: _DriveYourCity_IsDockAvailableRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_DriveYourCity_IsDockAvailableResponse__Output>): grpc.ClientUnaryCall;
  isDockAvailable(argument: _DriveYourCity_IsDockAvailableRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_DriveYourCity_IsDockAvailableResponse__Output>): grpc.ClientUnaryCall;
  isDockAvailable(argument: _DriveYourCity_IsDockAvailableRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_DriveYourCity_IsDockAvailableResponse__Output>): grpc.ClientUnaryCall;
  isDockAvailable(argument: _DriveYourCity_IsDockAvailableRequest, callback: grpc.requestCallback<_DriveYourCity_IsDockAvailableResponse__Output>): grpc.ClientUnaryCall;
  
}

export interface IDockServiceHandlers extends grpc.UntypedServiceImplementation {
  CreateDock: grpc.handleUnaryCall<_DriveYourCity_CreateDockRequest__Output, _DriveYourCity_DockResponse>;
  
  GetAllDocks: grpc.handleServerStreamingCall<_DriveYourCity_GetAllDocks__Output, _DriveYourCity_DockResponse>;
  
  GetDockById: grpc.handleUnaryCall<_DriveYourCity_GetDockByIdRequest__Output, _DriveYourCity_DockResponse>;
  
  IsDockAvailable: grpc.handleUnaryCall<_DriveYourCity_IsDockAvailableRequest__Output, _DriveYourCity_IsDockAvailableResponse>;
  
}

export interface IDockServiceDefinition extends grpc.ServiceDefinition {
  CreateDock: MethodDefinition<_DriveYourCity_CreateDockRequest, _DriveYourCity_DockResponse, _DriveYourCity_CreateDockRequest__Output, _DriveYourCity_DockResponse__Output>
  GetAllDocks: MethodDefinition<_DriveYourCity_GetAllDocks, _DriveYourCity_DockResponse, _DriveYourCity_GetAllDocks__Output, _DriveYourCity_DockResponse__Output>
  GetDockById: MethodDefinition<_DriveYourCity_GetDockByIdRequest, _DriveYourCity_DockResponse, _DriveYourCity_GetDockByIdRequest__Output, _DriveYourCity_DockResponse__Output>
  IsDockAvailable: MethodDefinition<_DriveYourCity_IsDockAvailableRequest, _DriveYourCity_IsDockAvailableResponse, _DriveYourCity_IsDockAvailableRequest__Output, _DriveYourCity_IsDockAvailableResponse__Output>
}
