# 09 NEST_MS - Auth

- Repo github

> https://github.com/Nest-Microservices-DevTalles/products-launcher/tree/fin-seccion-12

- **NOTA**: Para que se actualicen los contenedores de Docker con los cambios agregar esto en el tsconfig.json en los microservicios y el gateway, al mismo nivel que el compilerOptions

~~~json
{
  "compilerOptions":{
    ...data
  },
  "watchOptions":{
    "watchFile": "dynamicPriorityPolling",
    "watchDirectory": "dynamicPriorityPolling",
    "excludeDirectories":["**/node_modules", "dist"]
  }
}
~~~

- **NOTA2**: **Para ver las opciones disponibles de algo en TypeScript usar Ctrl+space bar**

- Dentro del Launcher

> nest new auth-ms

## Comunicar Gateway con Auth-ms

- Configuro NATS en auth-ms
- No hace falta importar la carpeta transports con el NatsModule

~~~js
//NO HACE FALTA ESTE CÓDIGO EN AUTH-MS
import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { envs } from 'src/config/envs';
import { NATS_SERVICE } from 'src/config/services';


@Module({
  imports: [
    ClientsModule.register([
      {
        name: NATS_SERVICE,
        transport: Transport.NATS,
        options: {
          servers: envs.natsServers,
        },
      },
    ]),
  ],
  exports: [
    ClientsModule.register([
      {
        name: NATS_SERVICE,
        transport: Transport.NATS,
        options: {
          servers: envs.natsServers,
        },
      },
    ]),
  ],
})
export class NatsModule {}
~~~

- **Tampoco hace falta importar el NatsModule en auth-ms/src/auth/auth.module**
- En el main hago la configuración 
- Debo instalar @nestjs/microservices
- No tengo configurado el archivo envs, coloco en duro la data

> npm i class-validator class-transformer

~~~js
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { Logger, ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Auth-MS-main')
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.NATS,
      options:{
        servers: "nats://nats-server:4222"
      }
    }
  );

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, 
    forbidNonWhitelisted: true,
    transform: true
  }))
  await app.listen();

}
bootstrap();
~~~

- Configuro las variables de entorno

> npm i dotenv joi

- Debo instalar el paquete de nats también

> npm i nats

- Creo src/config/envs.ts

~~~js
import 'dotenv/config'
import * as joi from 'joi'


interface EnvVars{
    PORT: number
    NATS_SERVERS: string[]

}

const envsSchema = joi.object({
    PORT: joi.number().required(),
    NATS_SERVERS: joi.array().items(joi.string().required()),
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
    natsServers: envVars.NATS_SERVERS,
}
~~~

- Creo el .env en la raíz, y el .env.template 

~~~js
PORT=3004
NATS_SERVERS="nats://nats-server:4222"
~~~

- Ahora ya puedo usar las variables de entorno en el main de auth-ms

~~~js
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { Logger, ValidationPipe } from '@nestjs/common';
import { envs } from './config/envs';

async function bootstrap() {
  const logger = new Logger('Auth-MS-main')
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.NATS,
      options:{
        servers: envs.natsServers
      }
    }
  );

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, 
    forbidNonWhitelisted: true,
    transform: true
  }))
  await app.listen();
  logger.log(`Microservice running on port ${envs.port}`)
}
bootstrap();
~~~

- Copio el Dockerfile

~~~Dockerfile
FROM node:20-alpine3.19

WORKDIR /usr/src/app

COPY package.json ./
COPY package-lock.json ./

RUN npm install

COPY . .

EXPOSE 3002
~~~

- Copio también el .dockerignore
- En el docker-compose.yml debo incluir el auth-ms

~~~yml
auth-ms:
    build: ./auth-ms
    volumes:
        - ./auth-ms/src:/usr/src/app/src # mapeo el src
    command: npm run start:dev
    environment:
        - PORT=3004
        - NATS_SERVERS=nats://nats-server:4222
~~~

- Falta la conexión a la DB (luego)
- Genero el módulo de auth estando en la carpeta auth-ms

> nest g res auth

- Le digo que cree un microservicio sin los endpoints
- El controller del auth-ms queda algo así (de momento)

~~~js
import { Controller } from '@nestjs/common';
import { AuthService } from './auth.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { LoginUserDTo } from './dto/LoginUser.dto';
import { RegisterUserDto } from './dto/RegisterUser.dto';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

    @MessagePattern('auth.register.user')
    registerUser(@Payload() registerUserDto: RegisterUserDto){
      return 'register user'
    }
    @MessagePattern('auth.login.user')
    loginUser(@Payload() loginUserDto: LoginUserDTo){
      return 'login user'
    }
    @MessagePattern('auth.verify.user')
    verifyToken(){
      return 'verify token'
    }
}
~~~

