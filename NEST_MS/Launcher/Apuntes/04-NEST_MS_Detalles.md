# 04 NEST_MS - DETALLES

- Vamos a conectar ordenes con productos directamente para comprobar que los productos existen
- Debemos cambiar el dto de creación de la orden para aceptar los items, en orders igual
- Hay que crear en Products algún método para recibir el id de los productos y verificar que existen
- No voy a poder crear una orden si un producto no existe
- Es conveniente introducir algún tipo de middleware como NATS o RabbitMQ, algún sistema que mantenga el orden entre tanto microservicio

## Orders-ms

- Ordenes y detalle van a estar en el mismo microservicio
- Ambos están altamente acoplados, no existen el uno sin el otro
- Comunicaremos órdenes y productos mediante TCP para validar
- Después de esta sección implementaremos un middleman entre el cliente y los microservicios (un servidor NATS)
- Habrá otro servicio de autenticación con MONGO

## OrderItems - detalles de la orden

- En orders-ms
- Para entender la comunicación que vamos a establecer, lo mejor es entender la estructura de la db
- Prácticamente, excepto totalAmount y totalItems, el resto de campos se crean automáticamente
- Voy a pedir siempre una cantidad de hijos (items) y esos items los voy a contar y sumar su valor para el totalAmount
- Una orden en la vida real podría tener más cosas, como un cupón de descuento
- Creo otro modelo como OrderItem
- productId no tiene una relación directa con SQLite de Products
    - Hay quien trabaja todo en una DB pero no es una buena práctica en microservicios
    - Se puede hacer pero no permitiría escalar cada microservicio independientemente
- Si yo coloco esto en Order **y presiono Ctrl+Alt+Shift** me crea la relación automáticamente

~~~
OrderItem OrderItem[]
~~~

- orders-ms/prisma/schema.prisma

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
  paidAt        DateTime?

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  orderItem     OrderItem[]
}

model OrderItem{
  id   String @id  @default(uuid())
  productId Int  //no hay una relación física con SQLite
  quantity Int
  price Float //los precios pueden variar. Este precio se queda aquí en el momento de la orden
  
  Order Order? @relation(fields: [orderId], references: [id]) //establezco la relación
  orderId String?
}
~~~

- Desde orders-ms impacto la db con una migración (debo tener la imagen de Docker corriendo)

> npx prisma migrate dev --name order-item

- Puedo comprobar que lo ha hecho en TablePlus
- Borro las órdenes anteriores porque están mal creadas, les falta el OrderItem

## DTO de creación de orden

- El create-oder.dto en orders-ms

~~~js
import { ArrayMinSize, IsArray, ValidateNested} from "class-validator"
import { OrderStatus } from "generated/prisma"
import { OrderStatusList } from "src/common/enums/orders.enum"
import { OrderItemDto } from "./order-item.dto"
import { Type } from "class-transformer"


export class CreateOrderDto {
    
    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({each:true}) //valida internamente los objetos en el array
    @Type(()=>OrderItemDto)
    items: OrderItemDto[]

}
~~~

- El order-item.dto (los campos de OderItem)

~~~js
import { IsNumber, IsPositive } from "class-validator"

export class OrderItemDto{
    
    @IsNumber()
    @IsPositive()
    productId: number //en la DB de productos tienen un id de tipo numérico

    @IsNumber()
    @IsPositive()
    quantity: number

    @IsNumber()
    @IsPositive()
    price: number
}
~~~

- En el body de POSTMAN vendría a ser algo así

~~~json
{
    "items":[
        {
            "productId": 4,
            "quantity": 3,
            "price": 20
        }
    ]
}
~~~

- Pero esto solo valida la petición en orders-ms
- **Hay que hacer lo mismo en el cliente gateway**
- create-order.dto y order-ietm.dto son iguales en el gateway (los copio)
- En el método create de orders-ms voy a tener un error porque prisma valida el dto
- Coloco un return {service:"orders-service create", createOrderDto} devolviendo el dto de manera temporal para que Prisma no me de error con la data, porque no corresponde con lo que prisma espera

