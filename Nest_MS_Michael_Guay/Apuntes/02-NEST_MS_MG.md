# 02 NEST MICROSERVICES MICHAEL GUAY - USERS

- En sleepr

> nest g app auth

- Me aseguro que en el nest-cli ha sido agregado auth

~~~json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "apps/reservations/src",
  "compilerOptions": {
    "deleteOutDir": true,
    "webpack": true,
    "tsConfigPath": "apps/reservations/tsconfig.app.json"
  },
  "projects": {
    "common": {
      "type": "library",
      "root": "libs/common",
      "entryFile": "index",
      "sourceRoot": "libs/common/src",
      "compilerOptions": {
        "tsConfigPath": "libs/common/tsconfig.lib.json"
      }
    },
    "reservations": {
      "type": "application",
      "root": "apps/reservations",
      "entryFile": "main",
      "sourceRoot": "apps/reservations/src",
      "compilerOptions": {
        "tsConfigPath": "apps/reservations/tsconfig.app.json"
      }
    },
    "auth": {
      "type": "application",
      "root": "apps/auth",
      "entryFile": "main",
      "sourceRoot": "apps/auth/src",
      "compilerOptions": {
        "tsConfigPath": "apps/auth/tsconfig.app.json"
      }
    }
  },
  "monorepo": true,
  "root": "apps/reservations"
}
~~~

- Este módulo se encargará de registrar usuarios, el loggin, y autenticar con un JWT
- En sleepr genero un módulo users, selecciono auth

> nest g mo users
> nest g co users

- Ahora UsersModule está en auth.module
- apps/auth/src/auth.module

~~~js
import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from './users/users.module';

