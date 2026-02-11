import { Status } from "@grpc/grpc-js/build/src/constants";

export const NotFoundError = (entity: string, id: number) => ({ code: Status.NOT_FOUND, message: `${entity} with id ${id} not found` });
export const InvalidArgumentError = (args: string[]) => ({ code: Status.INVALID_ARGUMENT, message: `${args.join(', ')} missing arguments.` });
export const InternalError = (message: string) => ({ code: Status.INTERNAL, message });