- Creo la carpeta dto en auth-ms/auth con dtos provisionales
- **En el gateway** hay que crear el módulo de auth
- Borro los specs y el service, no los voy a usar
- Importo el NatsModule en gateway/auth

~~~js
import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { NatsModule } from 'src/transports/nats.module';

@Module({
  imports: [NatsModule],
  controllers: [AuthController],
  providers: [],
})
export class AuthModule {}
~~~

- Copio los dtos de auth-ms a gateway/auth
- El controller queda de momento así


~~~js
import { Body, Controller, Inject, Post } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { NATS_SERVICE } from 'src/config';
import { RegisterUserDto } from './dto/RegisterUser.dto';
import { LoginUserDTo } from './dto/LoginUser.dto';

@Controller('auth')
export class AuthController {
  constructor( @Inject(NATS_SERVICE)
      private readonly client: ClientProxy  ) {}

  @Post('register')
  registerUser(@Body() registerUserDto: RegisterUserDto){
    return this.client.send('auth.register.user', registerUserDto)
  }

  @Post('login')
  loginUser(@Body() loginUserDto: LoginUserDTo){
    return this.client.send('auth.login.user', loginUserDto)
  }
  @Get('verify')
  verifyToken(){
    return this.client.send('auth.verify.user',{})
  }
}
~~~

- Importo el NATS_SERVICE de config/services.ts

~~~js
export const NATS_SERVICE = 'NATS_SERVICE'
~~~

> docker compose up

- Ahora si apunto a localhost:3000/api/auth/login recibo como respuesta login user (todo ok!)

## Login y Register dto

- login-user.dto

~~~js
import { IsEmail, IsString, IsStrongPassword } from "class-validator"

export class LoginUserDto{

    @IsEmail()
    email: string

    @IsString()
    @IsStrongPassword()
    password: string
}
~~~

- register-user.dto

~~~js
import { IsEmail, IsString, IsStrongPassword } from "class-validator"

export class RegisterUserDto{

    @IsString()
    name: string


    @IsEmail()
    email: string

    @IsString()
    @IsStrongPassword()
    password: string
}
~~~

- Copio la carpeta dto al gateway/auth
- Ahora para que login pase la validación debo pasarle un objeto como este

~~~json
{
    "email": "email@email.com",
    "password": "Abc123456@"
}
~~~

## MongoDB

- Usaremos mongo en una imagen de Docker
- Da bastantes problemas, esta configuración (sacada de Claude) funciona

~~~yaml
version: '3'

services:
  nats-server:
    image: nats:latest # descargo la última versión de nats
    ports:
      - "8222:8222" # Expongo el 8222 que es el puerto por defecto para monitorear
                    # Expongo este puerto al exterior entre el cliente y el gateway, no la red interna
                    # No necesito exponerlo
  mongo:  # 👈 Nuevo servicio
    image: mongo:7
    container_name: auth-mongo
    restart: always
    ports:
      - "27017:27017"
    volumes:
      - ./auth-ms/mongo-data:/data/db
    environment:
      - MONGO_INITDB_DATABASE=auth-ms
    command: ["--replSet", "rs0", "--bind_ip_all", "--port", "27017"]
    healthcheck:
      test: |
        mongosh --eval "try { rs.status().ok } catch(e) { rs.initiate({_id:'rs0', members:[{_id:0, host:'mongo:27017'}]}).ok }"
      interval: 10s
      start_period: 30s
      
  client-gateway:
    depends_on:
      mongo:
        condition: service_healthy
      nats-server:
        condition: service_started
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
  auth-ms:
    build: ./auth-ms
    volumes:
      - ./auth-ms/src:/usr/src/app/src # mapeo el src
    command: npm run start:dev
    environment:
      - PORT=3004
      - NATS_SERVERS=nats://nats-server:4222
      - DATABASE_URL=${AUTH_DATABASE_URL}
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
      - DATABASE_URL=postgresql://postgres:123456@orders-db:5432/ordersdb?schema=public
      - NATS_SERVERS=nats://nats-server:4222 
      - PRODUCTS_MICROSERVICE_HOST=products-ms
      - PRODUCTS_MICROSERVICE_PORT=3001
  payments-ms:
    env_file: .env
    container_name: payments-ms
    build: ./payments-ms
    volumes:
      - ./payments-ms/src:/usr/src/app/src
    command: npm run start:dev
    ports:
      - ${PAYMENTS_MS_PORT}:${PAYMENTS_MS_PORT}
    environment:
      - PORT=${PAYMENTS_MS_PORT}
      - NATS_SERVERS=nats://nats-server:4222 
      - STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}
      - STRIPE_ENDPOINT_SECRET=${STRIPE_ENDPOINT_SECRET} 
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

