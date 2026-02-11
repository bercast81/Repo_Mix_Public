# NEST MICROSERVICIOS MICHAEL GUAY - SETUP & COMMON LIBRARY/ RESERVATIONS

- Para inciar el proyecto clon de airbnb

> nest new sleepr

- Dentro del directorio sleepr crearé una librería que llamaré common
- De esta manera no tendré que reescribir el mismo código en los diferentes microservicios
- Convertiremos el proyecto en un monorepo donde cada microservicio compartirá código desde un único lugar

> nest g library common

- Esto me crea dentro de sleepr el directorio libs/common
- Este tiene un archivo llamado tsconfig.lib.json que extiende del tsconfig
- libs/common/tsconfig.lib.json

~~~json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "declaration": true,
    "outDir": "../../dist/libs/common"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "test", "**/*spec.ts"]
}
~~~

- Puedo ver en el tsconfig los paths que se han agregado
- tsconfig.json

~~~json
{
  "compilerOptions": {
    "module": "commonjs",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2021",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "skipLibCheck": true,
    "strictNullChecks": false,
    "noImplicitAny": false,
    "strictBindCallApply": false,
    "forceConsistentCasingInFileNames": false,
    "noFallthroughCasesInSwitch": false,
    "paths": {
      "@app/common": [
        "libs/common/src"
      ],
      "@app/common/*": [
        "libs/common/src/*"
      ]
    }
  }
}
~~~

- En el nest-cli.json ahora tenemos una sección llamada **projects**

~~~json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "deleteOutDir": true,
    "webpack": true
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
    }
  }
}
~~~

- No necesitamos el common.module ni el common.service
- Los microservicios importarán los módulos que necesiten en el monorepo
- Borro los exports del module y el service en libs/common/index.ts para que no de error
-----

## Database & Config Module

- Instalo 

> npm i @nestjs/mongoose mongoose

- Instalo también

> npm i @nestjs/config

- Genero un módulo, le especifico en qué proyecto (common) lo quiero con -p

> nest generate module database -p common

- Hago lo mismo con el config module

> nest generate module config -p common

- Esto me da libs/common/src/config y libs/common/src/database

- En el config.module importo el ConfigModule y uso forRoot
- Lo renombro para que no choque con el nombre de la clase
- libs/common/src/config/config.module.ts

~~~js
import { Module } from '@nestjs/common';
import  {ConfigService, ConfigModule as NestConfigModule} from '@nestjs/config';

@Module({
    imports:[NestConfigModule.forRoot({
            
    })],
    providers:[ConfigService],
    exports:[ConfigService]

})
export class ConfigModule {}
~~~

- Vamos con la conexión de MongoDB
- libs/common/src/database/database.module.ts
~~~js
import { Module } from '@nestjs/common';
import {MongooseModule} from '@nestjs/mongoose'


@Module({
    imports:[MongooseModule.forRoot('mongodb://127.0.0.1/sleepr')]
})
export class DatabaseModule {}

~~~

- En app.module importo el DatabaseModule

~~~js
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from '@app/common/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
~~~

- En el módulo de Database creo un archivo de barril, y otro dentro de libs/common/src/index.ts
- libs/common/src/database/index.ts

~~~js
export * from './database.module'
~~~

- libs/common/src/index.ts

~~~js
export * from './database'
~~~

- Ahora la importación queda más sencilla
- src/app.module
~~~js
import { Module } from '@nestjs/common'; 
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from '@app/common'; //solo @app/common

