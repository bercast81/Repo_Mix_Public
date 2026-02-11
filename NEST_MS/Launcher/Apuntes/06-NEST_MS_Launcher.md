# 06 NEST_MS - Launcher (Docker)

## Docker Network

- Tenemos varias terminales corriendo, tenemos que levantar el NATS...
- Un poco complicado y tedioso
- Crearemos una red que se encargue de comunicarse con mis servidores, y mediante un solo comando levante toda la infraestructura
- Puedo hacer que no se levanten los microservicios si NATS no está arriba
- Lo mismo con la DB
- Crearemos un monorepo
- Nest ofrece una manera un poco acoplada
- Usaremos otra metodología

## docker-compose

- Creo el docker-compose en la carpeta donde tengo orders-ms, products-ms y el gateway
- Debo crear el .env con las variables de entorno
- renombro la carpeta gateway a client-gateway

~~~yml
version: '3'

services:
  nats-server:
    image: nats:latest # descargo la última versión de nats
    ports:
      - "8222:8222" # Expongo el 8222 que es el puerto por defecto para monitorear
                    # Expongo este puerto al exterior entre el cliente y el gateway, no la red interna
                    # No necesito exponerlo
  client-gateway:
    depends_on:
      - nats-server # para que no arranque antes que el nats-server y de problemas de conexión
    build: ./client-gateway # Vendrá a esta ruta a buscar el Dockerfile
    ports:
      - ${CLIENT_GATEWAY_PORT}:3000 # Comunico el puerto del pc con el del contenedor
    volumes:
      - ./client-gateway/src:/usr/src/app/src # Puedo enfocarme solo en el src lo mapeo a usr/src/app/src (node tiene este path)
    command: npm run start:dev
    environment: # definimos las variables de entorno, es como tener mi .env aquí. Las validaciones que hice aplican aqui
      - PORT=3000
      - NATS_SERVERS=nats://nats-server:4222 # ya no uso localhost, uso nats-server
      - PRODUCTS_MICROSERVICE_HOST=products-ms # aqui tampoco uso localhost, uso el nombre del servicio
      - PRODUCTS_MICROSERVICE_PORT=3001
      - ORDERS_MICROSERVICE_HOST=orders-ms
      - ORDERS_MICROSERVICE_PORT=3002

  products-ms:
    depends_on:
      - nats-server
    build: ./products-ms
    volumes:
      - ./products-ms/src:/usr/src/app/src # mapeo el src
    command: npm run start:dev
    environment:
      - PORT=3001
      - NATS_SERVERS=nats://nats-server:4222
      - DATABASE_URL=file:./dev.db #products está en el filesystem porque uso SQLite
  orders-ms:
    depends_on:
      - orders-db # Este microservicio no debe levantarse sin la db (levantarse, no construir)
    build: ./orders-ms
    volumes:
      - ./orders-ms/src:/usr/src/app/src
    command: npm run start:dev
    environment:
      - PORT=3002
      - DATABASE_URL=postgresql://postgres:123456@orders-db:5432/ordersdb?schema=public # no uso localhost!
      - NATS_SERVERS=nats://nats-server:4222 
      - PRODUCTS_MICROSERVICE_HOST=products-ms
      - PRODUCTS_MICROSERVICE_PORT=3001
  orders-db:
    container_name: orders-database
    image: postgres:17
    restart: always
    volumes:
    - ./orders-ms/postgres:/var/lib/postgresql/data
    ports:
    - 5432:5432
    environment:
    - POSTGRES_USER=postgres
    - POSTGRES_PASSWORD=123456
    - POSTGRES_DB=ordersdb 
~~~

- En el .env en el directorio del Launcher 

~~~
CLIENT_GATEWAY_PORT=3000
~~~

- No se recomienda usar :latest porque luego se despliega y hay incompatibilidades
- NATS ya está dentro de la red, detrás del gateway que comunica con el exterior
- La idea de exponer los puertos 42222,82222 es para que el mundo exterior pueda acceder a ellos, no la red interna
- Expongo 8222 para poder monitorear
- El nombre del servidor es igual al nombre del servicio 
- En lugar de **localhost pondré nats-server** en el string de conexión
- Empezando por el client-gateway, configuro el Dockerfile en la raíz
- **FROM** para descargar la imagen de Node
- **WORKDIR** para indicar donde trabajaremos, donde colocaremos la app
- **COPY** para copiar el JSON
- **RUN** para instalar las dependencias
- **COPY . .** para copiar todo lo que no está ignorado en el dockerignore
- **EXPOSE** para exponer el puerto

