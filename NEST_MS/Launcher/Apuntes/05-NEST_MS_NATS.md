# 05 NEST_MS - NATS

- La orden se crea con el detalle. Están fuertemente acopladas, las hicimos en el mismo microservicio
- Orden se comunica directamente con Products para confirmar los productos
- Con la arquitectura actual, cuando añadamos autenticación y queramos modificar una orden vamos a tener que añadir otra dependencia (el microservicio de auth) a órdenes
- En lugar de eso nos encargaremos de hacer las comunicaciones mediante un Service Broker, un middleman situado en el cliente-gateway y los microservicios
- Cuando NATS recibe la solicitud de creación de una orden desde el cliente-gateway mandada por el cliente, orders **que está suscrita al topic de creación** de la orden dará una respuesta
- Orders necesita saber que los ids de los productos se encuentran en la db de products
- El servidor NATS servirá de intermediario entre orders-microservice y products-microservice
- Esto es una forma simplificada de lo que ocurre
- **NATS BROKER**
    - Es open source, fácil de configurar y ligero
    - Comunicará mis microservicios
    - NATS se encarga de hacer **el balanceo de carga**
        - Es decir, si tengo varios microservicios y quiero que todos respondan al mismo tiempo se puede configurar en NATS
        - Cuando implementemos los servicios de pagos y notificaciones vamos a querer esto
    - Trabaja con mensajería tipo **publicar y subscribir**
    - Hay **topics/subjects** a los cuales se escucha
    - Puedes tener **múltiples escuchas (listeners) al mismo topic**
    - Está pensado para escalamiento horizontal
    - Seguridad, balanceo de carga incluido
    - Payload agnóstico, pueden ser strings, números, un objeto, lo que sea necesario
    - Rápido, eficiente, open source
- Por ejemplo, una vez realizado un pago voy a querer comunicarme con tres microservciios: auth, email-notification, orders
- Con la arquitectura implementada hasta ahora serían todo dependencias del microservicio de pagos
- Crearemos una **Docker Network** para tenerlo todo en un mismo sitio y que solo mediante a una API REST en el puerto 3000 se acceda a esta red interna
- Primero vamos a establecer la arquitectura con NATS y luego crearemos la Docker Network
- Para no instalar NATS usaremos Docker
- Luego usaremos docker-compose, por ahora lo haremos con un comando
    - Usamos -d para indicar el detached para desacoplar y lo ejecute en segundo plano (y me devuelva la terminal)
    - 4222: Nuestros microservicios van a estar hablando con NATS por este puerto
    - 8222: Ofrece una comunicación HTTP para monitorear los clientes y ver quien se conecta, quien se cae, etc
    - 6222: Puerto utuilizado para el clustering. No lo usaremos
    - nats al final está la imagen nats:latest por defecto
    - Le llamaremos nats-server

> docker run -d --name nats-server -p 4222:4222 -p 8222:8222 nats

- En .env de orders-ms tengo

~~~
PORT=3002
DATABASE_URL="postgresql://postgres:123456@localhost:5432/ordersdb?schema=public"
PRODUCTS_MICROSERVICE_HOST=localhost
PRODUCTS_MICROSERVICE_PORT=3001

#NATS_SERVERS="nats://localhost:4222, nats://localhost:4223"
NATS_SERVERS="nats://localhost:4222"
~~~

- El 4223 no existe, servirá luego para hacer validaciones delas variables de entorno, donde validaremos que sea un array y separaremos por comas los strings para poder validarlas

- En el .env de products

~~~
PORT=3001
DATABASE_URL= "file:./dev.db"

#NATS_SERVERS="nats://localhost:4222, nats://localhost:4223"
NATS_SERVERS="nats://localhost:4222"
~~~

- En .env del gateway tengo

~~~
PRODUCTS_MICROSERVICE_HOST=localhost
PRODUCTS_MICROSERVICE_PORT=3001
ORDERS_MICROSERVICE_HOST=localhost
ORDERS_MICROSERVICE_PORT=3002
#NATS_SERVERS="nats://localhost:4222, nats://localhost:4223"
NATS_SERVERS="nats://localhost:4222"
~~~

- En localhost:8222 tengo la interfaz gráfica de NATS

## Products-ms - Cambiar de TCP a NATS

- Instalo nats con **npm i nats**
- Debo añadir las variables de entorno a envs.ts

~~~js
import 'dotenv/config'
import * as joi from 'joi'


interface EnvVars{
    PORT: number
    DATABASE_URL: string,
    NATS_SERVERS: string[]
}

const envsSchema = joi.object({
    PORT: joi.number().required(),
    DATABASE_URL: joi.string().required(),
    NATS_SERVERS: joi.array().items(joi.string().required())   
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
    natsServers: envVars.NATS_SERVERS
}
~~~

- En el main de products-ms

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
      transport: Transport.NATS,
      options:{
        servers: envs.natsServers
      }
    }
  );
  
  await app.listen();
  logger.log(`Products Microservice running on port ${envs.port}`)
}
bootstrap();
~~~

- Puedo seguir usando **@MessagePattern**, ahora puedo usar **comodines**

~~~js
@MessagePattern('time.*') //escuchará cualquier mensaje que venga de time
  getDate(@Payload() data: number[], @Ctx() context: NatsContext){
    console.log(`Subject: ${context.getSubject()}`)
    return new Date().toLocaleString()
}
~~~

- Debemos tambien cambiar el canal de comunicación en el gateway
- Instalo nats, configuro y valido la variable de entorno como arreglo, coloco la variable en el main y cambio el transporte
- En las envs del gateway

~~~js
import 'dotenv/config'
import * as joi from 'joi'