~~~js
create(createOrderDto: CreateOrderDto) {
      return {
        service: "create order service",
        createOrderDto: createOrderDto
      }
  }
~~~

- Falta validar que los productos de la orden existan
- Si ahora apunto con POST localhost:3000/api/orders y le paso el body

~~~json
{
    "items":[
        {
            "productId": 4,
            "quantity": 3,
            "price": 20
        }
    ]
}
~~~

- Me devuelve

~~~json
{
  "service": "create order service",
  "createOrderDto": {
    "items": [
      {
        "productId": 4,
        "quantity": 3,
        "price": 20
      }
    ]
  }
}
~~~

## Products-ms - Validar productos por ID 

- En products.ms estoy usando SQLite
- En products-ms/products/src/products.controller creo el método para validar el ID
- **A partir de ahora abreviaré a products-ms/products.controller entendiendo que está dentro de products/src**

~~~js
@MessagePattern({cmd:"validate_products"})
  validateProduct(@Payload() ids: number[]){
    return this.productsService.validateProducts(ids)
  }
~~~

- En products-ms/products.service creo un array de ids y uso Set para eliminar los repetidos
- Hago la búsqueda con findMany y le digo que el id debe de estar en el arreglo

~~~js
async validateProducts(ids: number[]){
    ids = Array.from(new Set(ids))

    const products = await this.product.findMany({
      where:{
        id: {in: ids}
      }
    })

    if (products.length !== ids.length){
      throw new RpcException({
        message: 'Some products whre not found',
        status: HttpStatus.BAD_REQUEST
      })
    }
  }
~~~

## Comunicar orders-ms con products-ms

- En orders-ms tengo que registrar el products-ms con ClientsModule.register
- Voy a necesitar añadir las variables de entorno en .env
- orders-ms/orders.module

~~~js
import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { PRODUCT_SERVICE } from 'src/config/services';
import { envs } from 'src/config/envs';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: PRODUCT_SERVICE,
        transport: Transport.TCP,
        options:{
          host: envs.productsMicroserviceHost,
          port: +envs.productsMicroservicePort
        }
      }
    ])
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
~~~

- orders-ms/ .env

~~~
PORT=3002
DATABASE_URL="postgresql://postgres:123456@localhost:5432/ordersdb?schema=public"
PRODUCTS_MICROSERVICE_HOST=localhost
PRODUCTS_MICROSERVICE_PORT=3001
~~~

- Añado las variables en la validación con joi en config/envs.ts

~~~js
import 'dotenv/config'
import * as joi from 'joi'


interface EnvVars{
    PORT: number
    PRODUCTS_MICROSERVICE_HOST: string
    PRODUCTS_MICROSERVICE_PORT: number
}

const envsSchema = joi.object({
    PORT: joi.number().required(),
    PRODUCTS_MICROSERVICE_HOST: joi.string().required(),
    PRODUCTS_MICROSERVICE_PORT: joi.number().required()
        
})
.unknown(true) //hay muchas variables más del entorno como el path de node, etc


const {error, value}= envsSchema.validate(process.env)

if(error){
    throw new Error(`Config validation error: ${error.message}`)
}

const envVars: EnvVars = value


export const envs={
    port: envVars.PORT,
    productsMicroserviceHost: envVars.PRODUCTS_MICROSERVICE_HOST,
    productsMicroservicePort: envVars.PRODUCTS_MICROSERVICE_PORT
}
~~~

- En orders-ms/orders/src/config/services.ts

~~~js
export const PRODUCT_SERVICE = 'PRODUCT_SERVICE'
~~~

- En orders-ms/orders.service debo usar @Inject pasándole el PRODUCT_SERVICE
- Me pide que llame al super, lo hago

