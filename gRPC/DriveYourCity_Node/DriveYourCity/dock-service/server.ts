// @ts-ignore
import path from 'path'
import * as grpc from '@grpc/grpc-js'
import * as protoLoader from '@grpc/proto-loader'
import { ProtoGrpcType } from './src/proto/Dock';
import { DockService } from './src/service/DockService';

const PORT = 9081;
const DOCK_PROTO_FILE = './../proto/Dock.proto';

const dockPackageDef = protoLoader.loadSync(path.resolve(__dirname, DOCK_PROTO_FILE));
const dockGrpcObj = (grpc.loadPackageDefinition(dockPackageDef) as unknown) as ProtoGrpcType;

function main() {
    const server = getServer();    
    const serverCredentials = grpc.ServerCredentials.createInsecure();

    server.bindAsync(`0.0.0.0:${PORT}`, serverCredentials,
        (err, port) => {
            if (err) {
                console.error(err)
                return
            }
            console.log(`dock server as started on port ${port}`)
            server.start()
        })
}

function getServer() {
    const server = new grpc.Server();

    server.addService(dockGrpcObj.DriveYourCity.IDockService.service, new DockService())

    return server
}

main()
