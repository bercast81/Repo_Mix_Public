// @ts-ignore
import path from 'path'
import * as grpc from '@grpc/grpc-js'
import * as protoLoader from '@grpc/proto-loader'
import { ProtoGrpcType } from './src/proto/Bike';
import { BikeService } from './src/service/BikeService';

const PORT = 9082;
const BIKE_PROTO_FILE = './../proto/Bike.proto';

const bikePackageDef = protoLoader.loadSync(path.resolve(__dirname, BIKE_PROTO_FILE));
const bikeGrpcObj = (grpc.loadPackageDefinition(bikePackageDef) as unknown) as ProtoGrpcType;

function main() {
    const server = getServer();    
    const serverCredentials = grpc.ServerCredentials.createInsecure();

    server.bindAsync(`0.0.0.0:${PORT}`, serverCredentials,
        (err, port) => {
            if (err) {
                console.error(err)
                return
            }
            console.log(`ride server as started on port ${port}`)
            server.start()
        })
}

function getServer() {
    const server = new grpc.Server();

    server.addService(bikeGrpcObj.DriveYourCity.IBikeService.service, new BikeService())

    return server
}

main()
