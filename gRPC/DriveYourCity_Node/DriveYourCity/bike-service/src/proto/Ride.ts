import type * as grpc from '@grpc/grpc-js';
import type { MessageTypeDefinition } from '@grpc/proto-loader';

import type { IRideServiceClient as _DriveYourCity_IRideServiceClient, IRideServiceDefinition as _DriveYourCity_IRideServiceDefinition } from './DriveYourCity/IRideService';

type SubtypeConstructor<Constructor extends new (...args: any) => any, Subtype> = {
  new(...args: ConstructorParameters<Constructor>): Subtype;
};

export interface ProtoGrpcType {
  DriveYourCity: {
    Bike: MessageTypeDefinition
    Dock: MessageTypeDefinition
    EndRideRequest: MessageTypeDefinition
    EndRideResponse: MessageTypeDefinition
    IRideService: SubtypeConstructor<typeof grpc.Client, _DriveYourCity_IRideServiceClient> & { service: _DriveYourCity_IRideServiceDefinition }
    Ride: MessageTypeDefinition
    RideResponse: MessageTypeDefinition
    StartRideRequest: MessageTypeDefinition
    UpdateRideRequest: MessageTypeDefinition
  }
}

