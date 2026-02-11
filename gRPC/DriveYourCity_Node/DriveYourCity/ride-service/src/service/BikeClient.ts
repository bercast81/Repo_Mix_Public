import path from 'path'
import * as grpc from '@grpc/grpc-js'
import * as protoLoader from '@grpc/proto-loader'
import { ProtoGrpcType } from '../proto/Bike';
import { Bike } from '../proto/DriveYourCity/Bike';

const PORT = 9082;
const BIKE_PROTO_FILE = './../../../proto/Bike.proto';

const bikePackageDef = protoLoader.loadSync(path.resolve(__dirname, BIKE_PROTO_FILE));
const bikeGrpcObj = (grpc.loadPackageDefinition(bikePackageDef) as unknown) as ProtoGrpcType;

const channelCredentials = grpc.credentials.createInsecure();
const bikeServiceClient = new bikeGrpcObj.DriveYourCity.IBikeService(`0.0.0.0:${PORT}`, channelCredentials)   

const bikeClient = {
    getBikeById: async (bikeId: number): Promise<Bike> => {
        return new Promise((resolve, reject) => {
            bikeServiceClient.GetBikeById({bikeId}, (err, response) => {
                if(response) {
                    resolve(response.bike as Bike);     
                }
                reject(err);
            });
        }) 
    },

    unAttachBikeFromDock: async (bikeId: number): Promise<Bike> => {
        return new Promise((resolve, reject) => {
            bikeServiceClient.UnAttachBikeFromDock({bikeId}, (err, response) => {
                if(response) {
                    resolve(response.bike as Bike);     
                }
                reject(err);
            });
        }) 
    },

    attachBikeToDock: async (bikeId: number, dockId: number, totalKms: number): Promise<Bike> => {
        return new Promise((resolve, reject) => {
            bikeServiceClient.AttachBikeToDock({bikeId, dockId, totalKms}, (err, response) => {
                if(response) {
                    resolve(response.bike as Bike);     
                }
                reject(err);
            });
        }) 
    }
}

export {    
    bikeClient
}