# 01 NEST MICROSERVICIOS - Gateway y manejo de errores

## Products

- Usaremos SQLite
- Empezaremos como una API REST

> nest new products-ms

- El app.controller y el app.service no los quiero para nada
- Creo el modulo de products dentro de products-ms
- Primero lo haremos REST API, luego lo transformaremos a microservicio

> nest g res products

- Empecemos por la product.entity

~~~js
export class Product {

    id: number

    name: string

    price: number

    avaliable: boolean

    createdAt: Date

    updatedAt: Date
}
~~~

- Instalo el class-validator y el class-transformer y lo configuro en el main

~~~js
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true
  }))

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
~~~

- El create-product.dto

~~~js
import { IsBoolean, IsNumber, IsOptional, IsString, Min } from "class-validator";

export class CreateProductDto {
    
    @IsString()
    public name: string

    @IsNumber({
        maxDecimalPlaces: 4
    })
    @Min(0)
    public price: number

    @IsBoolean()
    @IsOptional()
    public avaliable?: boolean
}
~~~

- Para las variables de entorno instalo **dotenv y joi** 
- config/envs.ts

~~~js
import 'dotenv/config'
import * as joi from 'joi'


interface EnvVars{
    PORT: number
    DATABASE_URL: string
}

const envsSchema = joi.object({
    PORT: joi.number().required(),
    DATABASE_URL: joi.string().required()    
})
.unknown(true) //hay muchas variables más del entorno como el path de node, etc


const {error, value}= envsSchema.validate(process.env)

if(error){
    throw new Error(`Config validation error: ${error.message}`)
}

const envVars: EnvVars = value


export const envs={
    port: envVars.PORT,
    databaseUrl: envVars.DATABASE_URL
}
~~~

- Recomendable crear un snippet con Easy Snippet
- En .env

~~~
PORT=3001
DATABASE_URL= "file:./dev.db"
~~~

- Instalo prisma
- Para inicar prisma

> npx prisma init

- Conveniente la extension de VSCode Prisma
- El lenguaje luce como JS pero no lo es, es propio de Prisma

~~~prisma
generator client {
  provider = "prisma-client-js"
  output   = "../generated/prisma"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model Product{
  id Int @id @default(autoincrement())
  name String
  price Float

  avaliable Boolean @default(true)

  createdAt DateTime @default(now())
  updateAt DateTime @updatedAt

  @@index([avaliable])
}
~~~

- Ejecuto la migración

> npx prisma migrate dev --name init

- Me crea la DB
- Instalo **@prisma/client**
- En el servicio implemento OnModuleInit de Nest

~~~js
import { Injectable, OnModuleInit } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaClient } from 'generated/prisma';

@Injectable()
export class ProductsService extends PrismaClient implements OnModuleInit{

  onModuleInit() {
    this.$connect() //Database connected!
  }
}
~~~

- Ya puedo empezar a trabajar con la DB
- Creo un logger para mejorar los logs

~~~js
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaClient } from 'generated/prisma';

@Injectable()
export class ProductsService extends PrismaClient implements OnModuleInit{

  private readonly logger = new Logger('ProductsService')

  onModuleInit() {
    this.$connect()
    this.logger.log('Database connected!!')
  }
}
~~~

- También lo uso en el main de la misma forma

~~~js
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { envs } from './config/envs';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const logger = new Logger('Main')

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true
  }))

  await app.listen(process.env.PORT ?? 3000);
  logger.log(`Products Microservice running on port ${envs.port}`)
}
bootstrap();
~~~

## Create

- El create en el ProductsService

~~~js
create(createProductDto: CreateProductDto) {
return this.product.create({
    data: createProductDto
})
}
~~~

- Para crear un producto en POST http://localhost:3001/products

~~~json
{
  "name": "Kombucha",
  "price": 120.2
}
~~~

- Me devuelve

~~~json
{
  "id": 1,
  "name": "Kombucha",
  "price": 120.2,
  "avaliable": true,
  "createdAt": "2025-06-25T14:21:38.249Z",
  "updateAt": "2025-06-25T14:21:38.249Z"
}
~~~

- Para ver la DB puedo crear la conexión en TablePlus e importar el archivo dev.db

## Obtener productos y paginarlos

- Creo el dto de paginación en common/pagination.dto.ts
- Le pongo valores por defecto

~~~js
import { Type } from "class-transformer"
import { IsOptional, IsPositive } from "class-validator"

export class PaginationDto{
    
    @IsPositive()
    @IsOptional()
    @Type(()=> Number)
    page?: number = 1

    @IsPositive()
    @IsOptional()
    @Type(()=> Number)
    limit?: number = 10
}
~~~

- Le paso el dto en el controller, lo extraigo de los params

~~~js
@Get()
  findAll(@Query() paginationDto:PaginationDto) {
    return this.productsService.findAll(paginationDto);
  }
~~~

- De esta forma le paso la info con una petición GET a /products?page=1&limit=20
- En el ProductsService

