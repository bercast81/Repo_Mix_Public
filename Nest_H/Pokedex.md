# NEST HERRERA - POKEDEX

## Contenido estático

- Instalación para servir contenido estático

> npm i @nestjs/serve-static

- Creo carpeta public en la raíz con un index.html
- Configuración en app.module.ts

~~~js
import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';


@Module({
  imports: [ServeStaticModule.forRoot({
    rootPath: join(__dirname, '..', 'public')
  })],
  controllers: [],
  providers: [],
})
export class AppModule {}
~~~

- Creo la API de pokemon

> nest g res pokemon

## Global prefix

- Global prefix en el main

~~~js
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v2')

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
~~~

## Docker MongoDB

- Creo docker-compose.yaml en la raíz

~~~yaml
version: '3'

services: 
  db: 
    image: mongo:5
    restart: always
    ports:
      - 27017:27017
    environment:
      - MONGODB_DATABASE=nest-pokemon
    volumes:
      - ./mongo:/data/db
~~~

> docker-compose up -d

- El string de conexión es **mongodb://localhost:27017/nest-pokemon**
- Puedo probarlo en TablePlus

## Conexión con Mongo

- Para conectar Nest con Mongo instalo

> npm i @nestjs/mongoose mongoose

- En app.module

~~~js
import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { PokemonModule } from './pokemon/pokemon.module';
import { MongooseModule } from '@nestjs/mongoose';


@Module({
  imports: [ServeStaticModule.forRoot({
    rootPath: join(__dirname, '..', 'public')
  }), 
  MongooseModule.forRoot('mongodb://localhost:27017/nest-pokemon'),
  PokemonModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
~~~

## Entity

- Creo la entidad
- pokemon/entities/pokemon.entity.ts

~~~js
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema()
export class Pokemon extends Document {

    @Prop({
        unique: true,
        index: true
    })
    name: string

    @Prop({
        unique: true,
        index: true
    })
    no: number
}

export const PokemonSchema = SchemaFactory.createForClass(Pokemon)
~~~

- Conecto la entidad con la DB
- pokemon.module.ts

~~~js
import { Module } from '@nestjs/common';
import { PokemonService } from './pokemon.service';
import { PokemonController } from './pokemon.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Pokemon, PokemonSchema } from './entities/pokemon.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
     {
       name: Pokemon.name,
      schema: PokemonSchema
     }
    ])
  ],
  controllers: [PokemonController],
  providers: [PokemonService],
})
export class PokemonModule {}
~~~

## POST- Recibir y validar data

- Para el dto instalo

> npm i class-validator class-transformer

- El dto create-pokemon

~~~js
import { IsNumber, IsPositive, IsString, Min, MinLength } from "class-validator"

export class CreatePokemonDto {

    @IsString()
    @MinLength(3)
    name: string

    @IsNumber()
    @IsPositive()
    @Min(1)
    no: number
}
~~~

- Para que se hagan las validaciones hago la configuración en el main

~~~js
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v2')
  
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true
    })
  )

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
~~~

## Inyectar Modelo en el servicio

~~~js
import { Injectable } from '@nestjs/common';
import { CreatePokemonDto } from './dto/create-pokemon.dto';
import { UpdatePokemonDto } from './dto/update-pokemon.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Pokemon } from './entities/pokemon.entity';
import { Model } from 'mongoose';

@Injectable()
export class PokemonService {


  constructor(
    @InjectModel(Pokemon.name)
    private readonly pokemonModel: Model<Pokemon>
  ){}


  async create(createPokemonDto: CreatePokemonDto) {
    createPokemonDto.name = createPokemonDto.name.toLowerCase()
    const pokemon = await this.pokemonModel.create(createPokemonDto)
    return pokemon
  }
}
~~~

- Con ThunderClient, método POST, en la url http://localhost:3000/api/v2/pokemon, en el body agrego

