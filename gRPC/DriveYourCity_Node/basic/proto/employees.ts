import type * as grpc from '@grpc/grpc-js';
import type { MessageTypeDefinition } from '@grpc/proto-loader';

import type { IEmployeeServiceClient as _employees_IEmployeeServiceClient, IEmployeeServiceDefinition as _employees_IEmployeeServiceDefinition } from './employees/IEmployeeService';

type SubtypeConstructor<Constructor extends new (...args: any) => any, Subtype> = {
  new(...args: ConstructorParameters<Constructor>): Subtype;
};

export interface ProtoGrpcType {
  employees: {
    AddPhotoRequest: MessageTypeDefinition
    AddPhotoResponse: MessageTypeDefinition
    Employee: MessageTypeDefinition
    EmployeeRequest: MessageTypeDefinition
    EmployeeResponse: MessageTypeDefinition
    GetAllRequest: MessageTypeDefinition
    GetByBadgeNumberRequest: MessageTypeDefinition
    IEmployeeService: SubtypeConstructor<typeof grpc.Client, _employees_IEmployeeServiceClient> & { service: _employees_IEmployeeServiceDefinition }
  }
}