~~~js
async findAll(paginationDto: PaginationDto) {
    const {page, limit} = paginationDto

    const totalProducts = await this.product.count({where: {avaliable: true}})
    //divido el total de páginas (número de productos disponibles) por el limite
    //.ceil redondea al siguiente número positivo
    const lastPage = Math.ceil(totalProducts / limit!)

    return{
      data: await this.product.findMany({
        //skip = 0 * (limit = 10) 0 primera posición del arreglo, página tengo 1,2,3
        //si estoy en la página 2, (2-1 == 1) * limit == 10, skip 10 registros
        skip: (page!-1) * limit!,
        take: limit,
        where:{
          avaliable: true
        }
      }),
      //meta de metadata
      meta:{
        total: totalProducts,
        page: page,
        lastPage: lastPage
      }
    }
  }
~~~

## FindOne

~~~js
async findOne(id: number) {
    const product = await this.product.findFirst({
        where:{id, avaliable: true}
    })

    if(!product){
        throw new BadRequestException('Product not found!')
    }

    return product
}
~~~

## Update

- Uso PATCH /:id

~~~js
async update(id: number, updateProductDto: UpdateProductDto) {
   await this.findOne(id)

   return this.product.update({
    where: {id},
    data: updateProductDto
   })
  }
~~~

## Eliminación

- Por lo general no voy a borrar un producto porque no sé que relaciones tiene con otros microservicios
- Hago un borrado lógico

~~~js
async remove(id: number) {
    const product = await this.product.update({
        where: {id},
        data:{
        avaliable: false
        }
   })   

    return product
}
~~~

## Transformar a microservicio

- Instalo @nestjs/microservices
- Para crear el microservicio en el main creo app con NestFactory
- Le mando el AppModule y el objeto de configuración
- main.ts

~~~js
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { envs } from './config/envs';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
 
  const logger = new Logger('Main')
 
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.TCP, //elijo el tipo de transporte
      options:{
        port: envs.port //le paso el puerto
      }
    }
  );
  
  await app.listen();
  logger.log(`Products Microservice running on port ${envs.port}`)
}
bootstrap();
~~~

- Puedo usar **app.startAllMicroservices()** para inciar todos los microservicios
- Esto haría mi aplicación híbrida entre REST y Microservicios (**es compatible**)
- Si incio el server ya no aparecen en consola los GET, POST, etc
- Ya no estamos escuchando peticiones HTTP en ese puerto
- Para comunicarnos tenemos **los eventos y la mensajería**
- **@MessagePattern** es **"te envío la pelota, regresame la pelota con la info y ya puedo seguir con mi tarea"**
- **@EventPattern** es **"te mando el evento y lo que suceda ya es cosa tuya, me desentiendo y sigo con mi vida"**
- Ya no hay @Body, ni @Param, es todo **@Payload**
- Entonces el ProductsController luce así

~~~js
import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseIntPipe } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PaginationDto } from 'src/common/pagination.dto';
import { MessagePattern, Payload } from '@nestjs/microservices';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @MessagePattern({cmd: 'create_product'})
  create(@Payload() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @MessagePattern({cmd:'find_all_products'})
  findAll(@Payload() paginationDto:PaginationDto) {
    return this.productsService.findAll(paginationDto);
  }

  @MessagePattern({cmd:'find_one_product'})
  findOne(@Payload('id', ParseIntPipe) id: string) {
    return this.productsService.findOne(+id);
  }

  @MessagePattern({cmd:'update_product'})
  update(@Payload() updateProductDto: UpdateProductDto) {
    return this.productsService.update(updateProductDto);
  }

  @MessagePattern({cmd:'delete_product'})
  remove(@Payload('id', ParseIntPipe) id: string) {
    return this.productsService.remove(+id);
  }
}
~~~

- El dto para el update

~~~js
import { PartialType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create-product.dto';
import { IsNumber, IsPositive } from 'class-validator';

export class UpdateProductDto extends PartialType(CreateProductDto) {
    @IsNumber()
    @IsPositive()
    id: number
}
~~~

- Actualizo el método update en el ProductsServcie

~~~js
 async update(updateProductDto: UpdateProductDto) {
   const {id, ...data} = updateProductDto
   
   await this.findOne(id) //valido que el producto exista

   return await this.product.update({
    where: {id},
    data
   })
  }
~~~

- Cuando el microservicio A quiera comunicarse con el microservicio B deberá usar el **cmd:"loquesea"**
- Podría mantener el @Get, @Post, etc si fuera un híbrido, inciándolo con .startAllMicroservices
- Esto será útil con la autenticación, ya que puede ser una API u otro microservicio
- No tengo porque mandar el mensaje con cmd, puedo usar solo un string. El **standard es usar el objeto cmd y un string**
- Crearemos una API REST que servirá de **Gateway**
- Este Gateway se encargará de comunicar los diferentes microservicios

## Github Organization

- Podemos crear una organización para agrupar todos los microservicios
- En Github / Your Organizations / New Organization / Free Organization
- No invito a nadie (skip this step)
- Creo un nuevo repo

----
