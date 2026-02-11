// @ts-ignore
import path from 'path'
import * as grpc from '@grpc/grpc-js'
import * as protoLoader from '@grpc/proto-loader'
import { ProtoGrpcType } from './src/proto/Ride';
import { RideService } from './src/service/RideService';

const PORT = 9083;
const RIDE_PROTO_FILE = './../proto/Ride.proto';

const ridePackageDef = protoLoader.loadSync(path.resolve(__dirname, RIDE_PROTO_FILE));
const rideGrpcObj = (grpc.loadPackageDefinition(ridePackageDef) as unknown) as ProtoGrpcType;

function main() {
    const server = getServer();
    //const serverCredentials = SSLService.getServerCredentials();
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

    server.addService(rideGrpcObj.DriveYourCity.IRideService.service, new RideService())

    return server
}

main()