@Module({
  imports: [UsersModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
~~~

- Y el user.controller en los providers de user.module
- apps/auth/src/users/users.module
~~~js
import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';

@Module({
  controllers: [UsersController]
})
export class UsersModule {}
~~~

- Vamos a crear un método en el controller de create con su dto
- En apps/auth/src/users/dto

~~~js
import { IsEmail, IsString, IsStrongPassword, Min } from "class-validator"

export class CreateUserDto{
    @IsEmail()
    email: string

    @IsStrongPassword()
    password:string
}
~~~

- En el users.controller todavía no he creado e inyectado el servicio
- Creo el servicio, en el directorio sleepr

> nest g s users

- Selecciono auth
- Inyecto el servicio en el users.controller
- apps/auth/src/users/users.controller
~~~js
import { Body, Controller, Post } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {

    constructor(
        private readonly usersService: UsersService
    ){}
    @Post()
    async createUser(@Body() createUserDto: CreateUserDto ){
        return this.usersService.create(createUserDto)
    }
}
~~~


- Voy a apps/auth/src/users/users.service y creo el método para que no de error

~~~js
import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {

    async create(createUserDto: CreateUserDto){}
}

~~~

- Tengo que inyectar el modelo en el servicio pero antes debo crearlo!
- Copio el modelo de reservations y le borro solo las propiedades dejando la estructura
- apps/auth/src/users/models/user.model

~~~js
import { AbstractDocument } from "@app/common";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

@Schema()
export class UserDocument extends AbstractDocument {
}

export const UserSchema = SchemaFactory.createForClass(UserDocument)
~~~

- Le indico las dos propiedades

~~~js
import { AbstractDocument } from "@app/common";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

@Schema()
export class UserDocument extends AbstractDocument {
    
    @Prop()
    email: string
    
    @Prop()
    password: string
}

export const UserSchema = SchemaFactory.createForClass(UserDocument)
~~~

- Ahora creo el users.repository, extiende de AbstractRepository, le paso el UserDocument
- Creo un logger (de @nestjs/common)
- Inyecto el modelo, solo tengo que pasárselo al super (para la clase padre)
- sleepr/apps/auth/src/users/users.repository.ts

~~~js
import { AbstractRepository } from "@app/common";
import { UserDocument } from "./models/user.model";
import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";

@Injectable()
export class UsersRepository extends AbstractRepository<UserDocument>{
    protected readonly logger = new Logger(UsersRepository.name)

    constructor(@InjectModel(UserDocument.name) userModel: Model<UserDocument>){
        super(userModel)
    }
}
~~~

- Inyecto el repositorio en el servicio
- apps/auth/src/users/users.service

~~~js
import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {

    constructor(
        private readonly usersRepository: UsersRepository
    ){}

    async create(createUserDto: CreateUserDto){
        return this.usersRepository.create(createUserDto)
    }
}
~~~

- Veamos el **AbstractRepository**
- libs/common/src/database/abstract.repository

~~~js
import { FilterQuery, Model, Types, UpdateQuery } from "mongoose";
import { AbstractDocument } from "./abstract.schema";
import { Logger, NotFoundException } from "@nestjs/common";

export abstract class AbstractRepository<TDocument extends AbstractDocument>{
    protected abstract readonly logger: Logger
    
    constructor(protected readonly model: Model<TDocument>){}   

    async create(document: Omit<TDocument, '_id'>): Promise<TDocument>{
        const createdDocument= new this.model({
            ...document,
            _id: new Types.ObjectId()
        })

        return (await createdDocument.save()).toJSON() as unknown as TDocument
    }

    async findOne(filterQuery: FilterQuery<TDocument>): Promise<TDocument>{
        const document = await this.model.findOne(filterQuery).lean<TDocument>(true)
        if(!document){
            this.logger.warn(`Document was not found with  ${filterQuery}`)
            throw new NotFoundException('Document was not found')
        }

        return document
    }
    
    async findOneAndUpdate(filterQuery: FilterQuery<TDocument>, update: UpdateQuery<TDocument>): Promise<TDocument>{
        const document = await this.model
            .findOneAndUpdate(filterQuery,update, {new: true})
            .lean<TDocument>(true)
            
            if(!document){
                this.logger.warn(`Document was not found with  ${filterQuery}`)
                throw new NotFoundException('Document was not found')
            }

        return document
    }

    async find(filterQuery: FilterQuery<TDocument>): Promise<TDocument>{
        return this.model.find(filterQuery).lean<TDocument>(true)
    }

    async findOneAndDelete(filterQuery: FilterQuery<TDocument>): Promise<TDocument>{
        return this.model.findOneAndDelete(filterQuery).lean<TDocument>(true)
    }
}
~~~

- Y el AbstractDocument (en el mismo directorio)

~~~js
import { Prop, Schema } from "@nestjs/mongoose";
import { SchemaTypes, Types } from "mongoose";

@Schema()
export class AbstractDocument{
    @Prop({type: SchemaTypes.ObjectId })
    _id: Types.ObjectId
}
~~~

- Para usar un repositorio debo importar el DatabaseModule en UsersModule
- Copio el código de reservations.module
- apps/auth/src/users/users.module

~~~js
import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { DatabaseModule } from '@app/common';
import { UserDocument, UserSchema } from './models/user.model';

@Module({
  imports:[DatabaseModule, DatabaseModule.forFeature([
    {name: UserDocument.name,
      schema: UserSchema
    },
    
  ])],
  controllers: [UsersController],
  providers: [UsersService]
})
export class UsersModule {}
~~~

- Debo agregar el UsersRepository en los providers de users.module

~~~js
import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { DatabaseModule } from '@app/common';
import { UserDocument, UserSchema } from './models/user.model';
import { UsersRepository } from './users.repository';

@Module({
  imports:[DatabaseModule, DatabaseModule.forFeature([
    {name: UserDocument.name,
      schema: UserSchema
    },
    
  ])],
  controllers: [UsersController],
  providers: [UsersService, UsersRepository]
})
export class UsersModule {}
~~~

- Pongo en marcha el módulo de auth

> npm run start:dev auth

- No se puede conectar a la DB, porque mongo está corriendo en un container de docker
- El próximo paso será dockerizar auth
- En apps/auth/Dockerfile pego el anterior Dockerfile que hicimos en reservations, solo cambiamos el comando de ejecución

~~~Dockerfile
FROM node:alpine As development

WORKDIR /usr/src/app

COPY package.json ./
COPY package-lock.json ./

RUN npm install 

COPY . . 

RUN npm run build

FROM node:alpine As production

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app

COPY package.json ./
COPY package-lock.json ./

RUN npm install

COPY --from=development /usr/src/app/dist ./dist 

CMD ["node", "dist/apps/auth/main"]
~~~

- Añado un nuevo servicio al docker-compose.yaml
- sleepr/docker-compose.yaml

~~~yaml
services:
  reservations:
    build:
      context: .
      dockerfile: ./apps/reservations/Dockerfile
      target: development
    command: npm run start:dev reservations
    ports:
      - '3000:3000'
    volumes:
      - .:/usr/src/app
  auth:
    build:
      context: .
      dockerfile: ./apps/auth/Dockerfile
      target: development
    command: npm run start:dev auth
    ports: 
      - '3001:3001'
    volumes:
      - .:/usr/src/app
  mongo:
    image: mongo 
~~~

- Cambio el puerto a 3001 en el main de users
- apps/auth/src/users/main.ts

~~~js
import { NestFactory } from '@nestjs/core';
import { AuthModule } from './auth.module';

async function bootstrap() {
  const app = await NestFactory.create(AuthModule);
  await app.listen(3001);
}
bootstrap();
~~~

- Ahora desde sleepr uso el comando docker compose up

> docker compose up

- Para comprobar que funciona, voy a postman y uso el endpoint de users en el 3001 con un método POST

> http://localhost:3001/users

- Uso un objeto para el método create

~~~json
{
  "email": "miemail@correo.com",
  "password": "123456Abc"
}
~~~

- Recuerda! para la validación del dto hay que configurarlo en el main
- Hago uso del Logger de nestjs-pino
- apps/auth/src/main.ts

~~~js
import { NestFactory } from '@nestjs/core';
import { AuthModule } from './auth.module';
import { ValidationPipe } from '@nestjs/common';
import { Logger } from 'nestjs-pino';

async function bootstrap() {
  const app = await NestFactory.create(AuthModule);
  app.useGlobalPipes(new ValidationPipe({whitelist: true}))
  app.useLogger(app.get(Logger))
  await app.listen(3001);
}
bootstrap();
~~~

- Tengo que importar el LoggerModule en auth.module!

~~~js
import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from './users/users.module';
import { LoggerModule } from '@app/common';

@Module({
  imports: [UsersModule, LoggerModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
~~~
------

# Passport

- Hago las instalaciones en sleepr

> npm i @nestjs/passport passport passport-localhost

> npm i -D @types/passport-local

> npm i @nestjs/jwt passport-jwt

> npm i -D @types/passport-jwt

> docker compose up

- Importo JwtModule  de nestjs/jwt en auth.module
- Hago uso de registerAsync patra registrar unas variables de entorno
- Coloco una s al final en expiresIn para convertirlo a segundos

~~~js
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from './users/users.module';
import { LoggerModule } from '@app/common';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [UsersModule, LoggerModule, JwtModule.registerAsync({
    useFactory: (configService: ConfigService)=>({
      secret: configService.get('JWT_SECRET'),
      signOptions:{
        expiresIn: `${configService.get('JWT_EXPIRATION')}s`
      }
    })
  })],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
~~~

- Creo las variables de entorno

~~~js
MONGODB_URI=mongodb://mongo:27017/sleepr
JWT_SECRET=123abc
JWT_EXPIRATION=3600
~~~

- Para no mezclar las variables de entorno, creo un .env en la raíz de auth y muevo el que había en la raíz a reservations
- Hecho esto debo decirle a docker-compose dónde están ubicados los .env
- sleepr/docker-compose-yaml

~~~yaml
services:
  reservations:
    build:
      context: .
      dockerfile: ./apps/reservations/Dockerfile
      target: development
    command: npm run start:dev reservations
    env_file:
      - ./apps/reservations/.env
    ports:
      - '3000:3000'
    volumes:
      - .:/usr/src/app
  auth:
    build:
      context: .
      dockerfile: ./apps/auth/Dockerfile
      target: development
    command: npm run start:dev auth
    env_file:
      - ./apps/auth/.env
    ports: 
      - '3001:3001'
    volumes:
      - .:/usr/src/app
  mongo:
    image: mongo 
    container_name: mongo
    ports:
      - "27017:27017"
~~~

- Ahora valido las variables en mi ConfigModule
- sleepr/libs/common/config/config.module.ts
- Refactorizo y borro el ConfigModule (el directorio config)
- Borro el ConfigModule de DatabaseModule

~~~js
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {ModelDefinition, MongooseModule} from '@nestjs/mongoose'


@Module({
    imports:[MongooseModule.forRootAsync({
        imports:[],//borro ConfigModule
        useFactory: (configService: ConfigService)=>({
            uri: configService.get('MONGODB_URI')
        }),
        inject: [ConfigService]
    })]
})
export class DatabaseModule {
    static forFeature(models:ModelDefinition[]){
        return MongooseModule.forFeature(models)
    }
}
~~~

- En reservations.module importo el ConfigModule
- De esta manera configuraremos el configService dentro de cada módulo, es más apropiado en esta situación 

~~~js
import { Module } from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { ReservationsController } from './reservations.controller';
import { DatabaseModule } from '@app/common';
import { ReservationsRepository } from './reservations.repository';
import { ReservationDocument, ReservationSchema } from './models/reservation.schema';
import { LoggerModule } from '@app/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';

@Module({
  imports:[DatabaseModule, DatabaseModule.forFeature([
    {name: ReservationDocument.name,
      schema: ReservationSchema
    },
    
  ]),
  LoggerModule,
  ConfigModule.forRoot({
    isGlobal: true,
    validationSchema: Joi.object({
      MONGODB_URI: Joi.string().required()
    })
  })
],
  controllers: [ReservationsController],
  providers: [ReservationsService, ReservationsRepository],
})
export class ReservationsModule {}
~~~

- Hago lo mismo en auth.module, uso el ConfigModule y añado las variables de jwt
- Me aseguro de inyectar el ConfigService

~~~js
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from './users/users.module';
import { LoggerModule } from '@app/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as Joi from 'joi';

@Module({
  imports: [UsersModule, LoggerModule, 
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        MONGODB_URI: Joi.string().required(),
        JWT_SECRET: Joi.string().required(),
        JWT_EXPIRATION: Joi.string().required()
      })
    }),
    JwtModule.registerAsync({
    useFactory: (configService: ConfigService)=>({
      secret: configService.get('JWT_SECRET'),
      signOptions:{
        expiresIn: `${configService.get('JWT_EXPIRATION')}s`
      }
    }),
    inject: [ConfigService]
  })],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
~~~

- Ahora en el main quiero hacer uso del ConfigService para el puerto
- Para esto uso app.get, que me sirve para cualquier injectable
- apps/auth/main

~~~js
import { NestFactory } from '@nestjs/core';
import { AuthModule } from './auth.module';
import { ValidationPipe } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AuthModule);
  app.useGlobalPipes(new ValidationPipe({whitelist: true}))
  app.useLogger(app.get(Logger))

  const configService = app.get(ConfigService)
  await app.listen(configService.get('PORT'));
}
bootstrap();
~~~

- apps/reservations/main

~~~js
import { NestFactory } from '@nestjs/core';
import { ReservationsModule } from './reservations.module';
import { ValidationPipe } from '@nestjs/common';
import {Logger} from 'nestjs-pino'
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(ReservationsModule);
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true
  }))

  app.useLogger(app.get(Logger))
  
  const configService = app.get(ConfigService)
  await app.listen(configService.get('PORT'));
  
}
bootstrap();
~~~

