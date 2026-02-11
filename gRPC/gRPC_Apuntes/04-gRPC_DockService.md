# 04 gRPC - Dock Service

- Dock es el dispositivo al que las bicis llegan y de las que son tomadas para realizar los viajes
- Esate servicio se va a conectar al balanceador de carga que le va a dar acceso a la DB que está dividida en 3 instancias
- En Dock.proto creamos los 4 servicios que usaremos
  - Crear un dock
  - Obtener todos los docks
  - Obtener un dock por id
  - Saber si el dock está disponible
- Vamos a hacer el scaffolding del proyecto
- Es algo que vamos a tener que hacer con cada uno de los microservicios
- Creo el directorio de dock-service
- Uso yarn init
- Instalo las dependencias de node

> npm i @grpc/grpc-js @grpc/proto-loader @prisma/client
> npm i --save-dev @types/google-protobuf grpc_tools_node_protoc_ts prisma ts-node typescript

- Creamos los scriptsç

~~~json
 "scripts": {
    "db:gen": "sh scripts/prisma-gen.sh", //generar la DB 
    "proto:gen": "sh scripts/proto-gen.sh", //generar los archivos de ts con las definiciones declaradas en proto   
    "start:server": "ts-node server.ts" //ejecutar el servidor
  }
~~~

- Creo la carpeta scripts
- Para crear el script para prisma creo prisma-gen.sh

~~~sh
# copio el schema 
cp -f ./../database/prisma/schema.prisma ./../dock-service/schema.prisma 
# genero el documento de node
npx prisma generate --schema ./schema.prisma
# remnuevo el documento para no generar basura
rm ./../dock-service/schema.prisma
~~~

- Creo proto-gen.sh

~~~sh
#!/bin/bash

PROTO_DIR=./../../proto  

# usamos la librería proto-loader para a travgés de la librería grpc generar todos los archivos que contengan .proto
yarn proto-loader-gen-types --grpcLib=@grpc/grpc-js --outDir=src/proto/ ./../proto/*.proto
~~~

- En node_modules/@prisma/client puedo ver todos los archivos ts y js generados
- Ahora ejecutamos **yarn run proto:gen**
- Esto genera todos los archivos con el código fuente dentro de la carpeta proto/DriveYourCity y los archivos Bike, Dock, Entities
- Creo .env con la URL de la DB (postgres, ya que cockroachDB usa postgres por debajo)

~~~
DATABASE_URL="postgresql://root@localhost:26000/driveyourcity?sslmode=disable"
~~~

- Crearemos src/persistence dónde almacenaremos toda la persistencia
- Creo src/services, donde crearemos la implementación de los servicios de grpc y otros servicios de apoyo que vamos a necesitar
- Creo la carpeta src/utils con código de utilidad
- Creo el server.ts en la raíz
- De momento lo hacemos inseguro

~~~js
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
~~~ 

- Dentro de la carpeta utils creo el archivoi prisma.ts para la conexión
- Es un código genérico que se conecta a la instancia definidaq en la variable de entorno

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

- En utils creo también gRPC.ts para definir errores personalizados
- Para ello importo Status que es lo que nos ofrece la librería de grpc
- Si clico encima con ctrl puedo ver el archivo de definiciones constants.d.ts con todos los status disponibles

~~~js
export declare enum Status {
    OK = 0,
    CANCELLED = 1,
    UNKNOWN = 2,
    INVALID_ARGUMENT = 3,
    DEADLINE_EXCEEDED = 4,
    NOT_FOUND = 5,
    ALREADY_EXISTS = 6,
    PERMISSION_DENIED = 7,
    RESOURCE_EXHAUSTED = 8,
    FAILED_PRECONDITION = 9,
    ABORTED = 10,
    OUT_OF_RANGE = 11,
    UNIMPLEMENTED = 12,
    INTERNAL = 13,
    UNAVAILABLE = 14,
    DATA_LOSS = 15,
    UNAUTHENTICATED = 16
}
export declare enum LogVerbosity {
    DEBUG = 0,
    INFO = 1,
    ERROR = 2,
    NONE = 3
}
/**
 * NOTE: This enum is not currently used in any implemented API in this
 * library. It is included only for type parity with the other implementation.
 */
export declare enum Propagate {
    DEADLINE = 1,
    CENSUS_STATS_CONTEXT = 2,
    CENSUS_TRACING_CONTEXT = 4,
    CANCELLATION = 8,
    DEFAULTS = 65535
}
export declare const DEFAULT_MAX_SEND_MESSAGE_LENGTH = -1;
export declare const DEFAULT_MAX_RECEIVE_MESSAGE_LENGTH: number;
~~~

- Uso los que necesito en utils/gRPC.ts

~~~js
import { Status } from "@grpc/grpc-js/build/src/constants";

export const NotFoundError = (entity: string, id: number) => ({ code: Status.NOT_FOUND, message: `${entity} with id ${id} not found` });
//cuando nos invocan una función pero los argumentos no son insufcientes muestro este error
export const InvalidArgumentError = (args: string[]) => ({ code: Status.INVALID_ARGUMENT, message: `${args.join(', ')} missing arguments.` });
//error desconocido o no controlado
export const InternalError = (message: string) => ({ code: Status.INTERNAL, message });
~~~

