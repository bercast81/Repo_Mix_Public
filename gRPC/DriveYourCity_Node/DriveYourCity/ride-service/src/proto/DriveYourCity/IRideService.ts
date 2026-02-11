// Original file: ../proto/Ride.proto

import type * as grpc from '@grpc/grpc-js'
import type { MethodDefinition } from '@grpc/proto-loader'
import type { EndRideRequest as _DriveYourCity_EndRideRequest, EndRideRequest__Output as _DriveYourCity_EndRideRequest__Output } from '../DriveYourCity/EndRideRequest';
import type { EndRideResponse as _DriveYourCity_EndRideResponse, EndRideResponse__Output as _DriveYourCity_EndRideResponse__Output } from '../DriveYourCity/EndRideResponse';
import type { RideResponse as _DriveYourCity_RideResponse, RideResponse__Output as _DriveYourCity_RideResponse__Output } from '../DriveYourCity/RideResponse';
import type { StartRideRequest as _DriveYourCity_StartRideRequest, StartRideRequest__Output as _DriveYourCity_StartRideRequest__Output } from '../DriveYourCity/StartRideRequest';
import type { UpdateRideRequest as _DriveYourCity_UpdateRideRequest, UpdateRideRequest__Output as _DriveYourCity_UpdateRideRequest__Output } from '../DriveYourCity/UpdateRideRequest';

export interface IRideServiceClient extends grpc.Client {
  EndRide(argument: _DriveYourCity_EndRideRequest, metadata: grpc.Metadata, options?: grpc.CallOptions): grpc.ClientReadableStream<_DriveYourCity_EndRideResponse__Output>;
  EndRide(argument: _DriveYourCity_EndRideRequest, options?: grpc.CallOptions): grpc.ClientReadableStream<_DriveYourCity_EndRideResponse__Output>;
  endRide(argument: _DriveYourCity_EndRideRequest, metadata: grpc.Metadata, options?: grpc.CallOptions): grpc.ClientReadableStream<_DriveYourCity_EndRideResponse__Output>;
  endRide(argument: _DriveYourCity_EndRideRequest, options?: grpc.CallOptions): grpc.ClientReadableStream<_DriveYourCity_EndRideResponse__Output>;
  
  StartRide(argument: _DriveYourCity_StartRideRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_DriveYourCity_RideResponse__Output>): grpc.ClientUnaryCall;
  StartRide(argument: _DriveYourCity_StartRideRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_DriveYourCity_RideResponse__Output>): grpc.ClientUnaryCall;
  StartRide(argument: _DriveYourCity_StartRideRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_DriveYourCity_RideResponse__Output>): grpc.ClientUnaryCall;
  StartRide(argument: _DriveYourCity_StartRideRequest, callback: grpc.requestCallback<_DriveYourCity_RideResponse__Output>): grpc.ClientUnaryCall;
  startRide(argument: _DriveYourCity_StartRideRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_DriveYourCity_RideResponse__Output>): grpc.ClientUnaryCall;
  startRide(argument: _DriveYourCity_StartRideRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_DriveYourCity_RideResponse__Output>): grpc.ClientUnaryCall;
  startRide(argument: _DriveYourCity_StartRideRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_DriveYourCity_RideResponse__Output>): grpc.ClientUnaryCall;
  startRide(argument: _DriveYourCity_StartRideRequest, callback: grpc.requestCallback<_DriveYourCity_RideResponse__Output>): grpc.ClientUnaryCall;
  
  UpdateRide(metadata: grpc.Metadata, options?: grpc.CallOptions): grpc.ClientDuplexStream<_DriveYourCity_UpdateRideRequest, _DriveYourCity_RideResponse__Output>;
  UpdateRide(options?: grpc.CallOptions): grpc.ClientDuplexStream<_DriveYourCity_UpdateRideRequest, _DriveYourCity_RideResponse__Output>;
  updateRide(metadata: grpc.Metadata, options?: grpc.CallOptions): grpc.ClientDuplexStream<_DriveYourCity_UpdateRideRequest, _DriveYourCity_RideResponse__Output>;
  updateRide(options?: grpc.CallOptions): grpc.ClientDuplexStream<_DriveYourCity_UpdateRideRequest, _DriveYourCity_RideResponse__Output>;
  
}

export interface IRideServiceHandlers extends grpc.UntypedServiceImplementation {
  EndRide: grpc.handleServerStreamingCall<_DriveYourCity_EndRideRequest__Output, _DriveYourCity_EndRideResponse>;
  
  StartRide: grpc.handleUnaryCall<_DriveYourCity_StartRideRequest__Output, _DriveYourCity_RideResponse>;
  
  UpdateRide: grpc.handleBidiStreamingCall<_DriveYourCity_UpdateRideRequest__Output, _DriveYourCity_RideResponse>;
  
}

export interface IRideServiceDefinition extends grpc.ServiceDefinition {
  EndRide: MethodDefinition<_DriveYourCity_EndRideRequest, _DriveYourCity_EndRideResponse, _DriveYourCity_EndRideRequest__Output, _DriveYourCity_EndRideResponse__Output>
  StartRide: MethodDefinition<_DriveYourCity_StartRideRequest, _DriveYourCity_RideResponse, _DriveYourCity_StartRideRequest__Output, _DriveYourCity_RideResponse__Output>
  UpdateRide: MethodDefinition<_DriveYourCity_UpdateRideRequest, _DriveYourCity_RideResponse, _DriveYourCity_UpdateRideRequest__Output, _DriveYourCity_RideResponse__Output>
}
