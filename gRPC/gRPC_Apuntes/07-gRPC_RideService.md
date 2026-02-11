# 07 gRPC - RideService

- Nos quedan tres casos de uso
  - Comenzar el viaje
  - A medida que se desarrolla el viaje enviar información del viaje
  - Terminar el viaje
- RideService se conecta al Dockservice y al BikeService
- A futuro podemos pensar en un componente IoT que esté instalado en las biciletas que transmita y se comunique con estos servicios, ofreciendo o consumiendo los servicios gRPC
- Creado todo el scafolding, los scripts, el cliente de prisma y los archivos de codigo fuente basado en los .proto, creo las carpetas persistence, service, etc
- Creo src/persistence/RidePeristence.ts
- Importo Prisma de @prisma/client y la conexión que cree con la DB de /utils/prisma
- Para **createRide** creo el input seteando el km a 0, conectando el id de la bike y el id del dock de origen
- Retorno el .create pasándole en la data el input
- Para el **getRideById** uso .findFirst.
- En la cláusula where le paso el id y en include quiero bike, originDock y targetDock en true para obtenerlos
- Devuelvo el ride
- Para el **updateRide** creo la data con el ride y lo casteo a Prisma.RideUpdateInput
- Si hay un targetDock conecto el id, si no pongo el disconnect en true
- Utilizo _prisma.ride.update donde el where tiene el id, le paso la data y en include tengo el bike, originDock y targetDock en true
- Retorno el updateRide

~~~js
import { Prisma } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { Ride } from "../proto/DriveYourCity/Ride";

export interface IRidePersistence {
    createRide(ride: Ride): Promise<Ride>;
    getAllRides(): Promise<Ride[]>
    getRideById(id:number): Promise<Ride | undefined>
    updateRide(id: number, ride: Ride): Promise<Ride | undefined>
}

export class CockroachDBRidePersistence implements IRidePersistence {

    private _prisma;

    constructor() {
        this._prisma = prisma; //de utils/prisma
    }

    async createRide(ride: Ride): Promise<Ride> {
        
        const input: Prisma.RideCreateInput = {            
            km: 0,
            bike: {
                connect: { id: ride.bike?.id! }
            },             
            originDock: {
                connect: { id: ride.originDock!.id! } //conecto el dock de origen con el id del nuevo viaje
            }
        };       
        return this._prisma.ride.create({ data: input });
        
    }
    getAllRides(): Promise<Ride[]> {
        return this._prisma.ride.findMany()
    }

    async getRideById(id: number): Promise<Ride | undefined> {
        const ride = await this._prisma.ride.findFirst({
            where: {
                id,
            },
            include: {
                bike: true,
                originDock: true,
                targetDock: true,
            }
        });
        return ride as Ride;
    }

    async updateRide(id: number, ride: Ride): Promise<Ride | undefined> {
        const data: Prisma.RideUpdateInput = ride as Prisma.RideUpdateInput; //creo el objeto de datos a actualizar
        //para actualizar el targetDock, en caso de que no sea nulo lo conecto a la llave foránea que me están enviando como dock de destino
        //en el caso de que no exista anulo cualquier tipo de conexión
        data.targetDock = ride.targetDock ? { connect: { id: ride.targetDock.id }} : { disconnect: true };
        
        let updatedRide = await this._prisma.ride.update({
            where: { id },
            data,
            include: {
                bike: true,
                originDock: true,
                targetDock: true,
            }
        });
    
        
        return updatedRide;
    }

}
~~~

- La conexión a la DB de /utiuls/prisma es tal que así

~~~js
import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma = global.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

