# 03 NEST_MS - Orders

- Trabajarenos con Postgres
- Las órdenes solo serán el header de las órdenes
- En otro microservicio con Mongo tendremos el detalle
- Creo con **nest new orders-ms** el microservicio de orders
- Elimino el app.controller y el app.service
- Instalo dotenv, joi, @nestjs/microservices, class-transformer y class-validator
- Dentro creo orders con **nest g res orders** (selecciono microservices)
- Creo orders-ms/src/config/envs.ts

~~~js
import 'dotenv/config'
import * as joi from 'joi'


interface EnvVars{
    PORT: number
}

const envsSchema = joi.object({
    PORT: joi.number().required(),
        
})
.unknown(true) //hay muchas variables más del entorno como el path de node, etc


const {error, value}= envsSchema.validate(process.env)

if(error){
    throw new Error(`Config validation error: ${error.message}`)
}

const envVars: EnvVars = value


export const envs={
    port: envVars.PORT
}
~~~

- Coloco PORT en .env

~~~
PORT=3002
~~~

- Configuro el main.ts, creo un logger

~~~js
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { envs } from './config/envs';
import { Logger, ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('OrdersMS-main')
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.TCP,
      options:{
        port: envs.port
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

## Conectar Gateway con orders

- En el gateway genero la API Orders con nest g res orders
- La entity no la voy a usar, el servicio tampoco
- En /config/services.ts creo el token de inyección

~~~js
export const PRODUCTS_SERVICE= 'PRODUCTS_SERVICE'
export const ORDERS_SERVICE= 'ORDERS_SERVICE'
~~~

- Actualizo las variables de entorno en gateway/src/config/envs.ts

~~~js
import 'dotenv/config'
import * as joi from 'joi'


interface EnvVars{
    PRODUCTS_MICROSERVICE_HOST: string
    PRODUCTS_MICROSERVICE_PORT: number,
    ORDERS_MICROSERVICE_HOST: string,
    ORDERS_MICROSERVICE_PORT: number
}

const envsSchema = joi.object({
    PRODUCTS_MICROSERVICE_HOST: joi.string().required(),
    PRODUCTS_MICROSERVICE_PORT: joi.number().required(),
    ORDERS_MICROSERVICE_HOST: joi.string().required(),
    ORDERS_MICROSERVICE_PORT: joi.number().required()    
})
.unknown(true) //hay muchas variables más del entorno como el path de node, etc


const {error, value}= envsSchema.validate(process.env)

if(error){
    throw new Error(`Config validation error: ${error.message}`)
}

const envVars: EnvVars = value


export const envs={
    productsMicroserviceHost: envVars.PRODUCTS_MICROSERVICE_HOST,
    productsMicroservicePort: envVars.PRODUCTS_MICROSERVICE_PORT,
    ordersMicroserviceHost: envVars.ORDERS_MICROSERVICE_HOST,
    ordersMicroServicePort: envVars.ORDERS_MICROSERVICE_PORT
}
~~~

- En el .env del gateway

~~~
PRODUCTS_MICROSERVICE_HOST=localhost
PRODUCTS_MICROSERVICE_PORT=3001
ORDERS_MICROSERVICE_HOST=localhost
ORDERS_MICROSERVICE_PORT=3002
~~~

- Registro el microservicio en gateway/orders/orders.module

~~~js
import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { envs, ORDERS_SERVICE } from 'src/config';

@Module({
  imports:[
    ClientsModule.register([
      {
        name: ORDERS_SERVICE,
        transport: Transport.TCP,
        options:{
          host: envs.ordersMicroserviceHost,
          port: envs.ordersMicroServicePort 
        }
      }
    ])
  ],
  controllers: [OrdersController],
  providers: [],
})
export class OrdersModule {}
~~~

- Inyecto el microservicio en el gateway/src/orders/orders.controller
- Voy a usar solo strings en lugar del objeto cmd para comunicarme con el microservicio
- Entonces el orders-ms/src/orders.controller está así

~~~js
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { ChangeOrderStatusDto } from './dto/change-order.dto';
import { OrderPaginationDto } from './dto/order-pagination.dto';

@Controller()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @MessagePattern('createOrder')
  create(@Payload() createOrderDto: CreateOrderDto) {
    return this.ordersService.create(createOrderDto);
  }

  @MessagePattern('findAllOrders')
  findAll(@Payload() orderPaginationDto: OrderPaginationDto) {
    return this.ordersService.findAll(orderPaginationDto);
  }

  @MessagePattern('findOneOrder')
  findOne(@Payload() payload:{id: string}) { //recibe un objeto con el id
    return this.ordersService.findOne(payload.id);
  }

  @MessagePattern('changeOrderStatus')
  changeOrderStatus(@Payload() changeOrderStatusDto: ChangeOrderStatusDto) {
    return this.ordersService.changeOrderStatus(changeOrderStatusDto);
  }
}
~~~

- Creo en el orders.service el método changeOrderStatus pasándole el dto para que no de error
- El orders-ms/src/dtos/change-order.dto.ts

~~~js
import { IsString, IsUUID } from "class-validator"

export class ChangeOrderStatusDto{
    @IsUUID()
    id: string

    @IsString()
    status: string
}
~~~

- El orders-ms/create-order.dto lo haremos luego, cuando tengamos la conexión a la DB
- El gateway/src/orders/orders.controller así (inyecto el servicio)

~~~js
import { Controller, Get, Post, Body, Patch, Param, Inject, Query, ParseUUIDPipe } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { ORDERS_SERVICE } from 'src/config';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { PaginationDto } from 'src/common/pagination.dto';
import { firstValueFrom } from 'rxjs';
import { StatusDto } from 'src/common/status.dto';

@Controller('orders')
export class OrdersController {
  constructor(
    @Inject(ORDERS_SERVICE)
    private readonly ordersClient: ClientProxy
  ) {}

  @Post()
  create(@Body() createOrderDto: CreateOrderDto) {
   return this.ordersClient.send('createOrder', createOrderDto)
  }

  @Get()
  findAll( @Query() paginationDto: PaginationDto) {
   return this.ordersClient.send('findAllOrders', paginationDto)
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const order= await firstValueFrom(
        this.ordersClient.send('findOneOrder', {id})
      )

      return order
      
    } catch (error) {
      throw new RpcException(error)
    }
  }

  @Patch(':id')
  async changeStatus(
    @Param('id', ParseUUIDPipe) id: string, 
    @Body() statusDto: StatusDto) {
    try {
      return this.ordersClient.send('changeOrderStatus', {id, status: statusDto.status})
    } catch (error) {
      throw new RpcException(error)
    }
  }

  @Get(':status')
  async findAllByStatus(
    @Param() statusDto: StatusDto,
    @Query() paginationDto: PaginationDto
  ){
    try {
        return this.ordersClient.send('findAllOrders',
          {...paginationDto,
            status: statusDto.status
          }
        )
    } catch (error) {
      throw new RpcException(error)
    }
  }
}
~~~