~~~json
{
  "name": "Bulbasur",
  "no": 1
}
~~~

- Me retorna

~~~json
{
  "name": "bulbasur",
  "no": 1,
  "_id": "683420eb0a4e5b0c3dfd363e",
  "__v": 0
}
~~~

- En el método create puedo usar un try catch
- pokemon.service.ts

~~~js
async create(createPokemonDto: CreatePokemonDto) {
    createPokemonDto.name = createPokemonDto.name.toLowerCase()

    try {
      const pokemon = await this.pokemonModel.create(createPokemonDto)
      return pokemon
      
    } catch (error) {
      if(error.code === 11000) throw new BadRequestException(`Pokemon exists in db ${JSON.stringify(error.keyValue)}`)
      console.log(error)

      throw new InternalServerErrorException("Can't create pokemon - Check server logs")
    }  
  }
~~~

- Puedo alterar el valor de respuesta con el decorador @HttpCode en el controller y usar HttpStatus (o el número directamente, 200)

~~~js
@Post()
  @HttpCode(HttpStatus.OK)
  create(@Body() createPokemonDto: CreatePokemonDto) {
    return this.pokemonService.create(createPokemonDto);
  }
~~~

## findOne

- Hay 3 identificadores: el nombre, el número y el id de mongo
- Hay que validar que sea un id de mongo válido con isValidObjectId de mongoose
- Uso el id como string para hacer las validaciones y lo parseo a numero si es necesario
- En el controller

~~~js
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.pokemonService.findOne(id);
  }
~~~

- En el servicio

~~~js
 async findOne(id: string) {
    let pokemon: Pokemon | null = null

    if(!isNaN(+id)){
      pokemon = await this.pokemonModel.findOne({no:id})
    }

    if(!pokemon && isValidObjectId(id)){
      pokemon = await this.pokemonModel.findById(id)
    }

    if(!pokemon){
      pokemon = await this.pokemonModel.findOne({name: id.toLowerCase().trim()})
    }

    if(!pokemon) throw new NotFoundException("Pokemon not found")

      return pokemon
  }          
~~~

- De esta manera puedo buscar por número, id o nombre

## Actualizar Pokemon

- Si intento actualizar el número de un pokemon que ya existe con otro nombre me devuelve error 11000 (de valor duplicado)
- pokemon.service.ts

~~~js
  async update(id: string, updatePokemonDto: UpdatePokemonDto) {
    let pokemon = await this.findOne(id)

    if(updatePokemonDto.name){
      updatePokemonDto.name = updatePokemonDto.name.toLowerCase()
    }

    try {
      await pokemon.updateOne(updatePokemonDto)
      return {...pokemon.toJSON(), ...updatePokemonDto} 

    } catch (error) {
        if(error.code === 11000) throw new BadRequestException(`Pokemon exists in db ${JSON.stringify(error.keyValue)}`)
      
        console.log(error) //para debuggear

        throw new InternalServerErrorException("Can't create pokemon - Check server logs")
    }   
  }
~~~

## Método del servicio para manejar errores

- pokemon.service.ts

~~~js
private handleExceptions(error:any){
if(error.code = 11000){
    throw new BadRequestException(`Pokemon exists in db ${JSON.stringify(error.keyValue)}`)
}
    throw new InternalServerErrorException("Can't create pokemon - Check server logs")
}
~~~

- Lo uso en el catch
- pokemon.service.ts

~~~js
async update(id: string, updatePokemonDto: UpdatePokemonDto) {
    let pokemon = await this.findOne(id)

    if(updatePokemonDto.name){
      updatePokemonDto.name = updatePokemonDto.name.toLowerCase()
    }

    try {
      await pokemon.updateOne(updatePokemonDto)
      return {...pokemon.toJSON(), ...updatePokemonDto}     
    } catch (error) {
        this.handleExceptions(error)
    }   
  }
~~~

## Eliminar un Pokemon