> mongodb://usuario:contraseña@localhost:27017/auth-ms

- Creo la variable de entorno en el .env a la altura del docker-compose (y en env.template)

~~~
AUTH_DATABASE_URL="mongodb://mongo:27017/auth-ms?replicaSet=rs0&directConnection=true"
~~~

- **NOTA**: A veces Mongo Compass tiene problemas con el replicaSet, en TablePlus no hay problema y aparece la data

## Prisma con MongoDB

> npm i prisma
> npx prisma init

- Creo la variable de entorno en el .env de auth-ms, la nombro DATABASE_URL (que es como la llama prisma) para la conexión con prisma

~~~
PORT=3004
NATS_SERVERS="nats://nats-server:4222"
DATABASE_URL="mongodb://mongo:27017/auth-ms?replicaSet=rs0&directConnection=true"
~~~

- Configuro el archivo de prisma en auth-ms
- documentación

> https://www.prisma.io/docs/orm/overview/databases/mongodb

~~~prisma
generator client {
  provider = "prisma-client-js"
  output   = "../generated/prisma"
}

datasource db {
  provider = "mongodb"
  url      = env("DATABASE_URL")
}

model User{
  id       String @id @default(auto()) @map("_id") @db.ObjectId //mirar documentacion
  email    String @unique 
  name     String
  password String
}
~~~
- Para que prisma sepa que el campo es unique hay que hacer un npx prisma db push
- Para generar el cliente usar

> npx prisma generate

- Esto debería ser parte de la generación de imagen, por lo que añado este script

~~~json
{
  "scripts": {
   "start": "nest start",
    "start:dev": "npm run prisma:docker && npm run prisma:push && nest start --watch",
    "start:debug": "nest start --debug --watch",
    "start:prod": "node dist/main",
    "prisma:docker": "npx prisma generate",
    "prisma:push": "npx prisma db push",
  },
}
~~~

- Instalo las dependencias para variables de entorno

> npm install @nestjs/config dotenv

- Las configuro en el app-module

~~~js
import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';