@Module({
  imports: [DatabaseModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
~~~

- En lugar de harcodear el string de mongo usaremos una variable de entorno
-  Creo .env en la raíz

~~~
MONGODB_URI=mongodb://127.0.0.1/sleepr
~~~

- Para usar la variable de entorno refactorizaremos el codigo en database.module con **forRootAsync**
- Para eso usaremos useFactory para inyectar el ConfigService
- En useFactory, le paso el ConfigService como argumento y envuelvo el objeto del return entre paréntesis para hacer implícito el return
- Uso el inject para inyectar el Configservice
- Importo el ConfigModule que yo creé en libs/common/src/config/config.module
- libs/common/src/database/database.module.ts

~~~js
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {MongooseModule} from '@nestjs/mongoose'
import { ConfigModule } from '../config/config.module';


@Module({
    imports:[MongooseModule.forRootAsync({
        imports:[ConfigModule],
        useFactory: (configService: ConfigService)=>({
            uri: configService.get('MONGODB_URI')
        }),
        inject: [ConfigService]
    })]
})
export class DatabaseModule {}
~~~

- Implementaremos validacion a las variables de entorno con joi

> npm i joi

- En el validationSchema creo un objeto con Joi y hago la validación
- **NOTA**: Importo todo de joi as Joi
- libs/common/src/config/config.module

~~~js
import { Module } from '@nestjs/common';
import  {ConfigService, ConfigModule as NestConfigModule} from '@nestjs/config';
import * as Joi from 'joi';

@Module({
    imports:[NestConfigModule.forRoot({
            validationSchema: Joi.object({
                MONGODB_URI: Joi.string().required()
            })
    })],
    providers:[ConfigService],
    exports:[ConfigService]
})
export class ConfigModule {}
~~~
-----

## Abstract Repository

- Mis schemas extenderán de esta clase abstracta
- Creo libs/common/src/database/abstract.schema.ts

~~~js
import { Prop, Schema } from "@nestjs/mongoose";
import { SchemaTypes, Types } from "mongoose";

@Schema()
export class AbstractDocument{
    @Prop({type: SchemaTypes.ObjectId })
    _id: Types.ObjectId
}
~~~


- Creo también en la misma ubicación el abstract.repository.ts
- Así nos aseguraremos de no duplicar el código
- Esta clase lleva un genérico que extiende de AbstractDocument, porque sabemos  que será un objeto de Mongo (con _id)
- Inyecto en el constructor el model que será de tipo TDocument
- Creo un logger sin instanciar

~~~js
import { Model } from "mongoose";
import { AbstractDocument } from "./abstract.schema";
import { Logger } from "@nestjs/common";

export abstract class AbstractRepository<TDocument extends AbstractDocument>{
    protected abstract readonly logger: Logger
    
    constructor(protected readonly model: Model<TDocument>){}   
}
~~~

- Empecemos con los métodos
- Con create uso Omit para omitir el _id ya que lo crearemos nosotros
- Uso toJSON para que nos devuelva un objeto plano
~~~js
export abstract class AbstractRepository<TDocument extends AbstractDocument>{
{...code}

async create(document: Omit<TDocument, '_id'>): Promise<TDocument>{
    const createdDocument= new this.model({
        ...document,
        _id: new Types.ObjectId()
    })

    return (await createdDocument.save()).toJSON() as unknown as TDocument
}
}
~~~

- Método findOne
- Le paso un parámetro de tipo FilterQuery de Mongoose de tipo TDocument (mi Schema abstracto)
- Con lean le digo que me devuelva el objeto JSON sin todos los añadidos que le hace Mongo

~~~js
export abstract class AbstractRepository<TDocument extends AbstractDocument>{

{...code}

async findOne(filterQuery: FilterQuery<TDocument>): Promise<TDocument>{
    const document = await this.model.findOne(filterQuery).lean<TDocument>(true)
    
    if(!document){
        this.logger.warn(`Document was not found with  ${filterQuery}`)
        throw new NotFoundException('Document was not found')
    }

    return document
}
}
~~~

- findOneAndUpdate
- Uso UpdateQuery de Mongoose, de tipo TDocument
- Pongo el objeto new en true para que me devuleva el objeto actualizado

~~~js
export abstract class AbstractRepository<TDocument extends AbstractDocument>{
   {...code}   

async findOneAndUpdate(filterQuery: FilterQuery<TDocument>, update: UpdateQuery<TDocument>): Promise<TDocument>{
    const document = await this.model
        .findOneAndUpdate(filterQuery,update, {new: true}) //true para que devuelva el objeto actualizado
        .lean<TDocument>(true)
        
        if(!document){
            this.logger.warn(`Document was not found with  ${filterQuery}`)
            throw new NotFoundException('Document was not found')
        }

    return document
}
}
~~~

- Método find (encontrar múltiples entidades)

~~~js
export abstract class AbstractRepository<TDocument extends AbstractDocument>{
   {...code} 

async find(filterQuery: FilterQuery<TDocument>): Promise<TDocument>{
        return this.model.find(filterQuery).lean<TDocument>(true)
    }
}
~~~

- El método delete

~~~js
export abstract class AbstractRepository<TDocument extends AbstractDocument>{
   {...code}
      async findOneAndDelete(filterQuery: FilterQuery<TDocument>): Promise<TDocument>{
        return this.model.findOneAndDelete(filterQuery).lean<TDocument>(true)
    }

~~~
-----

## Reservations CRUD

- Creemos el primer microservicio

> nest g app reservations

- Esto me crea el directorio **apps** con los directiorios sleepr (el nombre del proyecto) y reservations
- Si miro el nest-cli.json me ha agregado el los proyectos en "projects"

~~~json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "apps/sleepr/src",
  "compilerOptions": {
    "deleteOutDir": true,
    "webpack": true,
    "tsConfigPath": "apps/sleepr/tsconfig.app.json"
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
    "sleepr": {
      "type": "application",
      "root": "apps/sleepr",
      "entryFile": "main",
      "sourceRoot": "apps/sleepr/src",
      "compilerOptions": {
        "tsConfigPath": "apps/sleepr/tsconfig.app.json"
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
    }
  },
  "monorepo": true,
  "root": "apps/sleepr"
}
~~~

- **Borro sleepr** del nest-cli.json y **también el directorio**, no lo necesito
- Cambio el root a apps/reservation, el tsconfigPath y el sourceRoot a reservations

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
    }
  },
  "monorepo": true,
  "root": "apps/reservations" 
}
~~~

- Si levanto el proyecto no aparece el módulo de Mongo
- Es porque no he importado el DatabaseModule en reservations

~~~js
import { Module } from '@nestjs/common';
import { ReservationsController } from './reservations.controller';
import { ReservationsService } from './reservations.service';
import { DatabaseModule } from '@app/common';

@Module({
  imports: [DatabaseModule],
  controllers: [ReservationsController],
  providers: [ReservationsService],
})
export class ReservationsModule {}
~~~

- Empezaremos con una API REST de reservations
- Lo creo dentro de sleepr (la raíz del proyecto)

> nest g res reservations

- Ahora tengo un directorio reservations dentro de apps/reservations/src/(reservations)
- Cojo todos los archivos y reemplazo los que hay en apps/reservation/src
- Importo el DatabaseModule

~~~js
import { Module } from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { ReservationsController } from './reservations.controller';
import { DatabaseModule } from '@app/common';

@Module({
  imports:[DatabaseModule],
  controllers: [ReservationsController],
  providers: [ReservationsService],
})
export class ReservationsModule {}
~~~

- Creo en apps/reservations/src/reservations.repository.ts
~~~js
import { AbstractRepository } from "@app/common/database/abstract.repository";
import { Injectable } from "@nestjs/common";

@Injectable()
export class ReservationsRepository extends AbstractRepository{
    
}
~~~

- Para satisfacer la importación solo con @app/common voy a libs/common/src/database/index.ts

~~~js
export * from './database.module'
export * from './abstract.repository'
~~~

- AbstractRepository espera el TDocument que extiende de AbstractDocument con el _id de mongo

~~~js
export abstract class AbstractRepository<TDocument extends AbstractDocument>
~~~

- Cambio  el nombre de apps/reservations/src/entities a models y el archivo a reservation.schema.ts
- Importo Schema de @nestjs/mongoose, pongo el versionKey en false para evitar el versionado de los documentos
- Por supuesto el Schema extiende de AbstractDocument

~~~js
import { AbstractDocument } from "@app/common/database/abstract.schema";
import { Schema } from "@nestjs/mongoose";

Schema({versionKey: false})
export class ReservationDocument extends AbstractDocument {}
~~~

- Dentro voy a definir las propiedades
- userId y placeId serán cada uno otro microservicio (users, places)
- Los coloco como strings de momento
- También habrá otro microservicio de pago (inVoice)
- apps/reservations/src/models/reservation.chema.ts

~~~js
import { AbstractDocument } from "@app/common";
import { Schema } from "@nestjs/mongoose";

Schema({versionKey: false})
export class ReservationDocument extends AbstractDocument {

    timestamp: Date
    startDate: Date
    endDate: Date
    userId: string
    placeId: string
    inVoiceId: string
}
~~~

- Para satisfacer la importación con @app/common voy a libs/common/src/database/index.ts

~~~js
export * from './database.module'
export * from './abstract.repository'
export * from './abstract.schema'
~~~

- Le paso el modelo que acabo de crear al repositorio
- apps/reservations/src/reservations.repository
~~~js
import { AbstractRepository } from "@app/common";
import { Injectable } from "@nestjs/common";
import { ReservationDocument } from "./models/reservation.schema";

@Injectable()
export class ReservationsRepository extends AbstractRepository<ReservationDocument>{
    
}
~~~

- Vamos a tipar las propiedades del modelo con @Props de @nestjs/mongoose
- Uso SchemaFactory para crear el Schema
- apps/reservations/src/models/reservation.schema.ts

~~~js
import { AbstractDocument } from "@app/common";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

@Schema()
export class ReservationDocument extends AbstractDocument {
    @Prop({type: Date, required: true})
    timestamp: Date
    
    @Prop({type: Date, required: true})
    startDate: Date
    
    @Prop({type: Date, required: true})
    endDate: Date
    
    @Prop({type: String, required: true})
    userId: string
    
    @Prop({type: String, required: true})
    placeId: string
    
    @Prop({type: String, required: true})
    invoiceId: string
}

export const ReservationSchema = SchemaFactory.createForClass(ReservationDocument)
~~~

- Creo un logger en reservations.repository. Le paso el nombre del repositorio
- En el constructor uso InjectModel de Mongoose, le paso el nombre del ReservationDocument
- Creo el reservationModel, tipándolo con Model (de mongoose) y le paso el ReservationDocument (el schema)
- LLamo al super para satisfacer el AbstractRepository pasándole el modelo
- apps/reservations/src/reservations.repository

~~~js
import { AbstractRepository } from "@app/common";
import { Injectable, Logger } from "@nestjs/common";
import { ReservationDocument } from "./models/reservation.schema";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";

@Injectable()
export class ReservationsRepository extends AbstractRepository<ReservationDocument>{
    private readonly logger = new Logger(ReservationsRepository.name)

    constructor(
        @InjectModel(ReservationDocument.name) 
        reservationModel: Model<ReservationDocument>
    ){
        super(reservationModel)
    }
}
~~~

- Incorporo el ReservationsRepository en los providers de ReservationsModule

~~~js
import { Module } from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { ReservationsController } from './reservations.controller';
import { DatabaseModule } from '@app/common';
import { ReservationsRepository } from './reservations.repository';

@Module({
  imports:[DatabaseModule],
  controllers: [ReservationsController],
  providers: [ReservationsService, ReservationsRepository],
})
export class ReservationsModule {}
~~~

- Si levanto el servidor me da  Nest can't resolve dependencies of the ReservationRepository 
- No he usado el forFeature en el módulo para pasarle el modelo
- Primero crearé un método estático en el databaseModule para incializar los modelos

~~~js
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {ModelDefinition, MongooseModule} from '@nestjs/mongoose'
import { ConfigModule } from '../config/config.module';


@Module({
    imports:[MongooseModule.forRootAsync({
        imports:[ConfigModule],
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

- En ReservationsModule declaro el modelo.
- Debo pasarle un name y un schema

~~~js
import { Module } from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { ReservationsController } from './reservations.controller';
import { DatabaseModule } from '@app/common';
import { ReservationsRepository } from './reservations.repository';
import { ReservationDocument, ReservationSchema } from './models/reservation.schema';

@Module({
  imports:[DatabaseModule, DatabaseModule.forFeature([
    {name: ReservationDocument.name,
      schema: ReservationSchema
    },
    
  ])],
  controllers: [ReservationsController],
  providers: [ReservationsService, ReservationsRepository],
})
export class ReservationsModule {}
~~~

- Ahora puedo inyectar el repositorio en el servicio

~~~js
import { Injectable } from '@nestjs/common';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { ReservationsRepository } from './reservations.repository';

@Injectable()
export class ReservationsService {

  constructor(
    private readonly reservationRepository: ReservationsRepository
  ){}

  create(createReservationDto: CreateReservationDto) {
    return 'This action adds a new reservation';
  }

  findAll() {
    return `This action returns all reservations`;
  }

  findOne(id: number) {
    return `This action returns a #${id} reservation`;
  }

  update(id: number, updateReservationDto: UpdateReservationDto) {
    return `This action updates a #${id} reservation`;
  }

  remove(id: number) {
    return `This action removes a #${id} reservation`;
  }
}
~~~

-En el create-dto pego todas las propiedades del reservationSchema
- No voy a necesitar el timestamp, lo generaré en el server
- Harcodeo el userId desde el servicio de momento, lo pongo opcional en el DTO para poder hacer el create 
- create-reservation.dto

~~~js
import { IsOptional, IsString } from "class-validator";

export class CreateReservationDto {
    @IsString()
    startDate: Date;
    
    @IsString()
    endDate: Date;
    
    @IsString()
    @IsOptional()
    userId: string;
    
    @IsString()
    placeId: string;
    
    @IsString()
    invoiceId: string;
}
~~~

- En el método create de reservations.service

~~~js
create(createReservationDto: CreateReservationDto) {
  return this.reservationRepository.create({
    ...createReservationDto, 
    timestamp: new Date(),
    userId: '123'})
}
~~~

- Hagamos el resto
- Para el find uso el modelo.find y le paso un objeto vacío sin filtros
- Cambio el id a _id y es un string
- Para el update hago lo mismo con el id
- Uso $set que me permite sobreescribir las propiedades, le paso el updateDto

~~~js
import { Injectable } from '@nestjs/common';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { ReservationsRepository } from './reservations.repository';

@Injectable()
export class ReservationsService {

  constructor(
    private readonly reservationRepository: ReservationsRepository
  ){}

  create(createReservationDto: CreateReservationDto) {
    return this.reservationRepository.create({
      ...createReservationDto, 
      timestamp: new Date(),
      userId: '123'})
  }

  findAll() {
    return this.reservationRepository.find({});
  }

  findOne(_id: string) {
    return this.reservationRepository.findOne({_id})
  }

  update(_id: string, updateReservationDto: UpdateReservationDto) {
    return this.reservationRepository.findOneAndUpdate(
      {_id},
      {$set: updateReservationDto}
    )
  }

  remove(_id: string) {
    return this.reservationRepository.findOneAndDelete({_id});
  }
}
~~~

- Voy al controller a corregir lo del id y quitarle el +

~~~js
import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';

@Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Post()
  create(@Body() createReservationDto: CreateReservationDto) {
    return this.reservationsService.create(createReservationDto);
  }

  @Get()
  findAll() {
    return this.reservationsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.reservationsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateReservationDto: UpdateReservationDto) {
    return this.reservationsService.update(id, updateReservationDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.reservationsService.remove(id);
  }
}
~~~

- Si voy a Postman debo pasarle un objeto como este en el método POST

~~~json
{
  "startDate": "12/20/2022",
  "endDate": "12/25/2022",
  "placeId":"12345",
  "invoiceId": "o3i2"
}
~~~

- **NOTA**: Importante!! Hay que instalar class-validator y class-transformer y hacer la configuración en el main
- Importo Logger de nestjs-pino en el main de reservations

~~~js
import { NestFactory } from '@nestjs/core';
import { ReservationsModule } from './reservations.module';
import { ValidationPipe } from '@nestjs/common';
import {Logger} from 'nestjs-pino'

async function bootstrap() {
  const app = await NestFactory.create(ReservationsModule);
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true
  }))
  app.useLogger(app.get(Logger))

  await app.listen(process.env.port ?? 3000);
}
bootstrap();
~~~

- En reservations.module debo importar el Logger de nestjs-pino y usar el forRoot

~~~js
import { Module } from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { ReservationsController } from './reservations.controller';
import { DatabaseModule } from '@app/common';
import { ReservationsRepository } from './reservations.repository';
import { ReservationDocument, ReservationSchema } from './models/reservation.schema';
import { LoggerModule } from 'nestjs-pino';

@Module({
  imports:[DatabaseModule, DatabaseModule.forFeature([
    {name: ReservationDocument.name,
      schema: ReservationSchema
    },
    
  ]),
  LoggerModule.forRoot()],
  controllers: [ReservationsController],
  providers: [ReservationsService, ReservationsRepository],
})
export class ReservationsModule {}
~~~

- Como se ve un poco feo instalo pino-pretty y lo configuro en el mismo reservations.module

~~~js
import { Module } from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { ReservationsController } from './reservations.controller';
import { DatabaseModule } from '@app/common';
import { ReservationsRepository } from './reservations.repository';
import { ReservationDocument, ReservationSchema } from './models/reservation.schema';
import { LoggerModule } from 'nestjs-pino';

@Module({
  imports:[DatabaseModule, DatabaseModule.forFeature([
    {name: ReservationDocument.name,
      schema: ReservationSchema
    },
    
  ]),
  LoggerModule.forRoot({
    pinoHttp:{
      transport:{
        target: 'pino-pretty',
        options:{
          singleLine: true
        }
      }
    }
  })],
  controllers: [ReservationsController],
  providers: [ReservationsService, ReservationsRepository],
})
export class ReservationsModule {}
~~~

- Si hago un GET el Logger me devuelve por consola algo así
- Cada log tiene un ID único

~~~
[17:52:18.681] INFO (7608): request completed {"req":{"id":1,"method":"GET","url":"/reservations","query":{},"params":{"0":"reservations"},"headers":{"content-length":"103","accept-encoding":"gzip, deflate, br","accept":"*/*","user-agent":"Thunder Client (https://www.thunderclient.com)","content-type":"application/json","host":"localhost:3000","connection":"close"},"remoteAddress":"::ffff:127.0.0.1","remotePort":62528},"res":{"statusCode":200,"headers":{"x-powered-by":"Express","content-type":"application/json; charset=utf-8","content-length":"427","etag":"W/\"1ab-YJizhaoEGmIsAJkun7zylDt6TDs\""}},"responseTime":15}
~~~

- Lo bueno de este logger es que da un error fácil de entender y acertado
- Pero de esta forma, si quiero reutilizar el Logger en otros microservicios voy a tener que copiar y pegar el mismo código
- Dentro de sleepr genero el módulo de logger / en common
- Lo que hago es abstraer el código que he implementado para el logger a su módulo de common
- common/src/logger/logger.module

~~~js
import { Module } from '@nestjs/common';
import {LoggerModule as PinoLoggerModule}  from 'nestjs-pino';

@Module({
    imports:[  PinoLoggerModule.forRoot({
        pinoHttp:{
          transport:{
            target: 'pino-pretty',
            options:{
              singleLine: true
            }
          }
        }
      })]
})
export class LoggerModule {}
~~~

- Creo un logger/index.ts

~~~js
export * from './logger.module'
~~~

- Y añado la exportación al common/index.ts

~~~js
export * from './database'
export * from './logger'
~~~

- Ahora solo tengo que importar el LoggerModule (de common, no de pino) en reservations.module

~~~js
import { Module } from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { ReservationsController } from './reservations.controller';
import { DatabaseModule } from '@app/common';
import { ReservationsRepository } from './reservations.repository';
import { ReservationDocument, ReservationSchema } from './models/reservation.schema';
import { LoggerModule } from '@app/common';

@Module({
  imports:[DatabaseModule, DatabaseModule.forFeature([
    {name: ReservationDocument.name,
      schema: ReservationSchema
    },
    
  ]),
  LoggerModule

],
  controllers: [ReservationsController],
  providers: [ReservationsService, ReservationsRepository],
})
export class ReservationsModule {}
~~~

- Vamos a mejorar el create-reservation.dto

~~~js
import { IsDate, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateReservationDto {
    @IsDate()
    startDate: Date;
    
    @IsDate()
    endDate: Date;
    
    /*
    @IsString()
    @IsOptional()
    userId: string;*/
    
    @IsString()
    @IsNotEmpty()
    placeId: string;
    
    @IsString()
    @IsNotEmpty()
    invoiceId: string;
}
~~~

- Al tiparlo como date al hacer un POST obtengo el error de que startDate y endDate no son una instancia de Date
- Para esto sirve el class-transformer, para transformar la data

~~~js
import { Type } from "class-transformer";
import { IsDate, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateReservationDto {
    @IsDate()
    @Type(()=> Date)
    startDate: Date;
    
    @IsDate()
    @Type(()=> Date)
    endDate: Date;
    
    /*
    @IsString()
    @IsOptional()
    userId: string;*/
    
    @IsString()
    @IsNotEmpty()
    placeId: string;
    
    @IsString()
    @IsNotEmpty()
    invoiceId: string;
}
~~~
-----

## Dockerizar reservations

- sleepr/apps/reservations/Dockerfile

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

CMD ["node", "dist/apps/reservations/main"]
~~~

- Para que no copie los node_modules creo el archivo sleepr/.dockerignore

~~~
node_modules/
dist
~~~

- Para hacer el build entro en apps/reservation, donde tengo el Dockerfile

> docker build ../../ -f Dockerfile -t sleepr_reservations
> docker run sleepr_reservations

- Compila, pero al ejecutarlo salta el error de MONGODB_URI is required
- Para esto usaremos docker-compose.yaml
- Sobreescribo el CMD del Dockerfile con command, fuera del contexto de build (menos una tabulación) para el hot reload
  - El hot reload es para que los cambios que haga en reservations se vean reflejados
- Guardaré en volumes el directorio donde estoy en /usr/src/app
- Para mongo, como lo estoy corriendo en local debo usar una imagen de mongo
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
  mongo:
    image: mongo 
~~~

- Ahora debo apuntar al servicio de docker desde la variable de entorno

~~~
MONGODB_URI=mongodb://mongo:27017/sleepr
~~~

- En sleeper/

> docker compose up

- Et voilà!