- El gateway/src/common/status.dto

~~~js
import { IsString } from "class-validator";

export class StatusDto{
    
    @IsString()
    status: string
}
~~~

## Docker - Levantar Postgres

- En la raíz de orders-ms creo el docker-compose.yml
- Le digo que enlace mi carpeta postgres de mi fileSystem con la ruta del contenedor
- Pongo un puerto que no esté ocupado
- No uso variables de entorno poruq een producción no voy a usar Docker, voy a usar algún servicio
- orders-ms/docker-compose.yml

~~~yml
version: '3'

services:
  orders-db:
    container_name: orders_database
    image: postgres:latest
    restart: always
    volumes:
      - ./postgres:/var/lib/postgresql/data
    ports:
      - 5432:5432
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=123456
      - POSTGRES_DB=ordersdb
~~~

- Ejecuto (con Docker corriendo)

> docker-compose up -d

- En .gitignore coloco /postgres
- Me puedo conectar con TablePlus
- Vamos con Prisma

## Modelo y conexión

- Instalo prisma 

> npm i prisma
> npx prisma init

- Cambio la url de conexión generada por la mia
- .env

~~~
PORT=3002
DATABASE_URL="postgresql://postgres:123456@localhost:5432/ordersdb?schema=public"
~~~

- Instalo el cliente de prisma

> npm i @prisma/client

- Creo el schema en Prisma
- Creo un enum con los status
- Creo el modelo