@Module({
  imports: [AuthModule,
      ConfigModule.forRoot({
      isGlobal: true, 
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
~~~

- Hago el build

> docker compose up --build

- Configuro el cliente en auth-ms/auth.service

~~~js
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from 'generated/prisma';

@Injectable()
export class AuthService extends PrismaClient implements OnModuleInit {

    private readonly logger = new Logger('AuthService')

    onModuleInit() {
        this.$connect()
        this.logger.log('MongoDb connected!')
    }
}
~~~

## Registro de usuario

- En auth-ms/auth.service creo el método para registrar usuario
- **Si el where me da error (incomprensible) ejecutar npx prisma generate en auth-ms**

~~~js
async registerUser(registerUserDto: RegisterUserDto){
        try {
            const {name, email, password} = registerUserDto

            const user = await this.user.findUnique({
                where: {email}
            })

            if(user){
                throw new RpcException({
                    status: 400,
                    message: "User already exists"
                })
            }

            const newUser = await this.user.create({
                data:{
                    email,
                    password,
                    name
                }
            })

            return {
                user: newUser,
                token: 'ABC'
            }
            
        } catch (error) {
            throw new RpcException({
                status: 400,
                message: error.message
            })
        }
    }
~~~

- Lo llamo desde el auth-ms/auth.controller

~~~js
@MessagePattern('auth.register.user')
    registerUser(@Payload() registerUserDto: RegisterUserDto){
      return this.authService.registerUser(registerUserDto)
    }
~~~

- Con un objeto como este debería poder crear un usuario apuntando a localhost:3000/api/auth/register

~~~json
{
    "email": "migue@email.com",
    "password": "Abc123456@",
    "name": "Migue"
}
~~~

- Para manejar el error uso .pipe en el gateway
- gateway/auth/auth.controller

~~~js
@Post('register')
registerUser(@Body() registerUserDto: RegisterUserDto){
  return this.client.send('auth.register.user', registerUserDto)
  .pipe(
    catchError(error=> {
      throw new RpcException(error)
    })
  )
}
~~~

## Encriptar contraseña

- Instalo en auth-ms

> npm i @nestjs/jwt bcrypt
> npm i -D @types/bcrypt

- Importo y encripto la contraseña
- No devuelvo la contraseña en la respuesta

~~~js
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from 'generated/prisma';
import { RegisterUserDto } from './dto/register-user.dto';
import { RpcException } from '@nestjs/microservices';
import * as bcrypt from 'bcrypt'

@Injectable()
export class AuthService extends PrismaClient implements OnModuleInit {

    private readonly logger = new Logger('AuthService')

    onModuleInit() {
        this.$connect()
        this.logger.log('MongoDb connected!')
    }


    async registerUser(registerUserDto: RegisterUserDto){
        try {
            const {name, email, password} = registerUserDto

            const user = await this.user.findUnique({
                where: {email}
            })

            if(user){
                throw new RpcException({
                    status: 400,
                    message: "User already exists"
                })
            }

            const newUser = await this.user.create({
                data:{
                    email,
                    password: bcrypt.hashSync(password, 10),
                    name
                }
            })

            const {password: __, ...rest}= newUser

            return {
                user: rest,
                token: 'ABC'
            }
            
        } catch (error) {
            throw new RpcException({
                status: 400,
                message: error.message
            })
        }
    }
}
~~~

- Cada vez que hago instalaciones en el package.json debo vover a hacer el build

> docker compose up --build

## Login

- Comparo el password del http request con el guardado en la db

~~~js
 async loginUser(loginUserDto: LoginUserDto){
        try {
            const {email, password} = loginUserDto

            const user = await this.user.findUnique({
                where: {email}
            })

            if(!user){
                throw new RpcException({
                    status: 400,
                    message: "User does not exists"
                })
            }

            const isPasswordValid = bcrypt.compareSync(password, user.password) 

            if(!isPasswordValid){
                throw new RpcException({
                    status: 400,
                    message: "User/Password not valid"
                })
            }
           
            const {password:__, ...rest} = user

            return {
                user: rest, 
                token: 'ABC'
            }
            
        } catch (error) {
            throw new RpcException({
                status: 400,
                message: error.message
            })
        }
    }
~~~

- Conecto el auth-ms/auth.controller con el servicio

~~~js
@MessagePattern('auth.login.user')
  loginUser(@Payload() loginUserDto: LoginUserDto){
    return this.authService.loginUser(loginUserDto)
  }
~~~

- Y también el gateway/auth/auth.controller

~~~js
@Post('login')
loginUser(@Body() loginUserDto: LoginUserDto){
  return this.client.send('auth.login.user', loginUserDto)
    .pipe(
      catchError(error=>{
        throw new RpcException(error)
      })
    )
}
~~~

- Passport permite mediante estrategias varios tipos de autenticación
- Aqui solo vamos a generar un jwt

## Generar JWT

- Vamos a asegurarnos de que el login y el register regresen un JWT con la info necesaria
- Lo instalo en el auth-ms

> npm i @nestjs/jwt

- Tengo que inyectar el servicio de jwt, por lo que tengo que importar un módulo

~~~js
import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { envs } from './config/envs';


@Module({
  imports: [AuthModule,
      ConfigModule.forRoot({
      isGlobal: true, 
    }),
    JwtModule.register({
      global: true,
      secret: envs.secretJwt,
      signOptions: {expiresIn: '3d'}
    })
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
~~~

- Incorporo la variable en config/envs.ts

~~~js
import 'dotenv/config'
import * as joi from 'joi'


interface EnvVars{
    PORT: number
    NATS_SERVERS: string[],
    JWT_SECRET: string

}

const envsSchema = joi.object({
    PORT: joi.number().required(),
    NATS_SERVERS: joi.array().items(joi.string().required()),
    JWT_SECRET: joi.string().required()
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
    natsServers: envVars.NATS_SERVERS,
    secretJwt: envVars.JWT_SECRET
}
~~~

- Creo la variable en .env y la pongo vacía en .env.template de auth-ms
- Hago lo mismo en el .env global a la altura de docker-compose

~~~
JWT_SECRET=
~~~

- Lo coloco en el docker-compose.yml

~~~yml
auth-ms:
  build: ./auth-ms
  volumes:
    - ./auth-ms/src:/usr/src/app/src # mapeo el src
  command: npm run start:dev
  environment:
    - PORT=3004
    - NATS_SERVERS=nats://nats-server:4222
    - DATABASE_URL=${AUTH_DATABASE_URL}
    - JWT_SECRET=${JWT_SECRET}
~~~

- Hay que volver a hacer el build de docker
- Ahora ya puedo usar el JwtService en auth-ms/auth.service

~~~js
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from 'generated/prisma';
import { RegisterUserDto } from './dto/register-user.dto';
import { RpcException } from '@nestjs/microservices';
import * as bcrypt from 'bcrypt'
import { LoginUserDto } from './dto/login-user.dto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService extends PrismaClient implements OnModuleInit {

    private readonly logger = new Logger('AuthService')

    constructor(
        private readonly jwtService: JwtService
    ){
        super()
    }

    onModuleInit() {
        this.$connect()
        this.logger.log('MongoDb connected!')
    }

    async signJWT(payload: any){
        return this.jwtService.sign(payload)
    }

{...code}
}
~~~

- Creo auth-ms/src/auth/interfaces/payload.interface.ts

~~~js
export interface JwtPayload{
    id: string,
    email: string,
    name: string
}
~~~

- Tipo el payload del método anterior
- Voy a crear el token tanto en el registro como en el login
- auth-ms/auth.service

~~~js
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from 'generated/prisma';
import { RegisterUserDto } from './dto/register-user.dto';
import { RpcException } from '@nestjs/microservices';
import * as bcrypt from 'bcrypt'
import { LoginUserDto } from './dto/login-user.dto';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from './interfaces/payload.interface';

@Injectable()
export class AuthService extends PrismaClient implements OnModuleInit {

    private readonly logger = new Logger('AuthService')

    constructor(
        private readonly jwtService: JwtService
    ){
        super()
    }

    onModuleInit() {
        this.$connect()
        this.logger.log('MongoDb connected!')
    }

    async signJWT(payload: JwtPayload){
        return this.jwtService.sign(payload)
    }

    async registerUser(registerUserDto: RegisterUserDto){
        try {
            const {name, email, password} = registerUserDto

            const user = await this.user.findUnique({
                where: {email}
            })

            if(user){
                throw new RpcException({
                    status: 400,
                    message: "User already exists"
                })
            }

            const newUser = await this.user.create({
                data:{
                    email,
                    password: bcrypt.hashSync(password, 10),
                    name
                }
            })

            const {password: __, ...rest}= newUser

            return {
                user: rest,
                token: await this.signJWT(rest)
            }
            
        } catch (error) {
            throw new RpcException({
                status: 400,
                message: error.message
            })
        }
    }
    async loginUser(loginUserDto: LoginUserDto){
        try {
            const {email, password} = loginUserDto

            const user = await this.user.findUnique({
                where: {email}
            })

            if(!user){
                throw new RpcException({
                    status: 400,
                    message: "User does not exists"
                })
            }

            const isPasswordValid = bcrypt.compareSync(password, user.password) 

            if(!isPasswordValid){
                throw new RpcException({
                    status: 400,
                    message: "User/Password not valid"
                })
            }
           
            const {password:__, ...rest} = user

            return {
                user: rest, 
                token: await this.signJWT(rest)
            }
            
        } catch (error) {
            throw new RpcException({
                status: 400,
                message: error.message
            })
        }
    }
}
~~~

- En el payload no hay que enviar info cofidencial
- Puedes decodificar el jwt en jwt.io para ver que la info se envió correctamente

## Recibir JWT desde los headers

- Como el gateway es el punto de entrada, ahí vamos a tener nuestro Guard
- De momento me quiero asegurar de recibir el jwt
- En POSTMAN (o similares) envío el token de la respuesta en Bearer Token a localhost:3000/api/auth/verify
- En gateway/auth/auth.controller.ts uso @Request para acceder a la Request

~~~js
@Get('verify')
  verifyToken(@Req() req ){
    console.log(req.headers)
    return this.client.send('auth.verify.user',{})
  }
~~~

- En lugar de manejarlo así vamos a crear un Guard para hacer la verificación desde ahí
- En gateway/auth/guards/auth.guard.ts

~~~js

import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {


  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
        //puedo mandar esto porque estoy en el gateway HTTP
      throw new UnauthorizedException('Token not found'); 
    }

    try {
        //añado la info a la request en duro
        request['user'] ={
            id: 1,
            name: 'Fernando',
            email: 'fernan@gmail.com'
        }

        request['token'] = token

    } catch (error) {
        throw new UnauthorizedException(error)
    }
  
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
~~~

- Hago uso del guard en gateway/auth/auth.controller

~~~js
@UseGuards(AuthGuard)
  @Get('verify')
  verifyToken(@Req() req ){
    return this.client.send('auth.verify.user',{})
  }
~~~

- Todavía no estamos verificando el token, solo nos aseguramos de que viene un token y le pasamos la info en duro
- Ahora puedo tomar de la request el user y el token

~~~js
@UseGuards(AuthGuard)
@Get('verify')
verifyToken(@Req() req ){

  const user = req['user']
  const token = req['token']
  console.log({user, token})
  
  return this.client.send('auth.verify.user',{})
}
~~~

- Esta información tiene que venir del microservicio 
- Tomemos la información con un decorador personalizado

## Decoradores personalizados

- Creemos un Custom Decorator que me permita tomar el usuario y otro el token
- En gateway/auth/guards/decorators/user.decorator.ts

~~~js

import { createParamDecorator, ExecutionContext, InternalServerErrorException } from '@nestjs/common';

export const User = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {


    const request = ctx.switchToHttp().getRequest();
    
    if(!request.user){
        throw new InternalServerErrorException("User not found in request")
    }

    return request.user;
  },
);
~~~

- Uso el decorador

~~~js
@UseGuards(AuthGuard)
@Get('verify')
verifyToken(@User() user: any ){

  console.log(user)
  return this.client.send('auth.verify.user',{})
}
~~~

- Podemos tipar el user con una interfaz
- gateway/auth/guards/interfaces/user.interface.ts

~~~js
export interface CurrentUser{
    id: string
    email: string
    name: string
}
~~~

- Hago lo mismo con el token

~~~js

import { createParamDecorator, ExecutionContext, InternalServerErrorException } from '@nestjs/common';

export const Token = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {


    const request = ctx.switchToHttp().getRequest();
    
    if(!request.token){
        throw new InternalServerErrorException("Token not found")
    }

    return request.token;
  },
);
~~~

- Lo uso en el auth.controller del gateway

~~~js
@UseGuards(AuthGuard)
  @Get('verify')
  verifyToken(
    @User() user: CurrentUser,
    @Token() token: string
  ){
    console.log(user)
    return this.client.send('auth.verify.user',{})
  }
~~~

- Ahora tengo que pasarle la info del microservicio auth-ms

## Auth-ms Validar y revalidar el token

- En el auth-ms/auth.controller

~~~js
@MessagePattern('auth.verify.user')
  verifyToken(@Payload() token: string){
    return this.authService.verifyToken(token)
  }
~~~

- En el auth-ms/auth.service creo el método

~~~js
async verifyToken(token: string){
        try {
            const payload = this.jwtService.verify(token,{
                secret: envs.secretJwt
            })

        } catch (error) {
            throw new RpcException({
                status: 401,
                message: "Invalid token"
            })
        }
    }
~~~

- No puedo firmar un token cuando ya existe (el iat y el exp, las fechas de creación y expiración) por lo que tengo que quitar esta data
- Creo un nuevo token para alargar la vida

~~~js
async verifyToken(token: string){
    try {
        const {sub, iat, exp, ...user} = this.jwtService.verify(token,{
            secret: envs.secretJwt
        })

        return {
            user,
            token: await this.signJWT(user)
        }

    } catch (error) {
        throw new RpcException({
            status: 401,
            message: "Invalid token"
        })
    }
}
~~~

- ¿Dónde mando llamar a este verifyToken? ¡En el auth.guard del gateway!
- Uso la inyección de dependencias para inyectar con el NATS_SERVICE la comunicación con el auth-ms

~~~js

import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

import { Request } from 'express';
import { firstValueFrom } from 'rxjs';
import { NATS_SERVICE } from 'src/config';

@Injectable()
export class AuthGuard implements CanActivate {

  constructor(@Inject(NATS_SERVICE) private readonly client: ClientProxy){

  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
        //puedo mandar esto porque estoy en el gateway HTTP
      throw new UnauthorizedException('Token not found'); 
    }

    try {
      const {user, token: newToken} =await firstValueFrom(
        this.client.send('auth.verify.user', token)
      )

      request['user'] = user
      request['token'] = newToken

    } catch (error) {
        throw new UnauthorizedException(error)
    }
  
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
~~~

- Retorno el user y el token desde el auth.controller del gateway

~~~js
@UseGuards(AuthGuard)
@Get('verify')
verifyToken(@User() user: CurrentUser, @Token() token: string){
  return {user,token}
}
~~~

- En todos los lugares donde use el AUthGuard va a pasar por la verificación del token