- Agrego la variable PORT en los .env correspondientes (3000 para reservations, 3001 para auth)
- Añado la validación con Joi
- reservations.module

~~~js
import { Module } from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { ReservationsController } from './reservations.controller';
import { DatabaseModule } from '@app/common';
import { ReservationsRepository } from './reservations.repository';
import { ReservationDocument, ReservationSchema } from './models/reservation.schema';
import { LoggerModule } from '@app/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';

@Module({
  imports:[DatabaseModule, DatabaseModule.forFeature([
    {name: ReservationDocument.name,
      schema: ReservationSchema
    },
    
  ]),
  LoggerModule,
  ConfigModule.forRoot({
    isGlobal: true,
    validationSchema: Joi.object({
      MONGODB_URI: Joi.string().required(),
      PORT: Joi.string().required()
    })
  })
],
  controllers: [ReservationsController],
  providers: [ReservationsService, ReservationsRepository],
})
export class ReservationsModule {}
~~~

- Lo mismo en auth.module

~~~js
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from './users/users.module';
import { LoggerModule } from '@app/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as Joi from 'joi';

@Module({
  imports: [UsersModule, LoggerModule, 
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        MONGODB_URI: Joi.string().required(),
        JWT_SECRET: Joi.string().required(),
        JWT_EXPIRATION: Joi.string().required(),
        PORT: Joi.string().required()
      })
    }),
    JwtModule.registerAsync({
    useFactory: (configService: ConfigService)=>({
      secret: configService.get('JWT_SECRET'),
      signOptions:{
        expiresIn: `${configService.get('JWT_EXPIRATION')}s`
      }
    }),
    inject: [ConfigService]
  })],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
~~~

- Passport es una manera popular de realizar la autenticación mediante una estrategia
- Creo auth/src/strategies/local.strategy.es
- La clase es inyectable, extiende de PassportStrategy al que le paso Strategy de jwt-passport
- **IMPORTANTE**: importar Strategy de passport-local, NO DE passport-jwt

~~~js
import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-local";

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy){

}
~~~

- Para la configuración necesitamos el usersService, lo inyecto en el constructor
- En el constructor padre tengo algunas opciones.
  - Con usernameField puedo especificar el username para chequear, en este caso usaremos el mail
- Para que strategy funcione hay que implementar el método validate que se llamarà con éxito si el usuario es válido
  - Por esto inyecto el usersService

~~~js
import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-local";
import { UsersService } from "../users/users.service";

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy){

    constructor(
        private readonly usersService: UsersService
    ){
        super({usernameField:'email'})
    }
    async validate(email: string, password: string){
        return this.usersService.verifyUser(email, password)
    }
}
~~~ 

- Voy al usersService a implementar la lógica
- De paso refactorizo el create para hashear el password
- Instalo bcryptjs
- **NOTA**: uso bcryptjs en lugar de bcrypt para evitar problemas con Docker

> npm i bcryptjs
> npm i @types/bcryptjs

- Uso el spread para esparcir las propiedades del dto y acceder a password, uso bcrypt.hash, le paso 10 rondas de salt
- Cuanto más salt más complejo el algoritmo criptográfico

~~~js
import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UsersRepository } from './users.repository';
import * as bcrypt from 'bcryptjs'

@Injectable()
export class UsersService {

    constructor(
        private readonly usersRepository: UsersRepository
    ){}

    async create(createUserDto: CreateUserDto){
        return this.usersRepository.create({
          ...createUserDto, 
            password: await bcrypt.hash(createUserDto.password, 10)
        })
    }

    async verifyUser(email: string, passsword: string){

    }
}
~~~

- Para el validate me aseguro de que el usuario exista llamando a this.usersRepository.findOne


~~~js
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UsersRepository } from './users.repository';
import * as bcrypt from 'bcryptjs'

@Injectable()
export class UsersService {

    constructor(
        private readonly usersRepository: UsersRepository
    ){}

    async create(createUserDto: CreateUserDto){
        return this.usersRepository.create({...createUserDto, 
            password: await bcrypt.hash(createUserDto.password, 10)
        })
    }

    async verifyUser(email: string, password: string){
        const user = await  this.usersRepository.findOne({email})
        const passwordIsValid = await bcrypt.compare(password, user.password)
        if(!passwordIsValid){
            throw new UnauthorizedException('Credentials are not valid')
        }

        return user
    }
}
~~~

- Ahora vamos al método validate de apps/auth/src/strategies/local.strategy
- uso un try catch para capturar el error si no hay usaer y transformarlo a unauthorized
~~~js
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-local";
import { UsersService } from "../users/users.service";

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy){

    constructor(
        private readonly usersService: UsersService
    ){
        super({usernameField:'email'})
    }
    async validate(email: string, password: string){

        try {
            return await this.usersService.verifyUser(email, password)
            
        } catch (error) {
            throw new UnauthorizedException(error)
        }
    }
}
~~~


- Paso el usersRepository

~~~js
import { AbstractRepository } from "@app/common";
import { UserDocument } from "./models/user.model";
import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";

@Injectable()
export class UsersRepository extends AbstractRepository<UserDocument>{
    protected readonly logger = new Logger(UsersRepository.name)