- pokemon.service.ts

~~~js
async remove(id: string) {
const pokemon = await this.findOne(id)
await pokemon.deleteOne()
}
~~~

- Quiero implementar la lógica para que solo se pueda borrar con el id de mongo

## Implementar la lógica para tener que usar un id de Mongo para borrar un Pokemon

- Creo el módulo de common, uso el CLI

> nest g mo common

- Uso el CLI para crear el custom Pipe de Mongo. El CLI me añade Pipe al final

> nest g pi common/pipes/parseMongoId

- Esto me crea el esqueleto del pipe
- Coloco el pipe en el controlador @Delete
- pokemon.controller.ts

~~~js
@Delete(':id')
remove(@Param('id', ParseMongoIdPipe) id: string) {
return this.pokemonService.remove(id);
}
~~~

- Hago un console.log del value y la metadata en el Pipe
- parse-mongo-id-pipe

~~~js
import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class ParseMongoIdPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    console.log({value, metadata})
  }
}
~~~

- Como id en la url le paso un 1 me devuelve esto (habiendo comentado el código del delete en el servicio)

~~~js
{
  value: '1',
  metadata: { metatype: [Function: String], type: 'param', data: 'id' }
}
~~~

- Uso el isValidObjectId para hacer la validación 
- parse-mongo-id.pipe

~~~js
import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { isValidObjectId } from 'mongoose';

@Injectable()
export class ParseMongoIdPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    if(!isValidObjectId(value)){
      throw new BadRequestException(`${value} is not a valid MongoID`)
    }

    return value
  }
}
~~~

- pokemon.service.ts

~~~js
async remove(id: string) {
    const pokemon = await this.pokemonModel.findByIdAndDelete(id)
    return pokemon
  }
~~~

- Hecho así, si envío un ID válido pero no lo encuentra me devolverá un 200 igual
- Uso deletedCount en la desestructuración de deleteOne para validar

~~~js
async remove(id: string) {
const {deletedCount} = await this.pokemonModel.deleteOne({_id:id})

    if(deletedCount === 0){
    throw new BadRequestException(`Pokemon with id ${id} not found`)
    }

    return
}
~~~

## SEED

- Creo la API del SEED con los entry points

> nest g res seed --no-spec

- Instalo axios

> npm i axios

- Me traigo 500 pokemons de pokeapi que insertaré en la DB

> https://pokeapi.co/api/v2/pokemon?limit=500

- seed.service

~~~js
import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class SeedService {

  private readonly axios:AxiosInstance = axios;

  async executeSEED(){
    const {data} = await this.axios.get("https://pokeapi.co/api/v2/pokemon?limit=500");
    
    return data;
  }  
}
~~~

- El controller

~~~js
import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { SeedService } from './seed.service';
import { CreateSeedDto } from './dto/create-seed.dto';
import { UpdateSeedDto } from './dto/update-seed.dto';

@Controller('seed')
export class SeedController {
  constructor(private readonly seedService: SeedService) {}

 @Get()
 executeSEED(){
  return this.seedService.executeSEED()
 }
}
~~~

- Saco la interfaz del resultado con PasteJSONAsCode
- seed/interfaces/poke-response.interface.ts

~~~js
export interface PokeResponse {
    count:    number;
    next:     string;
    previous: null;
    results:  Result[];
}

export interface Result {
    name: string;
    url:  string;
}
~~~

- Si añado el tipo a la petición get de Axios tengo el tipado
- El número de id del pokemon está en la penúltima posición de la url
- seed.service.ts

~~~js
import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { PokeResponse } from './interfaces/poke-response.interface';

@Injectable()
export class SeedService {

  private readonly axios:AxiosInstance = axios;

