import type * as grpc from '@grpc/grpc-js';
import type { MessageTypeDefinition } from '@grpc/proto-loader';

import type { IDockServiceClient as _DriveYourCity_IDockServiceClient, IDockServiceDefinition as _DriveYourCity_IDockServiceDefinition } from './DriveYourCity/IDockService';

type SubtypeConstructor<Constructor extends new (...args: any) => any, Subtype> = {
  new(...args: ConstructorParameters<Constructor>): Subtype;
};

export interface ProtoGrpcType {
  DriveYourCity: {
    Bike: MessageTypeDefinition
    CreateDockRequest: MessageTypeDefinition
    Dock: MessageTypeDefinition
    DockResponse: MessageTypeDefinition
    GetAllDocks: MessageTypeDefinition
    GetDockByIdRequest: MessageTypeDefinition
    IDockService: SubtypeConstructor<typeof grpc.Client, _DriveYourCity_IDockServiceClient> & { service: _DriveYourCity_IDockServiceDefinition }
    IsDockAvailableRequest: MessageTypeDefinition
    IsDockAvailableResponse: MessageTypeDefinition
    Ride: MessageTypeDefinition
  }
}