~~~Dockerfile
FROM node:20-alpine3.19

WORKDIR /usr/src/app  

COPY package.json ./
COPY package-lock.json ./

RUN npm install

COPY . .

EXPOSE 3000
~~~

- El .dockerignore que es el mismo para orders-ms y products-ms

~~~
dist/

node_modules/

.env

.vscode/
~~~

- Debo crear el Dockerfile en products-ms y orders-ms
- En products-ms/Dockerfile llamo a npx primsa generate, pero esto no va a funcionar en la vida real
- Aquí funciona porque uso SQLite y tengo la DB en el fileSystem ya creada, en la vida real usaría Postgres o Mongo
- Si no tenemos la db y las migraciones, lo que tengo en mi Schema debería ser suficiente para crear mi db
- Pero desde el Dockerfile estamos construyendo la imagen
- Mi Schema lo ocupo para ejecutarlo
- npx prisma generate solo funciona **si la DB ya existe**, por lo que en products-ms si va a funcionar pero en orders-ms no
- Si no existiera crear con **npx prisma migarte dev --name init**
- Me aseguro de tener data en la DB
- products-ms/Dockerfile

~~~Dockerfile
FROM node:20-alpine3.19

WORKDIR /usr/src/app

COPY package.json ./
COPY package-lock.json ./

RUN npm install

COPY . .

RUN npx prisma generate

EXPOSE 3001
~~~

- Para solucionar este problema en products y en orders creo un nuevo script en el json y lo coloco en el start:dev
- orders-ms/package.json

~~~json
"start:dev": "npm run docker:start && nest start --watch",
"docker:start": "prisma migrate dev && prisma generate",
~~~

### 🔹 ¿Qué hace cada script?

#### 1. `"docker:start": "prisma migrate dev && prisma generate"`

* `prisma migrate dev`:

  * Aplica las migraciones al esquema de base de datos definido en `prisma/schema.prisma`.
  * Crea la base de datos (si no existe) y aplica las migraciones.
  * Esto asegura que **la estructura de la base de datos esté actualizada** con el código Prisma.

* `prisma generate`:

  * Genera el **cliente Prisma** (los métodos TypeScript para acceder a la base de datos) basado en el schema actualizado.
  * Necesario para que tu aplicación pueda usar `prisma.product.findMany()` o similares.

#### 2. `"start:dev": "npm run docker:start && nest start --watch"`

* Ejecuta primero `docker:start` (migraciones + generación del cliente Prisma).
* Luego ejecuta `nest start --watch`, que inicia tu aplicación NestJS en modo desarrollo con recarga automática.


### 🔹 ¿Por qué se hace esto?

1. **Previene errores en tiempo de ejecución**:

   * Si Prisma no aplica las migraciones y no genera el cliente, la app Nest fallará al intentar acceder a tablas que no existen o al no encontrar el cliente de Prisma actualizado.

2. **Automatiza el flujo de desarrollo**:

   * Evita que tengas que correr manualmente `prisma migrate dev` y `prisma generate` cada vez que hagas un cambio en el schema.
   * Esto es especialmente útil en entornos **Dockerizados**, donde podrías estar reconstruyendo contenedores frecuentemente.

3. **Asegura consistencia entre código y base de datos**:

   * Si alguien más del equipo ejecuta el microservicio, se asegura de que tiene el mismo esquema y cliente Prisma, sin pasos manuales.

### ✅ Conclusión

El script `"start:dev"` garantiza que:

* La base de datos esté migrada y lista.
* El cliente de Prisma esté generado.
* Tu app NestJS se ejecute con un entorno de desarrollo consistente y funcional.
- orders-ms/Dockerfile

~~~Dockerfile
FROM node:20-alpine3.19

WORKDIR /usr/src/app

COPY package.json ./
COPY package-lock.json ./
COPY prisma ./prisma  

RUN npm install

RUN npx prisma generate --schema=./prisma/schema.prisma

COPY . .

EXPOSE 3002
~~~

- En las .env de orders-ms cambio la DATABASE_URL el localhost por orders-db