    constructor(@InjectModel(UserDocument.name) userModel: Model<UserDocument>){
        super(userModel)
    }
}
~~~

- Y el Abstractrepository en libs/common/src/database/abstract.repository

~~~js
import { FilterQuery, Model, Types, UpdateQuery } from "mongoose";
import { AbstractDocument } from "./abstract.schema";
import { Logger, NotFoundException } from "@nestjs/common";

export abstract class AbstractRepository<TDocument extends AbstractDocument>{
    protected abstract readonly logger: Logger
    
    constructor(protected readonly model: Model<TDocument>){}   

    async create(document: Omit<TDocument, '_id'>): Promise<TDocument>{
        const createdDocument= new this.model({
            ...document,
            _id: new Types.ObjectId()
        })

        return (await createdDocument.save()).toJSON() as unknown as TDocument
    }

    async findOne(filterQuery: FilterQuery<TDocument>): Promise<TDocument>{
        const document = await this.model.findOne(filterQuery).lean<TDocument>(true)
        if(!document){
            this.logger.warn(`Document was not found with  ${filterQuery}`)
            throw new NotFoundException('Document was not found')
        }

        return document
    }
    
    async findOneAndUpdate(filterQuery: FilterQuery<TDocument>, update: UpdateQuery<TDocument>): Promise<TDocument>{
        const document = await this.model
            .findOneAndUpdate(filterQuery,update, {new: true})
            .lean<TDocument>(true)
            
            if(!document){
                this.logger.warn(`Document was not found with  ${filterQuery}`)
                throw new NotFoundException('Document was not found')
            }

        return document
    }

    async find(filterQuery: FilterQuery<TDocument>): Promise<TDocument>{
        return this.model.find(filterQuery).lean<TDocument>(true)
    }

    async findOneAndDelete(filterQuery: FilterQuery<TDocument>): Promise<TDocument>{
        return this.model.findOneAndDelete(filterQuery).lean<TDocument>(true)
    }
}
~~~

- En el AuthController usaré useGuards para el login, el cual me da acceso a usar un Guard
- Me habilita a usar la estrategia con el email y password que me pasen por el controlador

~~~js
import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards()
  @Post('login')
  login(){}
}
~~~

- Creo en auth/src/guards/local-auth.guard.ts
- La clase extiende de AuthGuard, le paso la estrategia (local)
- Por defecto, el Strategy que colocamos en LocalStrategy extends PassportStrategy(Strategy) es local
- Podría verse así, donde el segundo parámetro es el nombre de la estrategia

~~~js
export class LocalStrategy extends PassportStrategy(Strategy, 'local')
~~~

- Ya puedo pasarle el guard a useGuards
- Antes del login quiero tener acceso al usuario actual, después de correr por el AuthGuard 
- Crearemos un decorador para ello en auth/src/users/current-user.decorator.ts
- Tenemos acceso al UserDocument porque cuando llamamos al **validate en LocalStrategy**, cuando usamos verifyUser **retornamos un user**
- Este método validate añade **AUTOMATICAMENTE el user a la request** 
- Entonces lo que hago en este getCurrentUserByContext es extraer este usuario de la request y hacerlo accesibe desde el controlador
- apps/auth/current-user.decorator.ts

~~~js
import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { UserDocument } from "./users/models/user.model";


const getCurrentUserByContext = (context: ExecutionContext): UserDocument =>{
    return context.switchToHttp().getRequest().user
}


export const CurrentUser= createParamDecorator(
(_data: unknown, context: ExecutionContext)=> getCurrentUserByContext(context)
)
~~~

- Ahora ya puedo usar este decorador en el controlador
- Tambien quiero la Response, le paso el passthrough porque quiero guardar el token en las cookies
- Todavía no he creado el método login en AuthService


~~~js
import { Controller, Get, Post, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { CurrentUser } from './current-user.decorator';
import { UserDocument } from './users/models/user.model';
import {Response} from 'express'

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(
    @CurrentUser() user: UserDocument,
    @Res({passthrough: true}) res: Response
  ){
    await this.authService.login(user, res)

    res.send(user)
  }
}
~~~

- Creo el método login en el auth.service
- En este momento yo ya se que el usuario es válido, ha pasado por el local en el Guard, hemos establecido el user en la request y estamos listos para establecer el token para este usuario
- En el AuthService necesito inyectar el ConfigService para las variables de JWT en .env y el JWTService
- Establezco el tokenPyaload donde almacenaré la info dentro del token
- Guardo el token en la cookie, la hago mas segura haciendola solo accesible por http y le paso la misma expiración que al token

~~~js
import { Injectable } from '@nestjs/common';
import { UserDocument } from './users/models/user.model';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService
  ){

  }

  async login(user: UserDocument, res: Response){
    const tokenPayload= {
      userId: user._id.toHexString()
    }

    const expires = new Date()
    expires.setSeconds(
      expires.getSeconds() + this.configService.get('JWT_EXPIRATION')
    )

    const token = this.jwtService.sign(tokenPayload)

    res.cookie('Authentication', token, {
      httpOnly: true,
      expires
    })
  }
}
~~~

- Me aseguro de incluir como provider en auth.module el LocalStrategy, ya que es una clase inyectable

~~~js
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from './users/users.module';
import { LoggerModule } from '@app/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as Joi from 'joi';
import { LocalStrategy } from './strategies/local.strategy';

@Module({
  imports: [UsersModule, LoggerModule, 
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        MONGODB_URI: Joi.string().required(),
        JWT_SECRET: Joi.string().required(),
        JWT_EXPIRATION: Joi.string().required(),
        PORT: Joi.string().required()
      })
    }),
    JwtModule.registerAsync({
    useFactory: (configService: ConfigService)=>({
      secret: configService.get<string>('JWT_SECRET'),
      signOptions:{
        expiresIn: `${configService.get('JWT_EXPIRATION')}s`
      }
    }),
    inject: [ConfigService]
  })],
  controllers: [AuthController],
  providers: [AuthService, LocalStrategy],
})
export class AuthModule {}
~~~

- Estamos inyectando el UsersService en el LocalStrategy por lo que debo exportar el servicio desde users.module

~~~js
import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { DatabaseModule } from '@app/common';
import { UserDocument, UserSchema } from './models/user.model';
import { UsersRepository } from './users.repository';

@Module({
  imports:[DatabaseModule, DatabaseModule.forFeature([
    {name: UserDocument.name,
      schema: UserSchema
    },
    
  ])],
  controllers: [UsersController],
  providers: [UsersService, UsersRepository],
  exports: [UsersService]//AQUI
})
export class UsersModule {}
~~~

- Creo un usuario en

> http://localhost:3001/users

- Le paso el objeto en el body

~~~json
{
  "email": "user@correo.com",
  "password": "@123456Abc"
}
~~~

- Para el login

> http://localhost:3001/auth/login

- de momento el login me retorna el usuario