  async executeSEED(){
    const {data} = await this.axios.get<PokeResponse>("https://pokeapi.co/api/v2/pokemon?limit=500");
    
    data.results.forEach(({name,url})=>{
      const segments = url.split('/')
      const no:number =+segments[segments.length -2]

      console.log({name, no})
    })
    
    return data;
  } 
}
~~~

## Insertar Pokemons

- Inyecto el modelo en el SeedService
- Para ello debo exportarlo del pokemon.module

~~~js
import { Module } from '@nestjs/common';
import { PokemonService } from './pokemon.service';
import { PokemonController } from './pokemon.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Pokemon, PokemonSchema } from './entities/pokemon.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
     {
       name: Pokemon.name,
      schema: PokemonSchema
     }
    ])
  ],
  controllers: [PokemonController],
  providers: [PokemonService],
  exports:[MongooseModule]
})
export class PokemonModule {}
~~~

- Debo importar el módulo de Pokemon en seed.module.ts

~~~js
import { Module } from '@nestjs/common';
import { SeedService } from './seed.service';
import { SeedController } from './seed.controller';
import { PokemonModule } from 'src/pokemon/pokemon.module';

@Module({
  imports: [PokemonModule],
  controllers: [SeedController],
  providers: [SeedService],
})
export class SeedModule {}
~~~

- Inyecto el módulo en el SeedService e inserto los pokemons en la DB

~~~js
import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { PokeResponse } from './interfaces/poke-response.interface';
import { InjectModel } from '@nestjs/mongoose';
import { Pokemon } from 'src/pokemon/entities/pokemon.entity';
import { Model } from 'mongoose';

@Injectable()
export class SeedService {
  private readonly axios:AxiosInstance = axios;

  constructor(
    @InjectModel(Pokemon.name)
    private readonly pokemonModel: Model<Pokemon>
  ){}

  async executeSEED(){
    const {data} = await this.axios.get<PokeResponse>("https://pokeapi.co/api/v2/pokemon?limit=10");
    
    data.results.forEach(async ({name,url})=>{
      const segments = url.split('/')
      const no:number =+segments[segments.length -2]
      console.log({name, no})
      const pokemon = await this.pokemonModel.create({name,no})
    })

    return 'Seed executed';
  } 
}
~~~

- Si tuviera que hacer miles de inserciones demoraría mucho tiempo

## Insertar múltiples registros simultáneamente

~~~js
import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { PokeResponse } from './interfaces/poke-response.interface';
import { InjectModel } from '@nestjs/mongoose';
import { Pokemon } from 'src/pokemon/entities/pokemon.entity';
import { Model } from 'mongoose';

@Injectable()
export class SeedService {
  private readonly axios:AxiosInstance = axios;

  constructor(
    @InjectModel(Pokemon.name)
    private readonly pokemonModel: Model<Pokemon>
  ){}

  async executeSEED(){
    await this.pokemonModel.deleteMany({});

    const {data} = await this.axios.get<PokeResponse>("https://pokeapi.co/api/v2/pokemon?limit=10");
    
    const pokemonToInsert: {name: string, no: number}[]= [] ;

    data.results.forEach(async ({name,url})=>{
      const segments = url.split('/')
      const no:number =+segments[segments.length -2]
   
   pokemonToInsert.push({name, no})
    })

    await this.pokemonModel.insertMany(pokemonToInsert)

    return 'Seed executed';
  } 
}
~~~

## Crear un Custom provider (Patrón Adaptador)

- Creo la carpeta common/**interfaces**/http-adapter.interface.ts

~~~js
export interface HttpAdapter{
    get<T>(url:string): Promise<T>
}
~~~

- Creo la carpeta common/**adapters**/axios.adapter.ts

~~~js
import axios, { AxiosInstance } from "axios"
import { HttpAdapter } from "../interfaces/http-adapter.interface"


export class AxiosAdapter implements HttpAdapter{
    private axios: AxiosInstance = axios;