~~~js
DATABASE_URL="postgresql://postgres:123456@orders-db:5432/ordersdb?schema=public" //no uso localhost!
~~~

- Si observamos en Docker, nos podemos conectar a orders-db porque estamos mapeando los puertos
- En la vida real esto no sería necesario, exponer la DB de esta manera con 5432:5432
- Si lo quito del docker-compose sigue funcionando igual pero no puedo conectar desde TablePLus
- Es genial, porque vamos a crear una **red encapsulada** para que los servicios puedan comunciarse entre si basado en los nombres de los servidores. Dejo el puerto para poder visualizar con TablePLus

## Expandir nuestro Custom Exception Filter

- Cuando un microservicio no se levanta nos manda un error de Empty Response. There are no subscribers listening to that message "string del message pattern"
- Para centralizar las excepciones en client-gateway/src/exception/custom-exception.filter
- En este momento, si voy al client-gateway/orders.controller no estoy disparando el exceptionFilter
- Si todo lo estoy manejando mediante un try y un catch, lo coherente es usarlo también en el findAll

~~~js
@Get()
findAll( @Query() orderPaginationDto: OrderPaginationDto) {

    try {
    const orders = this.client.send('findAllOrders', orderPaginationDto)
    return orders
    
    } catch (error) {
    throw new RpcException(error)
    }
}
~~~

- El order-pagination.dto

~~~js
import { IsEnum, IsOptional } from 'class-validator';
import { OrderStatus, OrderStatusList } from 'src/common/enums/orders.enum';
import { PaginationDto } from 'src/common/pagination.dto';

export class OrderPaginationDto extends PaginationDto {


  @IsOptional()
  @IsEnum( OrderStatusList, {
    message: `Valid status are ${ OrderStatusList }`
  })
  status: OrderStatus;

}
~~~

- No hay muchas opciones parta manejar el error
    - exception.name devuelve "Error" y getError().toString tampoco resuelve mucho
- Tengo una manera usando el .includes con el string que devuelve el error del microservicio no conectado "Empty response..."
- client-gateway//common/exception/rpc-custom-exception.filter.ts

~~~js
import { ArgumentsHost, Catch, ExceptionFilter } from "@nestjs/common";
import { RpcException } from "@nestjs/microservices";

@Catch(RpcException)
export class RpcCustomExceptionFilter implements ExceptionFilter{

    catch(exception: RpcException, host: ArgumentsHost) {
        const ctx = host.switchToHttp()
        const response = ctx.getResponse()

        const rpcError= exception.getError()

        if(rpcError.toString().includes('Empty response')){
            return response.status(500).json({
                message: rpcError.toString().substring(0, rpcError.toString().indexOf('(', -1)),
                status: 500
            })
        }

        if(
            typeof rpcError === 'object' &&
            'status' in rpcError &&
            'message' in rpcError
        ){
            const status = isNaN((+rpcError as any).status) ? 400: +rpcError
            return response.status(status).json(rpcError)
        }

        response.status(400).json({
            status: 400,
            message: rpcError
        })
    }
}
~~~

- Esta línea:

```ts
rpcError.toString().substring(0, rpcError.toString().indexOf('(', -1))
```

- Sirve para **extraer la parte inicial del mensaje de error, antes de cualquier paréntesis** 
- Para crear submodulos de Git

## Dev

1. Clonar el repositorio
2. Crear un .env basado en el .env.template
3. Ejecutar el comando `git submodule update --init --recursive` para reconstruir los sub-módulos
4. Ejecutar el comando `docker compose up --build`


### Pasos para crear los Git Submodules

1. Crear un nuevo repositorio en GitHub
2. Clonar el repositorio en la máquina local
3. Añadir el submodule, donde `repository_url` es la url del repositorio y `directory_name` es el nombre de la carpeta donde quieres que se guarde el sub-módulo (no debe de existir en el proyecto)
```
git submodule add <repository_url> <directory_name>
```
4. Añadir los cambios al repositorio (git add, git commit, git push)
Ej:
```
git add .
git commit -m "Add submodule"
git push
```
5. Inicializar y actualizar Sub-módulos, cuando alguien clona el repositorio por primera vez, debe de ejecutar el siguiente comando para inicializar y actualizar los sub-módulos
```
git submodule update --init --recursive
```
6. Para actualizar las referencias de los sub-módulos
```
git submodule update --remote
```


