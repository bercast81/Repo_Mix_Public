import path from 'path'
import * as grpc from '@grpc/grpc-js'
import * as protoLoader from '@grpc/proto-loader'
import { ProtoGrpcType } from '../proto/Dock';

const PORT = 9081;
const DOCK_PROTO_FILE = './../../../proto/Dock.proto';

const dockPackageDef = protoLoader.loadSync(path.resolve(__dirname, DOCK_PROTO_FILE));
const dockGrpcObj = (grpc.loadPackageDefinition(dockPackageDef) as unknown) as ProtoGrpcType;

const channelCredentials = grpc.credentials.createInsecure();
const dockServiceClient = new dockGrpcObj.DriveYourCity.IDockService(`0.0.0.0:${PORT}`, channelCredentials)   

const dockClient = {
    isDockAvailable: async (dockId: number): Promise<boolean> => {
        return new Promise((resolve, reject) => {
            dockServiceClient.IsDockAvailable({dockId}, (err, response) => {
                if(response) {
                    resolve(response.isAvalable as boolean);     
                }
                reject(err);
            });
        }) 
    }
}

export {
    dockClient
}