~~~js
import { HttpCode, HttpStatus, Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ChangeOrderStatusDto } from './dto/change-order.dto';
import { OrderPaginationDto } from './dto/order-pagination.dto';
import { PrismaClient } from 'generated/prisma';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { CreateOrderDto } from './dto/create-order.dto';
import { PRODUCT_SERVICE } from 'src/config/services';

@Injectable()
export class OrdersService extends PrismaClient implements OnModuleInit{

  private readonly logger = new Logger("OrdersService")

  constructor(
    @Inject(PRODUCT_SERVICE)
    private readonly productsClient: ClientProxy
  ){
    super()
  }

  {...code}
}
~~~

- Estoy en orders-ms/orders.service
- En el método create necesito llegar a products con .send si quiero trabajarlo como un Observable
- Para trabajarlo cómo una promesa debo usar firstValueFrom de rxjs
- Coloco todo dentro de un try catch
- Con .map extraigo el arreglo de ids del dto
- Uso el await con **firstValueFrom**, cómo parámetro le paso el .send
    - Para comunicarme con el método validateProducts le paso el objeto cmd con el mismo string del MessagePattern y el arreglo de ids que he sacado haciendo un .map del dto.id
- Para calcular el total a pagar hago uso de un reducer
    - acc es el acumulador. Uso el createOrderDto porque es dónde están las orders con los items y el precio
    - Uso el arreglo de products para encontrar los productos que coincidan con los ids de orderItem y obtener el precio
    - Retorno el precio * la cantidad en cada orderItem
    - El acumulador empieza en 0
- Uso un reducer también para el total de Items
    - Sumo el acumulador a la cantidad de items por orden
- Para crear la orden necesito insertar la orden y los items, ambas inserciones deben ser exitosas
- Esto suele hacerse con **.$transaction**, porque si una falla tengo que hacer el rollback
- Vamos a crearlo todo en una sola orden
- *NOTA*: el reducer va acumulando en el acumulador el número de iteraciones y los guarda en acc
    - El segundo parámetro del callback es el objeto que voy a iterar. El 0 es el valor inicial del acumulador
- Ejemplo de reducer

~~~js
const reducer = [1,2,3,4,5].reduce((acc,el)=> acc+el, 0) //devuelve 15

//En la primera iteración acc vale 0 y el vale 1, 0+1 === 1
//En la segunda iteración acc vale 1 y el vale 2, 2+1 === 3
//En la tercera acc vale 3 y el vale 3, 3+3 === 6
//y así hasta 15
~~~

- orders-ms/orders.service.ts

~~~js
async create(createOrderDto: CreateOrderDto) {
try {
    //1.Confirmar los ids de los productos
    const productsIds = createOrderDto.items.map((item)=> item.productId) //extraigo los ids en un arreglo

    //llamo al microservicio para validar que existen los productos
    const products: any[]= await firstValueFrom(
    this.productsClient.send({cmd:'validate_products'}, productsIds)
    )

    //2.Calculo de los valores          //en OrderItem tengo el precio
    const totalAmount = createOrderDto.items.reduce((acc, orderItem)=>{
    //necesito encontrar orderItem en el arreglo de productos
    //no quiero confiar en el precio del dto, uso el de los productos a través del id

    const price = products.find((product)=>product.id === orderItem.productId).price
    //Multiplica el precio del producto por la cantidad pedida y súmalo al acumulador (acc) que lleva el total hasta ahora
    return price * orderItem.quantity +acc
    }, 0)

    const totalItems = createOrderDto.items.reduce((acc, orderItem)=>{
    return acc + orderItem.quantity //Si tengo x cantidad necesito contarlo por cada uno de los elementos del arreglo
    }, 0) //En el acc voy guardando la suma de las iteraciones

    //3. Crear una transacción en la db

    const order = await this.order.create({
    data:{
        totalAmount: totalAmount,
        totalItems: totalItems,
        orderItem:{
        createMany:{
            data: createOrderDto.items.map((orderItem)=>({
            price: products.find( //no puedo usar directamente el orderItem.price porque no lo hemos validado
                (product)=> product.id === orderItem.productId //uso los precios del arreglo de products que viene de la tabla
            ).price,
            productId: orderItem.productId,
            quantity: orderItem.quantity
            }))
        }
        }
    },
    //que incluya el OrderItem. Si pongo solo OrderItem: true me devuelve todo
    include:{
        orderItem:{
        select:{
            price: true,
            quantity: true,
            productId: true
        }
        }
    }
    })

    return {
    ...order, //me quedo con todo lo de order menos OrderItem
    orderItem: order.orderItem.map((orderItem)=>({
    ...orderItem,
    //buscando el nombre del producto real basado en el productId del orderItem para agregarlo al objeto orderItem retornado
    //el .name retorna el nombre del producto encontrado
    name: products.find((product)=> product.id === orderItem.productId).name   
    }))
    }
    
} catch (error) {
    throw new RpcException({ 
    message: "Check logs",
    status: HttpStatus.BAD_REQUEST
})
}
}
~~~