- Este es el scaffolding completo del proyecto
- Creo en src/persistence/DockPersistence.ts
- Creamos la interfaz de acceso a datos a la entidad
- Creamos la clase implementando la interfaz. Le digo al IDE que me cree los métodos rápidamente
- Para obtener el cliente de prisma creo un atributo privado _prisma
- Importo (la conexión) prisma de utils, la paso por el constructor 
- DockCreateInput es un componente generado ese componente nativamente al doiminio por Prisma desde el esquema (importo Prisma de @prisma/client)
- Uso async await porque voy a interactuar con la DB, por lo que el método devuelve una promesa
- Para obtener un dock por id, uso where para indicar que el id que le mando por parámetro es el id que busco y tambiénn quiero obtener las bicicletas de ese dock, por lo que uso includes
- Para saber si un dock está disponible o no uso $queryRaw para ejecutar syntaxis de SQL con un valor de is_avaliable: false por defecto
  - Selecciono la selección del número de bicis desde Bike y dock dónde el "Dock".id == "Bike"."dockId"
  - Este número debe de ser inferior al número máximo de bicis que el dock puede recibir, donde "Dock".id es el id pasado como parámetro
  - Si la respuesta devuelve algo (con .length), tomo el primer resultado que está disponible y retorno la variable bboleana is_avaliable
  - Si no devolvemos faLso indicando que el dock no puede recibir más bicicletas 


~~~js
import { prisma } from "./../utils/prisma";
import { Prisma } from "@prisma/client";
import { Dock } from "../proto/DriveYourCity/Dock";

export interface IDockPersistence {
    createDock(dock: Dock): Promise<Dock>;
    getAllDocks(): Promise<Dock[]>;
    getDockById(id:number): Promise<Dock | undefined>;
    isDockAvailable(id: number): Promise<boolean>;
}

export class CockroachDBDockPersistence implements IDockPersistence {

    private _prisma;

    constructor() {
        this._prisma = prisma;
    }    

    async createDock(dock: Dock): Promise<Dock> {
        const input = dock as Prisma.DockCreateInput;
        const newDock = await this._prisma.dock.create({ data: input });
        return newDock;        
    }
    async getAllDocks(): Promise<Dock[]> {
        return this._prisma.dock.findMany();        
    }
    async getDockById(id: number): Promise<Dock | undefined> {
        const dock = await this._prisma.dock.findFirst({
            where: {
              id,
            },
            include: {
                bikes: true,
            }
          });
        return dock as Dock;
    }
    async isDockAvailable(id: number): Promise<boolean> {                
        const result = await prisma.$queryRaw<{is_available: false}[]>`
            SELECT (SELECT COUNT(*) as numBikes
                    FROM "Bike",
                        "Dock"
                    WHERE "Dock".id = "Bike"."dockId"
                    AND "Dock".id = ${id}) < "maxBikes" as is_available
            FROM "Dock"
            WHERE "Dock".id = ${id};
        `;        
        if(result.length) {
            return result[0].is_available;
        }
        return false;
    }
}
~~~

- Para trabajar el servicio voy a src/service/DockService.ts
- Creo una nueva instancia de CockRoachDBDockPersistence
- La clase DockService implementa la interfaz IDockServiceHandlers
  - Esta interfaz está ubicada en dock-service/src/proto/DriveYourCity/IDockService con todos los métodos declarados en .proto a implementar
- Para **crear el dock** obtengo el body con call.request, extraigo el dock
- Usaré try catch
- Hago la validación: si hay dock usop el método create de dockPersistence (CockRoachDBPersistence)
- Devuelvo en el callback el primer parámetro (error) en null y de segundo el dock 
- Si hay un error lo capturo con el catch y uso en el primer argumento del callback uno de mis errores custom y como segundo parámetro le paso el dock como undefined
- Para **obtener todos los docks** uso el método de dockPersistence
- Con un forEach uso call.write para abrir la conexión por streaming y pasarle uno a uno todos los docks
- Cierro la conexión con call.end
- Para **obtener el dock por id** extraigo el dockId del body de la request con call.request.dockId
- Hago la validación y la inserción
- Si la inserción no va bien, Capturo el error con un ternario y lo guardo en una variable y lo devuelvo en el callback junto al dock
- Si no hay error su valor será null
- Si no hay dockId es que los argumentos paqsados son erróneos, por lo que lanzo mi error custom correswpondiente
- En el catch capto un posible error no manejado 
- Para saber si **el dock está disponible** extraigo el id de la request con call.request.dockId
- Hago la validación, si hay dockId uso la DB para obtener la respuesta. Devuelvo en el callback el error como null, y la respuesta de la consulta
- Si no hay dockId es que no se pasó cómo argumento, lanzomi error custom
- En el catch capturo un posible error no manejado
- Exporto DockService!

~~~js
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
~~~

- Ahora solo queda hacer las pruebas con POSTMAN (ya creamos el servidor anteriormente)
- Para probar el microservicio incializamos docker-compose en la raíz de DriveYourCity

> docker compose -f docker-compose.yml up -d --build

- Para sincronizar el schema con la instancia de la DB usaré el script db:push

~~~json
 "db:push": "npx prisma db push --schema ./prisma/schema.prisma"
~~~
