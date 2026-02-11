import type * as grpc from '@grpc/grpc-js';
import type { MessageTypeDefinition } from '@grpc/proto-loader';

import type { IBikeServiceClient as _DriveYourCity_IBikeServiceClient, IBikeServiceDefinition as _DriveYourCity_IBikeServiceDefinition } from './DriveYourCity/IBikeService';

type SubtypeConstructor<Constructor extends new (...args: any) => any, Subtype> = {
  new(...args: ConstructorParameters<Constructor>): Subtype;
};

export interface ProtoGrpcType {
  DriveYourCity: {
    AttachBikeToDockRequest: MessageTypeDefinition
    Bike: MessageTypeDefinition
    BikeRequest: MessageTypeDefinition
    BikeResponse: MessageTypeDefinition
    Dock: MessageTypeDefinition
    GetBikeByIdRequest: MessageTypeDefinition
    IBikeService: SubtypeConstructor<typeof grpc.Client, _DriveYourCity_IBikeServiceClient> & { service: _DriveYourCity_IBikeServiceDefinition }
  }
}