- Piensa que en Order necesito el totalAmount y el totalItems, porque el resto de campos se generan solos, incluso el status

~~~js
model Order {
  id            String  @id  @default(uuid())
  totalAmount   Float
  totalItems    Int
  status        OrderStatus @default(PENDING)
  paid Boolean  @default(false)
  paidAt        DateTime?

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  orderItem     OrderItem[]
}
~~~

- De hecho, podríamos ignorar el precio en OrderItem porque lo vamos a usar en Products
- En findOrderById quiero aparezca el detalle

## Buscar order por id con su detalle

- Uso el include para retornar el orderItem con los campos indicados en el select

~~~js
async findOne(id: string) {
  const order = await this.order.findFirst({
    where: {id},
    include:{
    orderItem:{
        select:{
        price: true, 
        quantity: true,
        productId: true
        }
    }
    }
})

  if(!order){
    throw new RpcException({
    status: HttpStatus.NOT_FOUND,
    message: `Order with id ${id} not found`
    })
}

  const productIds = order.orderItem.map((orderItem)=> orderItem.productId)

   //valido comunicándome con el products-ms que los productos existan
  //ESTO EN ESTE MOMENTO NO DEBERÏA FALLAR
  const products: any[]= await firstValueFrom(
    this.productsClient.send({cmd: 'validate_products'},productIds)
)

  return {
    ...order,
    orderItem: order.orderItem.map((orderItem)=>({
    ...orderItem,
    name: products.find((product)=> product.id=== orderItem.productId).name
    }))
  }
}
~~~

## Problemas y soluciones

- Esto organizado así es muy probable que se salga de control
- Orders está conectado directamente con Products
- En algún momento, cuando implementamos autenticación, orders va a tener que validar un token con el microservicio de auth
- Habría que conectar orders con auth, implica cambios, el cliente-gateway
- Esto va a crear un anidamiento dificil de gestionar
- La solución passa por un **Service Broker, un middleman** que se encargue de procesar un motón de paquetes y pedido entre los microservicios
- RabbitMQ es muy popular. Se crea una cola de procesos y mensajería, como en una oficina postal
- También se puede, basado en alguna transacción o evento que suceda, comunicárselo al resto de microservicios de manera simultánea
- Hacer esto mismo con la arquitectura de ahora significaría acoplamiento
- Por eso vamos a implementar una arquitectura diferente con **NATS**, que estrá en medio del gateway y los microservicios
- **Vamos a centralizar la comunicación entre microservicios**
- NATS server se va a encargar de notificar a todos los microservicios que les interese un mensaje
- Esto va a eliminar la comunicación directa entre microservicios
- NATS va a crear unos **topics** y estos se notificarán a los microservicios   
------