## Importante
- Si se trabaja en el repositorio que tiene los sub-módulos, **primero actualizar y hacer push** en el sub-módulo y **después** en el repositorio principal. 

- Si se hace al revés, se perderán las referencias de los sub-módulos en el repositorio principal y tendremos que resolver conflictos.

# Prod

1. Clonar el repositorio
2. Crear un .env basado en el .env.template
3. Ejecutar el comando
```
docker compose -f docker-compose.prod.yml build
```

- En la raíz del Launcher que alberga orders-ms, etc coloco el .gitmodules
- Pongo el ejemplo de Herrera

~~~
[submodule "client-gateway"]
	path = client-gateway
	url = https://github.com/Nest-Microservices-DevTalles/client-gateway.git
[submodule "products-ms"]
	path = products-ms
	url = https://github.com/Nest-Microservices-DevTalles/products-microservice.git
[submodule "orders-ms"]
	path = orders-ms
	url = https://github.com/Nest-Microservices-DevTalles/orders-microservice.git
[submodule "payments-ms"]
	path = payments-ms
	url = https://github.com/Nest-Microservices-DevTalles/payments-ms.git
[submodule "auth-ms"]
	path = auth-ms
	url = https://github.com/Nest-Microservices-DevTalles/auth-ms.git

~~~

- El docker-compose de orders-ms lo borro, pero no el Dockerfile!!

- Para construir el Launcher

> docker compose -f docker-compose.yml build

- Para levantarlo con **docker compose up**

- Recuerda que ya no usamos localhost, por lo que en .env de orders-ms hay que cambiar la variable por el nombre del servicio

~~~js
PORT=3002
DATABASE_URL="postgresql://postgres:123456@orders-db:5432/ordersdb?schema=public"
PRODUCTS_MICROSERVICE_HOST=products-ms
PRODUCTS_MICROSERVICE_PORT=3001


//NATS_SERVERS="nats://localhost:4222, nats://localhost:4223"
NATS_SERVERS="nats://localhost:4222"
~~~

- Si estás en Windows es posible que al correr en Linux con Docker Prisma te dé algún problema al haber creado el cliente en Windows
- Se soluciona añadiendo esto al Schema

~~~prisma
generator client {
  provider = "prisma-client-js"
  output   = "../generated/prisma"
  binaryTargets = ["native", "linux-musl-openssl-3.0.x"]
}
~~~

- Debo cambiar también las .env del client-gateway y reemplazar localhost 

~~~js
PRODUCTS_MICROSERVICE_HOST=products-ms
PRODUCTS_MICROSERVICE_PORT=3001
ORDERS_MICROSERVICE_HOST=orders-ms
ORDERS_MICROSERVICE_PORT=3002
//NATS_SERVERS="nats://nats-server:4222, nats://nats-server:4223"
NATS_SERVERS="nats://nats-server:4222"
~~~

- En envs.ts de orders-ms debo tener productsMicroserviceHost y productsMicroservicePort

~~~js
import 'dotenv/config'
import * as joi from 'joi'


interface EnvVars{
    PORT: number
    DATABASE_URL: string,
    NATS_SERVERS: string[],
    PRODUCTS_MICROSERVICE_HOST: string,
    PRODUCTS_MICROSERVICE_PORT: number,

}

const envsSchema = joi.object({
    PORT: joi.number().required(),
    DATABASE_URL: joi.string().required(),
    NATS_SERVERS: joi.array().items(joi.string().required()),
    PRODUCTS_MICROSERVICE_HOST: joi.string().required(),
    PRODUCTS_MICROSERVICE_PORT: joi.number().required()
})
.unknown(true) //hay muchas variables más del entorno como el path de node, etc


const {error, value}= envsSchema.validate({
    ...process.env,
    NATS_SERVERS: process.env.NATS_SERVERS?.split(',')
})

if(error){
    throw new Error(`Config validation error: ${error.message}`)
}

const envVars: EnvVars = value


export const envs={
    port: envVars.PORT,
    databaseUrl: envVars.DATABASE_URL,
    natsServers: envVars.NATS_SERVERS,
    productsMicroserviceHost: envVars.PRODUCTS_MICROSERVICE_HOST,
    productsMicroservicePort: envVars.PRODUCTS_MICROSERVICE_PORT
}
~~~
------