    async get<T>(url: string): Promise<T>{
        try {
            const {data}= await this.axios.get<T>(url)
            return data;
            
        } catch (error) {
            throw new Error('This is an error - Check logs')
        }
    }

}
~~~

- Los providers están **a nivel de módulo**
- common.module.ts

~~~js
import { Module } from '@nestjs/common';
import { AxiosAdapter } from './adapters/axios.adapter';

@Module({
    providers: [AxiosAdapter],
    exports:[AxiosAdapter]
})
export class CommonModule {}
~~~

- Importo el common.module en el módulo de seed

~~~js
import { Module } from '@nestjs/common';
import { SeedService } from './seed.service';
import { SeedController } from './seed.controller';
import { PokemonModule } from 'src/pokemon/pokemon.module';
import { CommonModule } from 'src/common/common.module';

@Module({
  imports: [PokemonModule, CommonModule],
  controllers: [SeedController],
  providers: [SeedService],
})
export class SeedModule {}
~~~

- Inyecto el AxiosAdapter en el seed.service.ts

~~~js
import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { PokeResponse } from './interfaces/poke-response.interface';
import { InjectModel } from '@nestjs/mongoose';
import { Pokemon } from 'src/pokemon/entities/pokemon.entity';
import { Model } from 'mongoose';
import { AxiosAdapter } from 'src/common/adapters/axios.adapter';

@Injectable()
export class SeedService {

  constructor(
    @InjectModel(Pokemon.name)
    private readonly pokemonModel: Model<Pokemon>,
    private readonly http: AxiosAdapter
  ){}

  async executeSEED(){
    await this.pokemonModel.deleteMany({});

    const data = await this.http.get<PokeResponse>("https://pokeapi.co/api/v2/pokemon?limit=10");
    
    const pokemonToInsert: {name: string, no: number}[]= [] ;

    data.results.forEach(async ({name,url})=>{
      const segments = url.split('/')
      const no:number =+segments[segments.length -2]
    pokemonToInsert.push({name, no})
    })

    await this.pokemonModel.insertMany(pokemonToInsert)

    return 'Seed executed';
  } 
}
~~~

## Paginación

- Para obtener 5 pokemons lo haría así

~~~js
async findAll(){
  return await this.pokemonModel.find()
  .limit(5)
  .skip(5)
}
~~~

- Obtengo los query parameters con el decorador **@Query** en el pokemon.controller

~~~js
@Get()
  findAll(@Query() paginationDto:PaginationDto) {
    return this.pokemonService.findAll(paginationDto);
  }
~~~

- common/dtos/pagination.dto

~~~js
import { IsNumber, IsOptional, IsPositive, Min } from "class-validator"

export class PaginationDto{
    
    @IsNumber()
    @IsPositive()
    @IsOptional()
    @Min(1)
    limit?: number
    
    
    @IsNumber()
    @IsPositive()
    @IsOptional()
    offset?: number 
}
~~~

- Para transformar a número el string del query uso transform en el ValidationPipe del main

~~~js
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v2')
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions:{
        enableImplicitConversion: true
      }
    })
  )

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
~~~

- Desestructuro del dto en el servicio

~~~js
async findAll(paginationDto: PaginationDto) {
    const {limit=10, offset=0}= paginationDto;
    
    return await this.pokemonModel.find()
      .limit(limit)
      .skip(offset)
      .sort({
        no:1 //ordeno la columna no de manera ascendente
      })
  }
~~~

## Variables de entorno

- Añado ConfigModule en app.module
- Instalo

> npm i @nestjs/config

~~~js
import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { PokemonModule } from './pokemon/pokemon.module';
import { MongooseModule } from '@nestjs/mongoose';
import { CommonModule } from './common/common.module';
import { SeedModule } from './seed/seed.module';
import { ConfigModule } from '@nestjs/config';