interface EnvVars{
    PRODUCTS_MICROSERVICE_HOST: string
    PRODUCTS_MICROSERVICE_PORT: number,
    ORDERS_MICROSERVICE_HOST: string,
    ORDERS_MICROSERVICE_PORT: number,
    NATS_SERVERS: string[]
}

const envsSchema = joi.object({
    PRODUCTS_MICROSERVICE_HOST: joi.string().required(),
    PRODUCTS_MICROSERVICE_PORT: joi.number().required(),
    ORDERS_MICROSERVICE_HOST: joi.string().required(),
    ORDERS_MICROSERVICE_PORT: joi.number().required(),
    NATS_SERVERS: joi.array().items(joi.string().required())    
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
    productsMicroserviceHost: envVars.PRODUCTS_MICROSERVICE_HOST,
    productsMicroservicePort: envVars.PRODUCTS_MICROSERVICE_PORT,
    ordersMicroserviceHost: envVars.ORDERS_MICROSERVICE_HOST,
    ordersMicroServicePort: envVars.ORDERS_MICROSERVICE_PORT,
    natsServers: envVars.NATS_SERVERS
}
~~~

- En el products del gateway **(gateway y cliente-gateway son lo mismo)**

~~~js
import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { envs } from 'src/config/envs';
import { NATS_SERVICE, PRODUCTS_SERVICE } from 'src/config/services';

@Module({
  imports:[
    ClientsModule.register([
      {
        name: NATS_SERVICE,
        transport: Transport.NATS,
        options:{
          servers: envs.natsServers //importante servers y no server!! server usa localhost
        }
      }
    ])
  ],
  controllers: [ProductsController],
  providers: [],
})
export class ProductsModule {}
~~~

- Puedo exportar el módulo e inyectarlo en app.module del gateway
- Creo la carpeta gateway/src/transports/nats.module.ts

~~~js
import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { envs, NATS_SERVICE } from 'src/config';


@Module({
  imports:[
     ClientsModule.register([
          {
            name: NATS_SERVICE,
            transport: Transport.NATS,
            options:{
              servers: envs.natsServers
            }
          }
        ])
  ],
  exports:[
     ClientsModule.register([
      {
        name: NATS_SERVICE,
        transport: Transport.NATS,
        options:{
          servers: envs.natsServers
        }
      }
    ])
  ]
})
export class NatsModule {}
~~~

- Lo inyecto en gateway/app.module

~~~js
import { Module } from '@nestjs/common';
import { ProductsModule } from './products/products.module';
import { OrdersModule } from './orders/orders.module';
import { NatsModule } from './transports/nats.module';

@Module({
  imports: [ProductsModule, OrdersModule, NatsModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
~~~

- En src/config/services.ts del gateway

~~~js
export const PRODUCTS_SERVICE= 'PRODUCTS_SERVICE'
export const ORDERS_SERVICE= 'ORDERS_SERVICE'
export const NATS_SERVICE = 'NATS_SERVICE'
~~~

- También lo importo en gateway/products.module

~~~js
import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { NatsModule } from 'src/transports/nats.module';

@Module({
  imports:[NatsModule],
  controllers: [ProductsController],
  providers: [],
})
export class ProductsModule {}
~~~

- Hago lo mismo en gateway/orders, importo el módulo

~~~js
import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { NatsModule } from 'src/transports/nats.module';


@Module({
  imports:[NatsModule],
  controllers: [OrdersController],
  providers: [],
})
export class OrdersModule {}
~~~

- En el controller ya no nombro a la inyección productsClient, simplemente **client**
- gateway/products.controller

~~~js
import { Controller, Get, Post, Body, Patch, Param, Delete, Inject, Query, BadRequestException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { NATS_SERVICE} from 'src/config';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { PaginationDto } from 'src/common/pagination.dto';
import { catchError} from 'rxjs';


@Controller('products')
export class ProductsController {
  constructor(
    @Inject(NATS_SERVICE)
    private readonly client: ClientProxy    
  ) {}

  @Post()
  create(@Body() createProductDto: CreateProductDto) {
    return this.client.send({cmd:'create_product'}, createProductDto)
    
  }

  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.client.send({cmd: 'find_all_products'}, paginationDto);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
     
    return  this.client.send({cmd:'find_one_product'}, {id}).pipe(
      catchError((err)=>{
        throw new RpcException(err)
      })
     )  
  }
 

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.client.send({cmd: 'update_product'},{
      id,
      ...updateProductDto
    })
    .pipe(
      catchError((err)=>{
        throw new RpcException(err)
      })
    )
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.client.send({cmd:'delete_product'}, {id})
      .pipe(
        catchError((err)=>{
          throw new RpcException(err)
        })
      )
  }
}
~~~

- Lo mismo en el modulo gateway/orders.controller

~~~js
import { Controller, Get, Post, Body, Patch, Param, Inject, Query, ParseUUIDPipe } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { NATS_SERVICE} from 'src/config';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { PaginationDto } from 'src/common/pagination.dto';
import { firstValueFrom } from 'rxjs';
import { StatusDto } from 'src/common/status.dto';

@Controller('orders')
export class OrdersController {
  constructor(
    @Inject(NATS_SERVICE)
    private readonly client: ClientProxy
  ) {}

  @Post()
  create(@Body() createOrderDto: CreateOrderDto) {
   return this.client.send('createOrder', createOrderDto)
  }

  @Get()
  findAll( @Query() paginationDto: PaginationDto) {
   return this.client.send('findAllOrders', paginationDto)
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const order= await firstValueFrom(
        this.client.send('findOneOrder', {id})
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
      return this.client.send('changeOrderStatus', {id, status: statusDto.status})
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
        return this.client.send('findAllOrders',
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
------