async function connectDB() {
  try {
    await prisma.$connect();
    console.log('? Database connected successfully');
  } catch (error) {
    console.log(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

export default connectDB;
~~~

- También en /utils tengo el mismo archivo de errores custom que creé en los otros microservicios importando Status de grpc-js
- /utils/gRPC.ts

~~~js
import { Status } from "@grpc/grpc-js/build/src/constants";

export const NotFoundError = (entity: string, id: number) => ({ code: Status.NOT_FOUND, message: `${entity} with id ${id} not found` });
export const InvalidArgumentError = (args: string[]) => ({ code: Status.INVALID_ARGUMENT, message: `${args.join(', ')} missing arguments.` });
export const InternalError = (message: string) => ({ code: Status.INTERNAL, message });
~~~

- Necesito construir los clientes para comunciar ride con bikes y docks
- Creo en src/services/DockClient.ts (reutilizo el archivo escrito anteriormente) y BikeClient.ts
- DockClient.ts

~~~js
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
~~~

- Del BikeClient necesito el getBikeById, el attach Bike y unattachBike
- Creo el objeto de BikeClient y construyo los métodos
- Para resolver esta tarea asíncrona uso una promesa empleando resolve, reject
- Llamo al servicio y le paso el bikeId, en el callback tengo el error y la response
- Si hay response uso el resolve y devuelvo el response.bike como Bike
- Si no uso reject y devuelvo el error
- El BikeClient.ts

~~~js
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

        //si compruebo en el archivo .proto que necesito para el attach es el bikeId, el dockId y el totalKms
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
~~~

- RideService.ts
- RideService imlementa RideServiceHandlers desde IRideService
- Al ser métodos async devuelven una promesa
- Creo la instancia de CockroachDBRidePersistence

~~~js
import { ServerDuplexStream, ServerUnaryCall, ServerWritableStream, sendUnaryData } from "@grpc/grpc-js";
import { IRideServiceHandlers } from "../proto/DriveYourCity/IRideService";
import { CockroachDBRidePersistence } from "../persitence/RidePersistence";
import { EndRideRequest__Output } from "../proto/DriveYourCity/EndRideRequest";
import { EndRideResponse } from "../proto/DriveYourCity/EndRideResponse";
import { RideResponse } from "../proto/DriveYourCity/RideResponse";
import { StartRideRequest__Output } from "../proto/DriveYourCity/StartRideRequest";
import { UpdateRideRequest, UpdateRideRequest__Output } from "../proto/DriveYourCity/UpdateRideRequest";
import { bikeClient } from "./BikeClient";
import { Ride } from "../proto/DriveYourCity/Ride";
import { dockClient } from "./DockClient";
import { InternalError, InvalidArgumentError, NotFoundError } from "../utils/gRPC";

const ridePersistence = new CockroachDBRidePersistence();

class RideService implements IRideServiceHandlers {
    [name: string]: import("@grpc/grpc-js").UntypedHandleCall;

    async StartRide(call: ServerUnaryCall<StartRideRequest__Output, RideResponse>, callback: sendUnaryData<RideResponse>): Promise<void> {
        try {
            
            const bikeId = call.request.bikeId;   
            console.log('StartRide', { bikeId });         
            if(bikeId) {
                let bike = await bikeClient.getBikeById(bikeId);  //si tengo el bikeId obtengo la bike                   
                const ride: Ride = {          //creo el objeto de ride
                    bike,          
                    originDock: bike.dock
                }                 
                await bikeClient.unAttachBikeFromDock(bikeId); //con el cliente de bike desviculo la bici del dock
                const newRide = await ridePersistence.createRide(ride); // creo el ride en la DB   
                callback(null, { ride: newRide }); //devuelvo en el callback el error en null y el newRide
            }
            callback(InvalidArgumentError(['bikeId']), { ride: undefined }); //si no hay bikeId devuelvo el custom error
        } catch (err) {            
            callback(InternalError(err as string), { ride: undefined }); //en el catch capturo el error no manejado
        }
    }

    async UpdateRide(call: ServerDuplexStream<UpdateRideRequest__Output, RideResponse>): Promise<void> {
        //al ser un streaming dispongo del método .on donde tengo la data y end
        call.on('data', async (request: UpdateRideRequest) => {//el callback de la request de tipo UpdateRideRequest es async pq consultaré la DB
            const newKms = request.newKms!; //extraigo la data de la request
            const rideId = request.rideId!;

            console.log('UpdateRide', { rideId, newKms });
            const ride = await ridePersistence.getRideById(rideId); //obtengo el ride por el id
            if (ride) {                                   //si tengo el ride actualizo pasándole el id del ride y la suma de los nuevos kms
                const updatedRide = await ridePersistence.updateRide(rideId, { km: ride.km! + newKms }); 
                call.write({ride: updatedRide}); //uso .write para escribir por el streaming
            } else {
                call.end(); //si no hay ride cierro la conexión
            }            
        });

        call.on('end', () => {
            call.end(); //me aseguro de cerrar la conexión cuando no hay más data
        });
    }

    async EndRide(call: ServerWritableStream<EndRideRequest__Output, EndRideResponse>): Promise<void> {
        try {
            const rideId = call.request.rideId; //extraigo la data de la request
            const targetDockId = call.request.dockId;
            console.log('EndRide', { rideId, targetDockId });
            if(rideId && targetDockId) { 
                const ride = await ridePersistence.getRideById(rideId); //obtengo el ride por el id                                
                if(ride && ride.originDock && ride.targetDock === null) { // si tengo el ride y el originDock, pero el targetDock es null es que el viaje puede terminar busco un dock disponible
                    const isDockAvailable = await dockClient.isDockAvailable(targetDockId);            
                    if(isDockAvailable) {                                           
                        const updatedRide = await ridePersistence.updateRide(rideId, { targetDock: { id: targetDockId } }); // si hay un dock disponible actualizo el id del targetDock y le asigno el targetDock al bike                                                                 
                        const updatedBike = await bikeClient.attachBikeToDock(ride.bike?.id!, updatedRide?.targetDock?.id!, ride.km!);

                        //creo el objeto que quiero transmitir por streaming
                        const informData = [
                            `ride with id: ${updatedRide?.id} finished`,
                            `origin dock = ${updatedRide?.originDock?.id}`,
                            `target dock = ${updatedRide?.targetDock?.id}`,                            
                            `Total Kms = ${updatedRide?.km}`,
                            `bike with id ${updatedBike.id} and new total Kms ${updatedBike?.totalKm}`,
                        ]

                        informData.forEach(info => call.write({info})); // al ser streaming escribo la data con .write
                        call.end(); //cierro la conexión
                    }
                    //en streaming no dispongo del callback, dispongo de .emit para emitir un error 
                    call.emit('error', new Error(`dock with id ${ride.originDock.id} is not available for handle more bikes.`));

                } else {
                    call.emit('error', new Error(`ride with id ${rideId} is not available to end.`));                    
                }
            }
        } catch (err) {            
            call.emit('error', err); //capturo un posible error no manejado                               
        }        
    }
}

export {
    RideService
}
~~~

- Creo el server.ts en la raiz de ride-service

~~~js
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
~~~

- En el archivo .env coloco el string de conexión

~~~
DATABASE_URL="postgresql://root@localhost:26000/driveyourcity?sslmode=disable"
~~~

- Debo levantar todos los servers corriendo Docker de fondo para poder probar la funcionalidad de ride ( y las otras) con POSTMAN
----

## Conclusiones

- Vale la pena tomar el tiempo para diseñar y construir con proto para luego pasar a la implementación
- gRPC nos permite comunicarnos de una forma rápida y económica entre servicios
- Una vez hecho el scaffolding la implementación es bastante rápida
- Cuando presentes un proyecto así, en lugar de comentarlo por funcionalidad cuenta una historia que haga que cobre sentido todo el trabajo
- gRPC se adapata de una manera muy elegante, escalable, util, sencilla para construir software eficiente