@Module({
  imports: [
    ConfigModule.forRoot(),
    ServeStaticModule.forRoot({
    rootPath: join(__dirname, '..', 'public')
  }), 
  MongooseModule.forRoot('mongodb://localhost:27017/nest-pokemon'),
  PokemonModule,
  CommonModule,
  SeedModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
~~~

- Para usar las variables solo tengo que escribir process.env.VARIABLE
- Creo app.config.ts

~~~js
export const EnvConfiguration=()=>({
    environment: process.env.NODE_ENV || 'dev',
    mongodb: process.env.MONGODB,
    port: process.env.PORT || 3001,
    defaultLimit: process.env.DEFAULT_LIMIT || 5
})
~~~

.env

~~~
NODE_ENV=dev
MONGODB=mongodb://localhost:27017/nest-pokemon
PORT=3000
DEFAULT_LIMIT=5
~~~

- Le digo a ConfigModule que lo cargue

~~~js
import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { PokemonModule } from './pokemon/pokemon.module';
import { MongooseModule } from '@nestjs/mongoose';
import { CommonModule } from './common/common.module';
import { SeedModule } from './seed/seed.module';
import { ConfigModule } from '@nestjs/config';
import { EnvConfiguration } from './app.config';


@Module({
  imports: [
    ConfigModule.forRoot({
      load: [EnvConfiguration]
    }),
    ServeStaticModule.forRoot({
    rootPath: join(__dirname, '..', 'public')
  }), 
  MongooseModule.forRoot('mongodb://localhost:27017/nest-pokemon'),
  PokemonModule,
  CommonModule,
  SeedModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
~~~

- Inyecto el ConfigService de @nestjs/config en el pokemon.service

~~~js
import { ConfigService } from '@nestjs/config';


@Injectable()
export class PokemonService {


  constructor(
    @InjectModel(Pokemon.name)
    private readonly pokemonModel: Model<Pokemon>,
    private readonly configService: ConfigService
  ){}
  
  {...code}
}
~~~

- Debo importar el ConfigModule en pokemon.module

~~~js
import { Module } from '@nestjs/common';
import { PokemonService } from './pokemon.service';
import { PokemonController } from './pokemon.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Pokemon, PokemonSchema } from './entities/pokemon.entity';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
     {
       name: Pokemon.name,
      schema: PokemonSchema
     }
    ])
  ],
  controllers: [PokemonController],
  providers: [PokemonService],
  exports:[MongooseModule]
})
export class PokemonModule {}
~~~

- Puedo inicializar la variable de entorno en el servicio

~~~js
import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreatePokemonDto } from './dto/create-pokemon.dto';
import { UpdatePokemonDto } from './dto/update-pokemon.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Pokemon } from './entities/pokemon.entity';
import { isValidObjectId, Model } from 'mongoose';
import { PaginationDto } from 'src/common/dtos/pagination.dto';
import { ConfigService } from '@nestjs/config';


@Injectable()
export class PokemonService {

  private defaultLimit: number | undefined;

  constructor(
    @InjectModel(Pokemon.name)
    private readonly pokemonModel: Model<Pokemon>,
    private readonly configService: ConfigService
  ){
    this.defaultLimit = this.configService.get<number>('defaultLimit')
  }

  async findAll(paginationDto: PaginationDto) {
    const {limit=this.defaultLimit, offset=0}= paginationDto;
    return await this.pokemonModel.find()
      .limit(limit!)
      .skip(offset)
      .sort({
        no:1
      })
  }

  {...code}
}
~~~

## Joi

- Instalo Joi

> npm i joi

- Creo el ValidationSchema joi-validation.schema.ts

~~~js
import * as Joi from 'joi'


export const joiValidationSchema = Joi.object({
    MONGODB: Joi.required(),
    PORT: Joi.number().default(3001),
    DEFAULT_LIMIT: Joi.number().default(5)
})
~~~

- Lo agrego a app.module