- **NOTA**: Si sale este error en consola: JwtStartegy requires a secret o key, asegurarse que Strategy es importado de passport-local y no passport-jwt
----

## JWT Strategy

- Crearemos otra estrategia para validar el JWT para aquellas rutas que requieran autenticación
- Volvemos a usar PassportStrategy para extender la clase, esta vez **si le paso la Strategy de passport-jwt**
- Requiere cierta configuración en el constructor
- Con jwtFromRequest le especifico donde vive el token (es una cookie)
- Uso ExtractJwt.fromExtractors, le paso un array con la ubicación del token en las cookies
- Necesito pasarle el secretOrKey con la variable de entorno de mi palabra secreta para codificar jwt
- En el validate tengo el userId como parámetro porque es la información que guardé en el payload y obtendré una vez decodificado

- En auth/src/strategies/jwt.startegy.ts

~~~js
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { UsersService } from "../users/users.service";
import { Request } from "express";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy){
    constructor(
        configService: ConfigService,
        private readonly usersService: UsersService
    ){
        super({
            jwtFromRequest: ExtractJwt.fromExtractors([
                (request: Request)=> request?.cookies?.Authentication
            ]),
            secretOrKey: configService.get('JWT_SECRET')
        })
    }

    async validate({userId}){}
}
~~~

- Creo una interfaz para el token-payload en auth/src/interfaces/token-payload.interface.ts

~~~js
export interface TokenPayload{
    userId: string
}
~~~

- Puedo añadirla en el AuthService

~~~js
import { Injectable } from '@nestjs/common';
import { UserDocument } from './users/models/user.model';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { TokenPayload } from './interfaces/token-payload';

@Injectable()
export class AuthService {

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService
  ){

  }

  async login(user: UserDocument, res: Response){
    //AQUI
    const tokenPayload: TokenPayload= {
      userId: user._id.toHexString()
    }

    const expires = new Date()
    expires.setSeconds(
      expires.getSeconds() + this.configService.get('JWT_EXPIRATION')
    )

    const token = this.jwtService.sign(tokenPayload)

    res.cookie('Authentication', token, {
      httpOnly: true,
      expires
    })
  }
}
~~~

- También tipo la respuesta en el método obligatorio validate de la strategy, la cual **se encargará de todo** automáticamente
- Debo comprobar una vez tengo el id que el usuario existe

~~~js
async validate({userId}: TokenPayload){
      return this.usersService.getUser({_id: userId})
      
  }
~~~

- Por supuesto tengo que crear este método en el usersService
- Creo un dto para ello 

~~~js
import { IsNotEmpty, IsString } from "class-validator";

export class GetUserDto{
    @IsString()
    @IsNotEmpty()
    _id: string
}
~~~

- Uso el dto en el usersService

~~~js
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UsersRepository } from './users.repository';
import * as bcrypt from 'bcryptjs'
import { GetUserDto } from './dto/get-user.dto';

@Injectable()
export class UsersService {

    constructor(
        private readonly usersRepository: UsersRepository
    ){}

    async create(createUserDto: CreateUserDto){
        return this.usersRepository.create({...createUserDto, 
            password: await bcrypt.hash(createUserDto.password, 10)
        })
    }

    async verifyUser(email: string, password: string){
        const user = await  this.usersRepository.findOne({email})
        const passwordIsValid = await bcrypt.compare(password, user.password)
        if(!passwordIsValid){
            throw new UnauthorizedException('Credentials are not valid')
        }

        return user
    }

    //AQUI
    async getUser(getUserDto: GetUserDto){
        return this.usersRepository.findOne(getUserDto)
    }
}
~~~

- Creo el guard para el jwt eb apps/auth/src/guards/jwt-auth.guard.ts

~~~js
import { AuthGuard } from "@nestjs/passport";

export class JwtAuthGuard extends AuthGuard('jwt'){
    
}
~~~

- Creo una nueva ruta en el users.controller que devolverá el usuario autenticado
- Tan pronto como esta guardia se ejecuta, tenemos el usuario en el objeto de la solicitud y podemos simplemente devolverlo

~~~js
import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UsersService } from './users.service';
import { CurrentUser } from '../current-user.decorator';
import { UserDocument } from './models/user.model';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@Controller('users')
export class UsersController {

    constructor(
        private readonly usersService: UsersService
    ){}
    @Post()
    async createUser(@Body() createUserDto: CreateUserDto ){
        return this.usersService.create(createUserDto)
    }

    @Get()
    @UseGuards(JwtAuthGuard)
    async getUser(
        @CurrentUser() user: UserDocument
    ){
        return user
    }
}
~~~

- Tengo que añadir el JwtStartegy en los providers de auth.module

~~~js
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from './users/users.module';
import { LoggerModule } from '@app/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as Joi from 'joi';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [UsersModule, LoggerModule, 
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        MONGODB_URI: Joi.string().required(),
        JWT_SECRET: Joi.string().required(),
        JWT_EXPIRATION: Joi.string().required(),
        PORT: Joi.string().required()
      })
    }),
    JwtModule.registerAsync({
    useFactory: (configService: ConfigService)=>({
      secret: configService.get<string>('JWT_SECRET'),
      signOptions:{
        expiresIn: `${configService.get('JWT_EXPIRATION')}s`
      }
    }),
    inject: [ConfigService]
  })],
  controllers: [AuthController],
  providers: [AuthService, LocalStrategy, JwtStrategy],
})
export class AuthModule {}
~~~

- Ahora si no autorizo debidamente no puedo obtener el user del GET getUser 

> http:localhost:3001/users

- Devuelve "Unauthorized" ya que no he usado ningún jwt válido
- Si hago un login a http://localhost:3001/auth/login el jwt se guarda en las cookies
- Aun teniendo el token en las cookies sigue dando unathorized
- Para manejar las cookies usaremos cookie-parser

> npm i cookie-parser
> npm i @types/cookie-parser

- En el main de auth importo cookie-parser, lo coloco antes del validationPipe como middleware

~~~js
import { NestFactory } from '@nestjs/core';
import { AuthModule } from './auth.module';
import { ValidationPipe } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser'

async function bootstrap() {
  const app = await NestFactory.create(AuthModule);
  app.use(cookieParser())
  app.useGlobalPipes(new ValidationPipe({whitelist: true}))
  app.useLogger(app.get(Logger))

  const configService = app.get(ConfigService)
  await app.listen(configService.get('PORT'));
}
bootstrap();
~~~

- **NOTA**: debo hacer la petición primero el login y luego el GET a 3001/users desde la misma request de POSTMAN

- Creemos una validación para que los emails sean únicos
- En users.service modifico el create con el nuevo método validateCreateUserDto

~~~js
    async create(createUserDto: CreateUserDto){
        await this.validateCreateUserDto(createUserDto)

        return this.usersRepository.create({...createUserDto, 
            password: await bcrypt.hash(createUserDto.password, 10)
        })
    }

    async validateCreateUserDto(createUserDto: CreateUserDto){
        try {
            await this.usersRepository.findOne({email: createUserDto.email})
        } catch (error) {
         return   
        }
        throw new UnprocessableEntityException('Email already exists')
    }
