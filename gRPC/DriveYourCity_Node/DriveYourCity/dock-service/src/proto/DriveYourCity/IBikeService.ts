// Original file: ../proto/Bike.proto

import type * as grpc from '@grpc/grpc-js'
import type { MethodDefinition } from '@grpc/proto-loader'
import type { AttachBikeToDockRequest as _DriveYourCity_AttachBikeToDockRequest, AttachBikeToDockRequest__Output as _DriveYourCity_AttachBikeToDockRequest__Output } from '../DriveYourCity/AttachBikeToDockRequest';
import type { BikeRequest as _DriveYourCity_BikeRequest, BikeRequest__Output as _DriveYourCity_BikeRequest__Output } from '../DriveYourCity/BikeRequest';
import type { BikeResponse as _DriveYourCity_BikeResponse, BikeResponse__Output as _DriveYourCity_BikeResponse__Output } from '../DriveYourCity/BikeResponse';
import type { GetBikeByIdRequest as _DriveYourCity_GetBikeByIdRequest, GetBikeByIdRequest__Output as _DriveYourCity_GetBikeByIdRequest__Output } from '../DriveYourCity/GetBikeByIdRequest';

export interface IBikeServiceClient extends grpc.Client {
  AttachBikeToDock(argument: _DriveYourCity_AttachBikeToDockRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_DriveYourCity_BikeResponse__Output>): grpc.ClientUnaryCall;
  AttachBikeToDock(argument: _DriveYourCity_AttachBikeToDockRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_DriveYourCity_BikeResponse__Output>): grpc.ClientUnaryCall;
  AttachBikeToDock(argument: _DriveYourCity_AttachBikeToDockRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_DriveYourCity_BikeResponse__Output>): grpc.ClientUnaryCall;
  AttachBikeToDock(argument: _DriveYourCity_AttachBikeToDockRequest, callback: grpc.requestCallback<_DriveYourCity_BikeResponse__Output>): grpc.ClientUnaryCall;
  attachBikeToDock(argument: _DriveYourCity_AttachBikeToDockRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_DriveYourCity_BikeResponse__Output>): grpc.ClientUnaryCall;
  attachBikeToDock(argument: _DriveYourCity_AttachBikeToDockRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_DriveYourCity_BikeResponse__Output>): grpc.ClientUnaryCall;
  attachBikeToDock(argument: _DriveYourCity_AttachBikeToDockRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_DriveYourCity_BikeResponse__Output>): grpc.ClientUnaryCall;
  attachBikeToDock(argument: _DriveYourCity_AttachBikeToDockRequest, callback: grpc.requestCallback<_DriveYourCity_BikeResponse__Output>): grpc.ClientUnaryCall;
  
  CreateBike(argument: _DriveYourCity_BikeRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_DriveYourCity_BikeResponse__Output>): grpc.ClientUnaryCall;
  CreateBike(argument: _DriveYourCity_BikeRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_DriveYourCity_BikeResponse__Output>): grpc.ClientUnaryCall;
  CreateBike(argument: _DriveYourCity_BikeRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_DriveYourCity_BikeResponse__Output>): grpc.ClientUnaryCall;
  CreateBike(argument: _DriveYourCity_BikeRequest, callback: grpc.requestCallback<_DriveYourCity_BikeResponse__Output>): grpc.ClientUnaryCall;
  createBike(argument: _DriveYourCity_BikeRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_DriveYourCity_BikeResponse__Output>): grpc.ClientUnaryCall;
  createBike(argument: _DriveYourCity_BikeRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_DriveYourCity_BikeResponse__Output>): grpc.ClientUnaryCall;
  createBike(argument: _DriveYourCity_BikeRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_DriveYourCity_BikeResponse__Output>): grpc.ClientUnaryCall;
  createBike(argument: _DriveYourCity_BikeRequest, callback: grpc.requestCallback<_DriveYourCity_BikeResponse__Output>): grpc.ClientUnaryCall;
  
  GetBikeById(argument: _DriveYourCity_GetBikeByIdRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_DriveYourCity_BikeResponse__Output>): grpc.ClientUnaryCall;
  GetBikeById(argument: _DriveYourCity_GetBikeByIdRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_DriveYourCity_BikeResponse__Output>): grpc.ClientUnaryCall;
  GetBikeById(argument: _DriveYourCity_GetBikeByIdRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_DriveYourCity_BikeResponse__Output>): grpc.ClientUnaryCall;
  GetBikeById(argument: _DriveYourCity_GetBikeByIdRequest, callback: grpc.requestCallback<_DriveYourCity_BikeResponse__Output>): grpc.ClientUnaryCall;
  getBikeById(argument: _DriveYourCity_GetBikeByIdRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_DriveYourCity_BikeResponse__Output>): grpc.ClientUnaryCall;
  getBikeById(argument: _DriveYourCity_GetBikeByIdRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_DriveYourCity_BikeResponse__Output>): grpc.ClientUnaryCall;
  getBikeById(argument: _DriveYourCity_GetBikeByIdRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_DriveYourCity_BikeResponse__Output>): grpc.ClientUnaryCall;
  getBikeById(argument: _DriveYourCity_GetBikeByIdRequest, callback: grpc.requestCallback<_DriveYourCity_BikeResponse__Output>): grpc.ClientUnaryCall;
  
}

export interface IBikeServiceHandlers extends grpc.UntypedServiceImplementation {
  AttachBikeToDock: grpc.handleUnaryCall<_DriveYourCity_AttachBikeToDockRequest__Output, _DriveYourCity_BikeResponse>;
  
  CreateBike: grpc.handleUnaryCall<_DriveYourCity_BikeRequest__Output, _DriveYourCity_BikeResponse>;
  
  GetBikeById: grpc.handleUnaryCall<_DriveYourCity_GetBikeByIdRequest__Output, _DriveYourCity_BikeResponse>;
  
}

export interface IBikeServiceDefinition extends grpc.ServiceDefinition {
  AttachBikeToDock: MethodDefinition<_DriveYourCity_AttachBikeToDockRequest, _DriveYourCity_BikeResponse, _DriveYourCity_AttachBikeToDockRequest__Output, _DriveYourCity_BikeResponse__Output>
  CreateBike: MethodDefinition<_DriveYourCity_BikeRequest, _DriveYourCity_BikeResponse, _DriveYourCity_BikeRequest__Output, _DriveYourCity_BikeResponse__Output>
  GetBikeById: MethodDefinition<_DriveYourCity_GetBikeByIdRequest, _DriveYourCity_BikeResponse, _DriveYourCity_GetBikeByIdRequest__Output, _DriveYourCity_BikeResponse__Output>
}