~~~prisma
generator client {
  provider = "prisma-client-js"
  output   = "../generated/prisma"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum OrderStatus {
  PENDING
  DELIVERED
  CANCELED
}

model Order {
  id            String  @id  @default(uuid())
  totalAmount   Float
  totalItems    Int
  status        OrderStatus
  paid Boolean  @default(false)
  paidAt        DateTime? //lleva ? porque puede ser null

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
~~~

- Quizá sería más conveniente crear otra tabla con las pagadas y añadir el paidAt (para no tener valores null)
- Ejecuto el comando

> npx prisma migrate dev --name init

- Ya puedo visualizar los campos de OrdersDB en TablePlus
- Creo un logger en el servicio de orders-ms e implemento PrismaClient

~~~js
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { ChangeOrderStatusDto } from './dto/change-order.dto';
import { OrderPaginationDto } from './dto/order-pagination.dto';
import { PrismaClient } from 'generated/prisma';

@Injectable()
export class OrdersService extends PrismaClient implements OnModuleInit{

  private readonly logger = new Logger("OrdersService")

  async onModuleInit() {
    await this.$connect()
    this.logger.log("Database connected!!")
  }
}
~~~

## Crear una nueva orden

- Configuro en el main el uso de class-validator y class-transformer si no lo he hecho ya

~~~js
app.useGlobalPipes(new ValidationPipe({
  whitelist: true, 
  forbidNonWhitelisted: true,
  transform: true
}))
~~~

- El CreateOrderDto (orders-ms)

~~~js
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsPositive } from "class-validator"
import { OrderStatus } from "generated/prisma"
import { OrderStatusList } from "src/common/enums/orders.enum"


export class CreateOrderDto {
    
    @IsNumber()
    @IsPositive()
    totalAmount: number

    @IsNumber()
    @IsPositive()
    totalItems: number

    @IsEnum( OrderStatusList, {
        message:`Possible status values are ${OrderStatusList}`
    })
    @IsOptional()
    status: OrderStatus = OrderStatus.PENDING

    @IsBoolean()
    @IsOptional()
    paid: boolean = false 
}
~~~

- El enum en orders-ms/common/enums/orders.enum.ts uso el enum que creé en el schema de Prisma

~~~js
import { OrderStatus } from "generated/prisma";


export const OrderStatusList = [
    OrderStatus.PENDING,
    OrderStatus.DELIVERED,
    OrderStatus.CANCELED
]
~~~

- Copio este archivo (orders.enum.ts) en el gateway/src/common/enums

~~~js
export enum OrderStatus{
    PENDING =  'PENDING',
    DELIVERED= 'DELIVERED',
    CANCELED=  'CANCELED'
}

export const OrderStatusList = [
    OrderStatus.PENDING,
    OrderStatus.DELIVERED,
    OrderStatus.CANCELED
]
~~~

- El enum en el schema de Prisma **no tiene strings asignados a los valores, pero en el gateway si**
- Copio el CreateOrderDto en el gateway (arreglo la importación del enum)
- Vamos con el create de orders-ms/src/orders.service.ts

~~~js
create(createOrderDto: CreateOrderDto) {
    return this.order.create({
      data: createOrderDto
    })
}
~~~

- Para insertar apunto a localhost:3000/api/orders y le paso lo que me pide el dto (totalAmount y totalItems)
- NOTA: es localhost:3000/api porque así lo seteé con setGlobalPrefix en el main

~~~js
app.setGlobalPrefix('api')
~~~

- en el body de la petición POST a localhost:3000/api/orders
~~~json
{
  "totalItems":4,
  "totalAmount":120
}
~~~

- Me devuelve esto

~~~json
{
  "id": "92c4b44b-bc55-407f-abe0-3919484215b4",
  "totalAmount": 120,
  "totalItems": 4,
  "status": "PENDING",
  "paid": false,
  "paidAt": null,
  "createdAt": "2025-06-28T09:28:54.540Z",
  "updatedAt": "2025-06-28T09:28:54.540Z"
}
~~~

## Obtener orden por id

- En el gateway llamo al microservico desde gateway/src/orders/orders.controller
- Trato el Observable como una promesa con firstValueFrom de rxjs
- Capturo la excepción en el catch

~~~js
@Get(':id')
async findOne(@Param('id') id: string) {
  try {
    const order= await firstValueFrom(
      this.ordersClient.send('findOneOrder', {id})
    )

    return order
    
  } catch (error) {
    throw new RpcException(error)
  }
}
~~~

- En el orders-ms/src/orders.controller recibo el id como un objeto del payload
- Siempre estoy mandando (y recibiendo) objetos como payload, pero lo desgloso para que prisma no me de error

~~~js
@MessagePattern('findOneOrder')
findOne(@Payload() payload: {id: string}) {
  return this.ordersService.findOne(payload.id);
}
~~~

- Si simplemente lo mando como un objeto y no lo desgloso como payload.id, prisma interpreta esto

~~~js
where: {
  id: { id: '92c4...' } // ❌ lo que causa el error
}
~~~

- En el orders-ms/src/orders.service

~~~js
async findOne(id: string) {
    const order = await this.order.findFirst({
      where: {id} //es importante que el id no llegue aqui como un objeto
    })

    if(!order){
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Order with id ${id} not found`
      })
    }

    return order
  }
~~~

- Apunto con un GET a http://localhost:3000/api/orders/92c4b44b-bc55-407f-abe0-3919484215b4

## Paginación y filtro (findAll)

- En el gateway/src/orders/orders.controller

~~~js
@Get()
findAll( @Query() paginationDto: PaginationDto) {
  return this.ordersClient.send('findAllOrders', paginationDto)
}
~~~

- En el orders-ms/src/orders.controller.ts recibo el orderPaginationDto

~~~js
@MessagePattern('findAllOrders')
findAll(@Payload() orderPaginationDto: OrderPaginationDto) {
  return this.ordersService.findAll(orderPaginationDto);
}
~~~

- El orderPaginationDto en orders-ms

~~~js
import { IsEnum, IsNumber, IsOptional } from "class-validator";
import { OrderStatus } from "generated/prisma";
import { OrderStatusList } from "src/common/enums/orders.enum";

export class OrderPaginationDto{

  @IsOptional()
  @IsEnum( OrderStatusList, {
    message: `Valid status are ${ OrderStatusList }`
  })
  status?: OrderStatus;

  @IsOptional()
  @IsNumber()
  page: number = 1

  @IsOptional()
  @IsNumber()
  limit: number = 10
}
~~~

- El OrderStatusList es el arreglo con los valores de OrderStatus
- orders-ms/src/common/enums/orders.enum.ts

~~~js
import { OrderStatus } from "generated/prisma";


export const OrderStatusList = [
    OrderStatus.PENDING,
    OrderStatus.DELIVERED,
    OrderStatus.CANCELED
]
~~~

- Vamos al servicio de orders-ms a crear la paginación

~~~js
async findAll(orderPaginationDto: OrderPaginationDto) {
  const totalPages = await  this.order.count({
    where: {
      status: orderPaginationDto.status 
    }
  }) 

  const currentPage = orderPaginationDto.page
  const perPage = orderPaginationDto.limit

  return {
    data: await this.order.findMany({
      skip: (currentPage - 1) * perPage,
      take: perPage,
      where:{
        status: orderPaginationDto.status
      }
    }),
    meta: {
      total: totalPages,
      page: currentPage,
      lastPage: Math.ceil(totalPages/perPage)
    }
  }
}
~~~

- No importa si no le paso el status (opcional) porque Prisma ignora el undefined y hace la búsqueda sin el WHERE


## Cambiar estado de la orden

- Uso **@Patch** en el gateway, extraigo el id y lo casteo a UUID
- gateway/src/orders/orders.controller

~~~js
@Patch(':id')
  async changeStatus(
    @Param('id', ParseUUIDPipe) id: string, 
    @Body() statusDto: StatusDto) {
    try {
      return this.ordersClient.send('changeOrderStatus', {id, status: statusDto.status})
    } catch (error) {
      throw new RpcException(error)
    }
  }
~~~

- En el controller de orders-ms

~~~js
@MessagePattern('changeOrderStatus')
  changeOrderStatus(@Payload() changeOrderStatusDto: ChangeOrderStatusDto) {
    return this.ordersService.changeOrderStatus(changeOrderStatusDto);
  }
~~~

- El dto tiene el id y el status
- changeOrderStatus.dto

~~~js
import { IsEnum, IsUUID } from "class-validator";
import { OrderStatus } from "generated/prisma";
import { OrderStatusList } from "src/common/enums/orders.enum";

export class ChangeOrderStatusDto {

  @IsUUID(4)
  id: string;

  @IsEnum( OrderStatusList, {
    message: `Valid status are ${ OrderStatusList }`
  })
  status: OrderStatus;
}
~~~

- El orders-ms/orders.enum dice así

~~~js
import { OrderStatus } from "generated/prisma";


export const OrderStatusList = [
    OrderStatus.PENDING,
    OrderStatus.DELIVERED,
    OrderStatus.CANCELED
]
~~~

- El orders-ms/orders.service

~~~js
async changeOrderStatus(changeOrderStatusDto: ChangeOrderStatusDto){
      const {id, status} = changeOrderStatusDto

      const order = await this.findOne(id)
      if(order.status === status){
        return order
      }

      return await this.order.update({
        where: {id},
        data: {status}
      })
  }
~~~
--------