~~~
-----

## Common Auth Guard

- Ahora debemos conectar los microservicios para que puedan hablar entre ellos y reservations puedan hablar con auth para autenticar usuarios
- Nest ofrece varios transportes para ello
- Usaremos el standard TCP
- Instalamos en sleepr/

> npm i @nestjs/microservices

- Vamos a convertir auth en una aplicación hibrida.
- Escuchará tanto http como a través de nuestra capa de microservicios
- apps/auth/main.ts

~~~js
import { NestFactory } from '@nestjs/core';
import { AuthModule } from './auth.module';
import { ValidationPipe } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser'
import { Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(AuthModule);

  app.connectMicroservice({transport: Transport.TCP})

  app.use(cookieParser())
  app.useGlobalPipes(new ValidationPipe({whitelist: true}))
  app.useLogger(app.get(Logger))

  const configService = app.get(ConfigService)

  await app.startAllMicroservices()
  await app.listen(configService.get('PORT'));
}
bootstrap();
~~~

- Vamos a crear un AuthGuard para que todos mis servicios puedan comprobar si un JWT es válido
- Ese AuthGuard va a hacer una llamada a mi serviciod e autenticación a través de TCP y determinar si el JWT proporcionado es válido
- Implemento canActivate 
- libs/common/src/auth/jwt-auth.gurad.ts

~~~js
import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Observable } from "rxjs";

@Injectable()
export class JwtAuthGuard implements CanActivate{
    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
        throw new Error("Method not implemented.");
    }
    
}
~~~

- Este AuthGuard estará implementado en las rutas expuestas al exterior y esperará que le pasen en las cookies un jwt válido
- Al usar las cookies, cualquier servicio que utilice este guard deberá utilizar el paquete cookie-parser

~~~js
import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Observable } from "rxjs";

@Injectable()
export class JwtAuthGuard implements CanActivate{
    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
        const jwt = context.switchToHttp().getRequest().cookies?.Authentication
        if(!jwt){
            return false
        }
    }
    
}
~~~

- Ahora tenemos que llegar al microservicio de auth para determinar si el JWT es válido
- Nos comunicamos a través de un ClientProxy disponible inyectado
- Creo en libs/common/constants/services.ts para crear el token de inyección

~~~js
export const AUTH_SERVICE= 'auth'
~~~

- Una vez definido el token de inyección puedo inyectar el ClientProxy

~~~js
import { CanActivate, ExecutionContext, Inject, Injectable } from "@nestjs/common";
import { Observable } from "rxjs";
import { AUTH_SERVICE } from "../constants/services";
import { ClientProxy } from "@nestjs/microservices";

@Injectable()
export class JwtAuthGuard implements CanActivate{

    constructor(
        @Inject(AUTH_SERVICE) private readonly authClient: ClientProxy
    ){}

    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
        const jwt = context.switchToHttp().getRequest().cookies?.Authentication
        if(!jwt){
            return false
        }
    }
    
}
~~~

- Ahora que ya tengo el ClienteProxy inyectado debo configurar una ruta en el servicio de autenticación que pueda recibir llamadas RPC
- apps/auth/src/auth.controller.ts

~~~js
import { Controller, Get, Post, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { CurrentUser } from './current-user.decorator';
import { UserDocument } from './users/models/user.model';
import {Response} from 'express'
import { MessagePattern } from '@nestjs/microservices';
import { JwtAuthGuard } from './guards/jwt-auth.guard'; //importo el de auth/src/guards

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(
    @CurrentUser() user: UserDocument,
    @Res({passthrough: true}) res: Response
  ){
    await this.authService.login(user, res)

    res.send(user)
  }

  @UseGuards(JwtAuthGuard)
  @MessagePattern('authenticate')
  async authenticate(){}
}
~~~

- Queremos comprobar el JWT entrante, verificar que es correcto y devolver un usuario asociado al JWT
- Es la lógica establecida en la JWT Strategy, donde extraemos el JWT de la request
- Una vez pasado por la strategy el token no va a estar en las cookies si no en la request
- Añado algo de lógica, cambio la request a tipo any ya que puede ser una request i una llamada rpc
- jwt.strategy

~~~js
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { UsersService } from "../users/users.service";
import { Request } from "express";
import { TokenPayload } from "../interfaces/token-payload";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy){
    constructor(
        configService: ConfigService,
        private readonly usersService: UsersService
    ){
        super({
            jwtFromRequest: ExtractJwt.fromExtractors([ 
                        //esto                                        //y esto
                (request: any)=> request?.cookies?.Authentication || request?.Authentication
            ]),
            secretOrKey: configService.get('JWT_SECRET')
        })
    }

    async validate({userId}: TokenPayload){
        return this.usersService.getUser({_id: userId})
        
    }
}
~~~

- En JwtAuthGuard le envio el jwt a través del cliente proxy con el target authenticate y en el objeto de la data el jwt 
- Uso .pipe para usar operadores
  - tap de rxjs me permite ejecutar un efecto secundario en la respuesta entrante
  - La respuesta entrante será el propio usuario asociado a ese JWT
  - Lo que quiero es tomar ese user y añadirlo a la request 
  - map en true si recibimos una respuesta satisfactoria del microservicio de auth, lo que significa que estamos autenticados
  - queremos un true desde can Activate , lo que permitirá que la solicitud continue estando autenticados
- libs/common/auth/jwt-auth.guard.ts

~~~js
import { CanActivate, ExecutionContext, Inject, Injectable } from "@nestjs/common";
import { map, Observable, tap } from "rxjs";
import { AUTH_SERVICE } from "../constants/services";
import { ClientProxy } from "@nestjs/microservices";

@Injectable()
export class JwtAuthGuard implements CanActivate{

    constructor(
        @Inject(AUTH_SERVICE) private readonly authClient: ClientProxy
    ){}

    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
        const jwt = context.switchToHttp().getRequest().cookies?.Authentication
        if(!jwt){
            return false
        }
        
       return this.authClient.send('authenticate',{
            Authentication: jwt
        }).pipe(
            tap(res=>{
                context.switchToHttp().getRequest().user = res
            }),
            map(()=> true)
        )
    }
    
}
~~~

- En el controlador de reservations uso este JwtAuthGuard de libs/common

~~~js
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { JwtAuthGuard } from '@app/common';

@Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createReservationDto: CreateReservationDto) {
    return this.reservationsService.create(createReservationDto);
  }

...code }
~~~

- Esto me da error de que Nest no puede resolver dependencias lo que tiene sentido
- Estoy usando un token de inyección en el servicio de reservations
- Para decalarar este token de inyección voy al reservations.module

~~~js
import { Module } from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { ReservationsController } from './reservations.controller';
import { DatabaseModule } from '@app/common';
import { ReservationsRepository } from './reservations.repository';
import { ReservationDocument, ReservationSchema } from './models/reservation.schema';
import { LoggerModule } from '@app/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AUTH_SERVICE } from '@app/common/constants/services';

