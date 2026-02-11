import { ServerUnaryCall, ServerWritableStream, sendUnaryData } from "@grpc/grpc-js";
import { IDockServiceHandlers } from "../proto/DriveYourCity/IDockService";
import { DockResponse } from "../proto/DriveYourCity/DockResponse";
import { GetAllDocks__Output } from "../proto/DriveYourCity/GetAllDocks";
import { GetDockByIdRequest__Output } from "../proto/DriveYourCity/GetDockByIdRequest";;
import { CreateDockRequest__Output } from "../proto/DriveYourCity/CreateDockRequest";
import { IsDockAvailableRequest__Output } from "../proto/DriveYourCity/IsDockAvailableRequest";
import { IsDockAvailableResponse } from "../proto/DriveYourCity/IsDockAvailableResponse";
import { CockroachDBDockPersistence } from "../persitence/DockPersistence";
import { InternalError, InvalidArgumentError, NotFoundError } from "../utils/gRPC";

const dockPersistence = new CockroachDBDockPersistence();

class DockService implements IDockServiceHandlers {
    [name: string]: import("@grpc/grpc-js").UntypedHandleCall;

    async CreateDock (call: ServerUnaryCall<CreateDockRequest__Output, DockResponse>, callback: sendUnaryData<DockResponse>): Promise<void> {        
        try {
            const dock = call.request.dock;
            console.log('CreateDock', { dock });
            if (dock) {                
                const newDock = await dockPersistence.createDock(dock);
                callback(null, { dock: newDock });
            }
        } catch (err) {
            callback(InternalError(err as string), { dock: undefined });
        }        
    }

    async GetAllDocks (call: ServerWritableStream<GetAllDocks__Output, DockResponse>): Promise<void> {
        console.log('GetAllDocks');
        const docks = await dockPersistence.getAllDocks();
        docks.forEach(dock => call.write({ dock }));
        call.end();     
    }

    async GetDockById (call: ServerUnaryCall<GetDockByIdRequest__Output, DockResponse>, callback: sendUnaryData<DockResponse>): Promise<void> {
        try {
            const dockId = call.request.dockId;
            console.log('GetDockById', { dockId });
            if (dockId) {            
                const dock = await dockPersistence.getDockById(dockId);
                const error = dock ? null : NotFoundError('dock', dockId);
                callback(error, { dock });
            }
            callback(InvalidArgumentError(['dockId']), { dock: undefined });
        } catch (err) {
            callback(InternalError(err as string), { dock: undefined });
        }        
    }

    async IsDockAvailable(call: ServerUnaryCall<IsDockAvailableRequest__Output, IsDockAvailableResponse>, callback: sendUnaryData<IsDockAvailableResponse>): Promise<void> {
        try {
            const dockId = call.request.dockId;
            console.log('IsDockAvailable', { dockId });
            if (dockId) {                        
                callback(null, { isAvalable: await dockPersistence.isDockAvailable(dockId) });
            }
            callback(InvalidArgumentError(['dockId']), { isAvalable: false });
        } catch (err) {
            callback(InternalError(err as string), { isAvalable: false });
        }         
    }
}

export {
    DockService
}