~~~js
import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { PokemonModule } from './pokemon/pokemon.module';
import { MongooseModule } from '@nestjs/mongoose';
import { CommonModule } from './common/common.module';
import { SeedModule } from './seed/seed.module';
import { ConfigModule } from '@nestjs/config';
import { EnvConfiguration } from './app.config';
import { joiValidationSchema } from './joi-validation.schema';


@Module({
  imports: [
    ConfigModule.forRoot({
      load: [EnvConfiguration],
      validationSchema: joiValidationSchema
    }),
    ServeStaticModule.forRoot({
    rootPath: join(__dirname, '..', 'public')
  }), 
  MongooseModule.forRoot('mongodb://localhost:27017/nest-pokemon'),
  PokemonModule,
  CommonModule,
  SeedModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
~~~

- Parseo a número las variables de entorno, le agrego ! para que no dé error

~~~js
export const EnvConfiguration=()=>({
    environment: process.env.NODE_ENV || 'dev',
    mongodb: process.env.MONGODB,
    port: +process.env.PORT! || 3001,
    defaultLimit: +process.env.DEFAULT_LIMIT! || 5
})
~~~

## Dockerizar app

- Borro la db de Docker
- Creo el Dockerfile en la raíz

~~~Dockerfile
# Etapa 1: Instalación de dependencias
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Etapa 2: Construcción del proyecto
FROM node:22-alpine AS builder
WORKDIR /app
COPY . .
COPY --from=deps /app/node_modules ./node_modules
RUN npm run build

# Etapa 3: Runner
FROM node:22-alpine AS runner
WORKDIR /usr/src/app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
CMD ["node", "dist/main"]

~~~

- .dockerignore

~~~
dist/
node_modules/
.gitignore
.git/
mongo/
~~~

- docker-compose.prod.yaml

~~~yaml
services:
  pokedexapp:
    depends_on:
      - db
    build:
      context: .
      dockerfile: Dockerfile
    image: pokedex-dockerfile
    container_name: pokedexapp
    restart: always
    ports:
      - "${PORT}:${PORT}"
    environment:
      MONGODB: ${MONGODB}
      PORT: "${PORT}"
      DEAFULT_LIMIT: ${DEFAULT_LIMIT}
  db:
    image: mongo:5
    container_name: mongo-poke
    restart: always
    ports:
      - 27017:27017
    environment:
      MONGO_DATABASE: nest-pokemon
    volumes:
      - ./mongo:/data/db
~~~

- Creo el .env.prod con el string de conexión apuntando al container y el puerto del docker-compose

~~~
NODE_ENV=prod
MONGODB=mongodb://mongo-poke:27017/nest-pokemon
PORT=3000
DEFAULT_LIMIT=5
~~~

- Para construir la imagen

> docker-compose -f docker-compose.prod.yaml --env-file .env.prod up --build

- Para usar la imagen

> docker-compose -f docker-compose.prod.yaml --env-file .env.prod up

- **NOTA**: Recuerda usar las variables de entorno! Por ejemplo en app.module con el string de conexión

~~~js
import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { PokemonModule } from './pokemon/pokemon.module';
import { MongooseModule } from '@nestjs/mongoose';
import { CommonModule } from './common/common.module';
import { SeedModule } from './seed/seed.module';
import { ConfigModule } from '@nestjs/config';
import { EnvConfiguration } from './app.config';
import { joiValidationSchema } from './joi-validation.schema';


@Module({
  imports: [
    ConfigModule.forRoot({
      load: [EnvConfiguration],
      validationSchema: joiValidationSchema
    }),
    ServeStaticModule.forRoot({
    rootPath: join(__dirname, '..', 'public')
  }), 
  MongooseModule.forRoot(process.env.MONGODB!), //AQUI!
  PokemonModule,
  CommonModule,
  SeedModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
~~~

- Está exponiendo el puerto 3000, por lo que el endpoint seguirá siendo http://localhost:3000/api/v2/pokemon
-------