@Module({
  imports:[DatabaseModule, DatabaseModule.forFeature([
    {name: ReservationDocument.name,
      schema: ReservationSchema
    },
    
  ]),
  LoggerModule,
  ConfigModule.forRoot({
    isGlobal: true,
    validationSchema: Joi.object({
      MONGODB_URI: Joi.string().required(),
      PORT: Joi.string().required()
    })
  }),
  //AQUI!
  ClientsModule.register([
    {name: AUTH_SERVICE, transport: Transport.TCP}
  ])
],
  controllers: [ReservationsController],
  providers: [ReservationsService, ReservationsRepository],
})
export class ReservationsModule {}
~~~
- Recuerda, al trabajar con cookies debo agregar la linea de cookie-parser en el main de reservations

~~~js
import { NestFactory } from '@nestjs/core';
import { ReservationsModule } from './reservations.module';
import { ValidationPipe } from '@nestjs/common';
import {Logger} from 'nestjs-pino'
import { ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(ReservationsModule);
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true
  }))

  app.useLogger(app.get(Logger))

  //AQUI!
  app.use(cookieParser())
  
  const configService = app.get(ConfigService)
  await app.listen(configService.get('PORT'));
  
}
bootstrap();
~~~

- Hago un login desde Postman, intento hacer una reserva desde el puerto 3000 con el jwt en las cookies y me da error
- Me dice que la conexión TCP **está cerrada**
- Básicamente debo especificar el puerto en el main de auth!
- Declaro el configService antes de la conexión
- Distingo los puertos como HTTP_PORT y TCP_PORT
~~~js
import { NestFactory } from '@nestjs/core';
import { AuthModule } from './auth.module';
import { ValidationPipe } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser'
import { Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(AuthModule);
  const configService = app.get(ConfigService)

  app.connectMicroservice({
    transport: Transport.TCP,
    options:{
      host: '0.0.0.0',
      port: configService.get('TCP_PORT')
    }
  })

  app.use(cookieParser())
  app.useGlobalPipes(new ValidationPipe({whitelist: true}))
  app.useLogger(app.get(Logger))


  await app.startAllMicroservices()
  await app.listen(configService.get('HTTP_PORT'));
}
bootstrap();
~~~

- Voy a la validación de las variables de entorno en auth.module

~~~js
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from './users/users.module';
import { LoggerModule } from '@app/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as Joi from 'joi';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [UsersModule, LoggerModule, 
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        MONGODB_URI: Joi.string().required(),
        JWT_SECRET: Joi.string().required(),
        JWT_EXPIRATION: Joi.string().required(),
        HTTP_PORT: Joi.string().required(),
        TCP_PORT: Joi.string().required(),
      })
    }),
    JwtModule.registerAsync({
    useFactory: (configService: ConfigService)=>({
      secret: configService.get<string>('JWT_SECRET'),
      signOptions:{
        expiresIn: `${configService.get('JWT_EXPIRATION')}s`
      }
    }),
    inject: [ConfigService]
  })],
  controllers: [AuthController],
  providers: [AuthService, LocalStrategy, JwtStrategy],
})
export class AuthModule {}
~~~

- Escribo en .env las variables

~~~
MONGODB_URI=mongodb://mongo:27017/sleepr
HTTP_PORT=3001
TCP_PORT=3002
JWT_SECRET=123abc
JWT_EXPIRATION=3600
~~~

- En reservations.module uso .registerAsync para usar el configService
- Asegurarse de usar el inject!

~~~js
import { Module } from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { ReservationsController } from './reservations.controller';
import { DatabaseModule } from '@app/common';
import { ReservationsRepository } from './reservations.repository';
import { ReservationDocument, ReservationSchema } from './models/reservation.schema';
import { LoggerModule } from '@app/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as Joi from 'joi';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AUTH_SERVICE } from '@app/common/constants/services';

@Module({
  imports:[DatabaseModule, DatabaseModule.forFeature([
    {name: ReservationDocument.name,
      schema: ReservationSchema
    },
    
  ]),
  LoggerModule,
  ConfigModule.forRoot({
    isGlobal: true,
    validationSchema: Joi.object({
      MONGODB_URI: Joi.string().required(),
      AUTH_PORT: Joi.string().required(),
      AUTH_HOST: Joi.string().required()
    })
  }),
  ClientsModule.registerAsync([
    {name: AUTH_SERVICE, 
    useFactory: (configService: ConfigService)=>({
      transport: Transport.TCP,
      options:{
        host: configService.get('AUTH_HOST'),
        port: configService.get('AUTH_PORT')
      }
    }),
    inject: [ConfigService]  
    }
  ])
],
  controllers: [ReservationsController],
  providers: [ReservationsService, ReservationsRepository],
})
export class ReservationsModule {}
~~~

- Para la variable AUTH_HOST se va a definir en el docker-compose (services) para comunicarse entre ellos
- Por ello, como los servicios están llamados reservations y auth, el AUTH_HOST es auth
- docker-compose.yaml

~~~yaml
services:
  reservations:
    build:
      context: .
      dockerfile: ./apps/reservations/Dockerfile
      target: development
    command: npm run start:dev reservations
    env_file:
      - ./apps/reservations/.env
    ports:
      - '3000:3000'
    volumes:
      - .:/usr/src/app
  auth:  ##Se llama auth, este es el host
    build:
      context: .
      dockerfile: ./apps/auth/Dockerfile
      target: development
    command: npm run start:dev auth
    env_file:
      - ./apps/auth/.env
    ports: 
      - '3001:3001'
    volumes:
      - .:/usr/src/app
  mongo:
    image: mongo 
    container_name: mongo
    ports:
      - "27017:27017"
~~~

- El AUTH_PORT será el 3002, pues es el que definimos en auth microservice

~~~
MONGODB_URI=mongodb://mongo:27017/sleepr
PORT=3000
AUTH_PORT=3002
AUTH_HOST=auth
~~~

- Si hago unu login a http://localhost:3001/auth/login y luego intento hacer una reservation al puerto 3000 me da error y dice

> no elements in sequence

- Esto es porque no estoy devolviendo nada en el observable lo que tiene sentido porque en el auth.controller no estoy dev+olviendo nada

~~~js
import { Controller, Get, Post, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { CurrentUser } from './current-user.decorator';
import { UserDocument } from './users/models/user.model';
import {Response} from 'express'
import { MessagePattern } from '@nestjs/microservices';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(
    @CurrentUser() user: UserDocument,
    @Res({passthrough: true}) res: Response
  ){
    await this.authService.login(user, res)

    res.send(user)
  }

  @UseGuards(JwtAuthGuard)
  @MessagePattern('authenticate')
  async authenticate(){}//<-----ESTA VACÍO!!
}
~~~

- Echemos un vistazo a la strategy
- Quiero ver que el JwtAuthGuard envía correctamente el JWT
- retorno la request.cookies y añado un console.log
- apps/auth/src/strategies/jwt.strategy

~~~js
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { UsersService } from "../users/users.service";
import { Request } from "express";
import { TokenPayload } from "../interfaces/token-payload";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy){
    constructor(
        configService: ConfigService,
        private readonly usersService: UsersService
    ){
        super({
            jwtFromRequest: ExtractJwt.fromExtractors([ 
                (request: any)=>{
                    console.log(request)
                   return  request?.cookies?.Authentication || request?.Authentication
                } 
            ]),
            secretOrKey: configService.get('JWT_SECRET')
        })
    }

    async validate({userId}: TokenPayload){
        return this.usersService.getUser({_id: userId})
        
    }
}
~~~

- Veo en consola que tengo Authentication: "el_token" como lo había configurado en el JwtAuthGuard
- libs/common/src/auth/jwt-auth.guard.ts

~~~js
import { CanActivate, ExecutionContext, Inject, Injectable } from "@nestjs/common";
import { map, Observable, tap } from "rxjs";
import { AUTH_SERVICE } from "../constants/services";
import { ClientProxy } from "@nestjs/microservices";

@Injectable()
export class JwtAuthGuard implements CanActivate{

    constructor(
        @Inject(AUTH_SERVICE) private readonly authClient: ClientProxy
    ){}

    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
        const jwt = context.switchToHttp().getRequest().cookies?.Authentication
        if(!jwt){
            return false
        }
        
       return this.authClient.send('authenticate',{
            Authentication: jwt //AQUI!
        }).pipe(
            tap(res=>{
                context.switchToHttp().getRequest().user = res
            }),
            map(()=> true)
        )
    }    
}
~~~

- Ahora que se que está seteado correctamente puedo devolver el código a como estaba

~~~js
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { UsersService } from "../users/users.service";
import { Request } from "express";
import { TokenPayload } from "../interfaces/token-payload";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy){
    constructor(
        configService: ConfigService,
        private readonly usersService: UsersService
    ){
        super({
            jwtFromRequest: ExtractJwt.fromExtractors([ 
                (request: any)=> request?.cookies?.Authentication || request?.Authentication
                 
            ]),
            secretOrKey: configService.get('JWT_SECRET')
        })
    }

    async validate({userId}: TokenPayload){
        return this.usersService.getUser({_id: userId})
        
    }
}
~~~

- Vamos a usar @Payload en el auth.controller

~~~js
import { Controller, Get, Post, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { CurrentUser } from './current-user.decorator';
import { UserDocument } from './users/models/user.model';
import {Response} from 'express'
import { MessagePattern, Payload } from '@nestjs/microservices';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(
    @CurrentUser() user: UserDocument,
    @Res({passthrough: true}) res: Response
  ){
    await this.authService.login(user, res)

    res.send(user)
  }

  @UseGuards(JwtAuthGuard)
  @MessagePattern('authenticate')
  async authenticate(
    @Payload() data: any
  ){
    console.log(data)
  }
}
~~~

- Sigo teniendo un error 500 pero puedo ver en consola el objeto user
- Retorno la data.user y soluciona el problema

~~~js
import { Controller, Get, Post, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { CurrentUser } from './current-user.decorator';
import { UserDocument } from './users/models/user.model';
import {Response} from 'express'
import { MessagePattern, Payload } from '@nestjs/microservices';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(
    @CurrentUser() user: UserDocument,
    @Res({passthrough: true}) res: Response
  ){
    await this.authService.login(user, res)

    res.send(user)
  }

  @UseGuards(JwtAuthGuard)
  @MessagePattern('authenticate')
  async authenticate(
    @Payload() data: any
  ){
    return data.user
  }
}
~~~

- Ahora quiero extaer el user de la request  en el reservations.controller, como lo seteé en el JwtAuthGuard
- libs/common/auth
~~~js
import { CanActivate, ExecutionContext, Inject, Injectable } from "@nestjs/common";
import { map, Observable, tap } from "rxjs";
import { AUTH_SERVICE } from "../constants/services";
import { ClientProxy } from "@nestjs/microservices";

@Injectable()
export class JwtAuthGuard implements CanActivate{

    constructor(
        @Inject(AUTH_SERVICE) private readonly authClient: ClientProxy
    ){}

    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
        const jwt = context.switchToHttp().getRequest().cookies?.Authentication
        if(!jwt){
            return false
        }
        
       return this.authClient.send('authenticate',{
            Authentication: jwt 
        }).pipe(
            tap(res=>{
                context.switchToHttp().getRequest().user = res //AQUI!! 
            }),
            map(()=> true)
        )
    }
    
}
~~~

- Tengo el CurrentUser decorator, voy a moverlo al directorio common
- Ahora puedo usarlo en reservations.controller
- Para tipar el user creo un dto en common, será una interfaz

~~~js
export interface UserDto{
   _id: string
   email: string
   password: string 
}
~~~

- En el reservations.controller hago uso del @CurrentUser para obtener el user, le paso el id al servicio

~~~js
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { JwtAuthGuard } from '@app/common';
import { CurrentUser } from '@app/common/decorators/current-user.decorator';
import { UserDto } from '@app/common/dto/user.dto';

@Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createReservationDto: CreateReservationDto, @CurrentUser() user: UserDto) {
    return this.reservationsService.create(createReservationDto, user_id);
  }

...code }
~~~

- En el servicio, en lugar de harcodear el userId

~~~js
import { Injectable } from '@nestjs/common';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { ReservationsRepository } from './reservations.repository';

@Injectable()
export class ReservationsService {

  constructor(
    private readonly reservationsRepository: ReservationsRepository
  ){}

   create(createReservationDto: CreateReservationDto, userId: string) {
    return this.reservationsRepository.create({
      ...createReservationDto, 
      timestamp: new Date(),
      userId})
  }

...code }
~~~

- Para ver el usuario en consola

~~~js
create(createReservationDto: CreateReservationDto, userId: string) {
  const _user= this.reservationsRepository.create({
    ...createReservationDto, 
    timestamp: new Date(),
    userId})

    console.log(_user)

    return _user
}
~~~

- El controlador queda así

~~~js
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { JwtAuthGuard } from '@app/common';
import { CurrentUser } from '@app/common/decorators/current-user.decorator';
import { UserDto } from '@app/common/dto/user.dto';

@Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
 async create(@Body() createReservationDto: CreateReservationDto, @CurrentUser() user: UserDto) {
    return this.reservationsService.create(createReservationDto, user._id);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll() {
    return this.reservationsService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.reservationsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateReservationDto: UpdateReservationDto) {
    return this.reservationsService.update(id, updateReservationDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.reservationsService.remove(id);
  }
}
~~~

- Hago login a 

> http://localhost:3001/auth/login

~~~json
{
  "email": "user@correo.com",
  "password": "@123456Abc"
}
~~~

- Para hacer una reservation a

> http://localhost:3000/reservations