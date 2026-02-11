# NEST_MS - Integrar Orders-ms y Payments-ms

## Agregar repositorio al Launcher

- Copio el dockerignore y el Dockerfile de orders y los pego en payments-ms

~~~Dockerfile
FROM node:20-alpine3.19

WORKDIR /usr/src/app

COPY package.json ./
COPY package-lock.json ./

RUN npm install


COPY . .

EXPOSE 3003
~~~

- El dockerignore

~~~
dist/

node_modules/

.vscode/
~~~

- Defino mis variables de entorno

~~~
PAYMENTS_MS_PORT=3003
STRIPE_SECRET_KEY=
STRIPE_ENDPOINT_SECRET=
NATS_SERVERS="nats://nats-server:4222"
~~~

- Debería poner en las variables de entorno el success-url y el cancel-url, PERO BUENO
- Añado las variables de entorno en el .env que esta donde el docker-compose.yml

~~~
CLIENT_GATEWAY_PORT=3000
STRIPE_SECRET_KEY=
STRIPE_ENDPOINT_SECRET=
~~~

- En el docker-compose.yml habilito el puerto 3003 en payments-ms para que Stripe se pueda comunicar con el servicio

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
      - nats-server
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
      - ${PAYMENTS_MS_PORT}:${PAYMENTS_MS_PORT} #expongo el puerto 3003
    environment:
      - PORT=${PAYMENTS_MS_PORT} # asigno el puerto
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

- El Dockerfile de orders-ms

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

- Borro el build que tengo del Launcher y lo creo de nuevo
- Si efectuo el **docker compose up --build** debería construir la imagen
- Para levantar todo uso **docker compose up** (sin el build)
- Algunos cambios en orders-ms
- app.module

~~~js
import { Module } from '@nestjs/common';
import { OrdersModule } from './orders/orders.module';


@Module({
  imports: [OrdersModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
~~~

- orders.module, importo el NatsModule

~~~js
import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';

import { NatsModule } from 'src/transports/nats.module';

@Module({
  imports: [
    NatsModule

  ],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
~~~

- En el orders-ms/main.ts configuro el NATS

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

- El .envs de payments-ms

~~~js
import 'dotenv/config'
import * as joi from 'joi'


interface EnvVars{
    PORT: number
    STRIPE_SECRET_KEY: string
    STRIPE_ENDPOINT_SECRET: string,
    NATS_SERVERS: string[]
}

const envsSchema = joi.object({
    PORT: joi.number().default(3003),
    STRIPE_SECRET_KEY: joi.string().required(),
    STRIPE_ENDPOINT_SECRET: joi.string().required(),
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
    stripeSecret: envVars.STRIPE_SECRET_KEY,
    endpointSecret: envVars.STRIPE_ENDPOINT_SECRET,
    natsServers: envVars.NATS_SERVERS
}
~~~

## Microservicio híbrido - REST NATS

- Necesitamos que el payments-ms sea híbrido
- La única forma de llegar al resto de microservicios es mediante NATS
- Ocupamos habilitar un puerto (REST) para que payment-ms hable con Stripe (PAYMENTS_MS_PORT)
- También se podría hacer que Stripe usara el gateway, crear otro POST que este pendiente de Stripe, o incluso otro servidor
- De esta manera es más anónimo, no expongo el gateway
- Para que confiemos en la info que va a venir de Stripe hay una verificación de la firma, un edpoint_secret

~~~js
async stripeWebhook(req: Request, res: Response) {
    const sig = req.headers['stripe-signature']!;

    let event: Stripe.Event;

    
    const endpointSecret = envs.endpointSecret

    try {
      event = this.stripe.webhooks.constructEvent(
        req['rawBody'],
        sig,
        endpointSecret,
      );
    } catch (err) {
      res.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }

{...code}
}
~~~

- Vamos a transformar payments-ms en un microservicio híbrido
- Hay que instalar en payments-ms

> npm i @nestjs/microservices nats

- En el main configuro NATS, añado la variable de entorno NATS_SERVERS (la misma que tengo en orders-ms, por ejemplo) 

~~~
NATS_SERVERS="nats://nats-server:4222"
~~~

- Configuro la variable de entorno en payments-ms/src/config/envs.ts

~~~js
import 'dotenv/config'
import * as joi from 'joi'


interface EnvVars{
    PORT: number
    STRIPE_SECRET_KEY: string
    ENDPOINT_SECRET: string,
    NATS_SERVERS: string[]
}

const envsSchema = joi.object({
    PORT: joi.number().required(),
    STRIPE_SECRET_KEY: joi.string().required(),
    ENDPOINT_SECRET: joi.string().required(),
    NATS_SERVERS: joi.array().items(joi.string().required()),
})
.unknown(true) 


const {error, value}= envsSchema.validate({
    ...process.env,
    NATS_SERVERS: process.env.NATS_SERVERS?.split(',') //importante para transformarlo en arreglo
})

if(error){
    throw new Error(`Config validation error: ${error.message}`)
}

const envVars: EnvVars = value


export const envs={
    port: envVars.PORT,
    stripeSecret: envVars.STRIPE_SECRET_KEY,
    endpointSecret: envVars.ENDPOINT_SECRET,
    natsServers: envVars.NATS_SERVERS
}
~~~

- El payments-ms main

~~~js
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { envs } from './config/envs';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(AppModule,{
    rawBody: true //esto va a mandar el body como un buffer
  });
  
  const logger = new Logger('Payments-ms')

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true
  }))

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.NATS,
    options:{
      servers:envs.natsServers
    },
    
  })

  await app.startAllMicroservices()

  await app.listen(envs.port);
  logger.log(`Server running on port ${envs.port}`)
}
bootstrap();

~~~


- Para comprobar que se ha conectado corerctamente puedo ir al puerto de monitoreo de NATS e ir a Connections, debería tener 3, orders, products y payments

## PaymentSession desde Orders-ms

- **NOTA**: En el curso lo importa de @prisma/client. Para ello debería eliminar el output custom de de schema.prisma.
- schema.prisma de orders-ms

~~~prisma
generator client {
  provider = "prisma-client-js"
  binaryTargets = ["native", "linux-musl-openssl-3.0.x"]
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
  status        OrderStatus @default(PENDING)
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

- Quiero evitar llegar al POST 3003:create-payment-session de payments-ms
- En el MessagePattern se recomienda separar las palabras por puntos, así permite el uso de comodines y otros
- El microservicio con NATS no hereda el comportamiento del class-validator y class-transformer (para el DTO)

~~~js
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  //@Post('create-payment-session') comento esto
  @MessagePattern('create.payment.session')
  createPaymentSession(@Body() paymentSessionDto: PaymentSessionDto) {
    return this.paymentsService.createPaymentSession(paymentSessionDto)
  }
}
~~~

- En orders-ms/src/orders.controller modifico el código, tan pronto tengo la orden es dónde quiero crear la sesión
- Sitúo el cursor encima de order y me da la interfaz
- De esta manera nos aseguramos de que cuando se crea la orden independientemente creamos el paymentSession

~~~js
@Controller()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @MessagePattern('createOrder')
  async create(@Payload() createOrderDto: CreateOrderDto) {
    //return this.ordersService.create(createOrderDto);

    const order = await this.ordersService.create(createOrderDto)

    //aqui quiero crear la session!!
    const paymentSession = await this.ordersService.createPaymentSession(order) //hago la interfaz de esat order

    return{
      order,
      paymentSession
    }
  }
{...code}
}
~~~

- Si sitúo el cursos encima de order me aparece toda la data que puedo usar como interfaz
- Importo el enum de prisma
- Creo orders-ms/interfaces/order.interface.ts

~~~js
import { OrderStatus } from "@prisma/client";


export interface OrderWithProducts {
    orderItem: {
        name: any;
        productId: number;
        quantity: number;
        price: number;
    }[];
    id: string;
    totalAmount: number;
    totalItems: number;
    status: OrderStatus;
    paid: boolean;
    paidAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}
~~~

- En orders-ms/orders.service.ts tenemos inyectado NATS por lo que ya podemos comunicarnos con payments-ms
- orders-ms/orders.service

~~~js
@Injectable()
export class OrdersService extends PrismaClient implements OnModuleInit{

  private readonly logger = new Logger("OrdersService")

  constructor(
    @Inject(NATS_SERVICE)
    private readonly client: ClientProxy
  ){
    super()
  }

  async onModuleInit() {
    await this.$connect()
    this.logger.log("Database connected!!")
  }


  {...code}
}
~~~

- Mando un payload cualquiera

~~~js
async createPaymentSession(order: OrderWithProducts){
const paymentSession = await firstValueFrom(
    this.client.send('create.payment.session', { 
    abc:123 //esto darña error porque está esperando el dto de PaymentSessionDto
    })
)

return paymentSession
}
~~~

- Apunto un POST localhost:3000/api/orders
- Con esto en el body

~~~json
{
    "items":[
        {
            "productId":1,
            "price": 35,
            "quantity": 2
        }
    ]
}
~~~

- Para que herede lo del class-validator y demás en una app híbrida debo añadir el *inherit*
- payments-ms/src/main.ts

~~~js
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { envs } from './config/envs';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(AppModule,{
    rawBody: true //esto va a mandar el body como un buffer
  });
  
  const logger = new Logger('Payments-ms')

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true
  }))

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.NATS,
    options:{
      servers:envs.natsServers
    },
    
  }, {inheritAppConfig: true}) //<--- AQUI

  await app.startAllMicroservices()

  await app.listen(envs.port);
  logger.log(`Server running on port ${envs.port}`)
}
bootstrap();
~~~

- Me lanza un error, porque en PaymentsController la creación tiene que cumplir estas especificaciones del DTO
- PaymentSessionDto

~~~js
import { Type } from "class-transformer";
import { ArrayMinSize, IsArray, IsNumber, IsPositive, IsString, ValidateNested } from "class-validator";

export class PaymentSessionDto{

    @IsString()
    currency: string

    @IsString()
    orderId: string

    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({each:true})
    @Type(()=>PaymentSessionItemDto)
    items: PaymentSessionItemDto[]
}

export class PaymentSessionItemDto{

    @IsString()
    name: string

    @IsNumber()
    @IsPositive()
    price: number

    @IsNumber()
    @IsPositive()
    quantity: number
}
~~~

- Vamos a mandarle lo que pide
- orders-ms/orders.service
-------
- **NOTA: ERRORES!**
- Había un error en validate_products del products.service

~~~js
async validateProducts(ids: number[]){
  ids = Array.from(new Set(ids));

  const products = await this.product.findMany({
    where: {
      id: { in: ids }
    }
  });

  if (products.length !== ids.length) {
    throw new RpcException({
      message: 'Some products were not found',
      status: HttpStatus.BAD_REQUEST
    });
  }

  return products; // AQUI!
}
~~~

- El problema es que validateProducts() solo validaba pero no retornaba los productos, por eso cuando intentabas acceder a product.price en orders.service.ts, fallaba.
- Porque en orders.service hay esto

~~~js
  async create(createOrderDto: CreateOrderDto) {
    try {
      //1.Confirmar los ids de los productos
      const productsIds = createOrderDto.items.map((item)=> item.productId) //extraigo los ids en un arreglo

      //llamo al microservicio para validar que existen los productos
      const products: any[]= await firstValueFrom(
        this.client.send({cmd:'validate_products'}, productsIds)
      )

      //2.Calculo de los valores          //en OrderItem tengo el precio
      const totalAmount = createOrderDto.items.reduce((acc, orderItem)=>{
        //necesito encontrar orderItem en el arreglo de productos
        //no quiero confiar en el precio del dto, uso el de los productos a través del id

        const price = products.find((product)=>product.id === orderItem.productId).price
        //Multiplica el precio del producto por la cantidad pedida y súmalo al acumulador (acc) que lleva el total hasta ahora
        return price * orderItem.quantity + acc
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
    }
  }
~~~

- Otro error era en el controller, que tenía ids:string[] cuando deben ser number!

~~~js
@MessagePattern({cmd:'delete_product'})
  remove(@Payload('id', ParseIntPipe) id: number) {
    return this.productsService.remove(+id);
  }
~~~

- **SOLUCIONADO!!**
----------

- ENTONCES, llamo al createPaymentSession desde orders.controller
- De esta manera me aseguro de que haya una orden para crear la sesión
- En la respuesta añado la orden, el paymentSessionDto y la respuesta de Stripe

~~~js
  @MessagePattern('createOrder')
  async create(@Payload() createOrderDto: CreateOrderDto) {
    //return this.ordersService.create(createOrderDto);

    const order = await this.ordersService.create(createOrderDto)
    const paymentSession = await this.ordersService.createPaymentSession(order)
   
    return{
      order,
      paymentSession: paymentSession.paymentSessionDto,
      stripeSession: paymentSession.stripeSession
    }
  }
~~~

- Le mando el dto desde orders-ms/orders.service

~~~js
 async createPaymentSession(order: OrderWithProducts) {
  
    const paymentSession = await firstValueFrom(
      this.client.send('create.payment.session', { //este objeto es el dto
        orderId: order.id,
        currency: 'usd',
        items: order.orderItem.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
        }))
      })
    );
    
    return paymentSession //aqui viene todo, la respuesta de stripe y el dto
}
~~~

- Entonces en el orders-ms/orders.service retorno el la sesión de stripe y el dto qu le estoy mandando a 'create.payment.session'

~~~js
  async createPaymentSession(order: OrderWithProducts) {
  
    const paymentSession = await firstValueFrom(
      this.client.send('create.payment.session', {
        orderId: order.id,
        currency: 'usd',
        items: order.orderItem.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
        }))
      })
    );
    
    return paymentSession
}
~~~

- El create.payment.session del controller de payments-ms

~~~js
//@Post('create-payment-session')
@MessagePattern('create.payment.session')
  createPaymentSession(@Payload() paymentSessionDto: PaymentSessionDto) {
    return this.paymentsService.createPaymentSession(paymentSessionDto)
}
~~~

- En el payments-ms/payments.service retorno el dto y la sesión de stripe

~~~js
async createPaymentSession(paymentSessionDto: PaymentSessionDto){
  const {currency, items, orderId} = paymentSessionDto

  const lineItems = items.map(({name, price, quantity})=>{
    return{
      price_data:{
        currency,
        product_data:{
          name
        },
        unit_amount: Math.round(price*100)
      },
      quantity
    }
  })

    const session = await this.stripe.checkout.sessions.create({
      //colocar aquí el id de mi order
      payment_intent_data:{
        metadata:{
          orderId: orderId
        }
      },

      //aqui van los items que la gente está comprando
      line_items:lineItems,
      mode: 'payment',
      success_url: 'http://localhost:3003/payments/success',
      cancel_url: 'http://localhost:3003/payments/cancel'
    }) 

    return {
    paymentSessionDto: paymentSessionDto,  
    stripeSession: session                 
  }
  }
~~~


## Retornar URLS de sesión


- Si ahora envío la orden con un POST a localhost:3000/api/orders me aparece el paymentSession en la respuesta 
- Mando este body

~~~json
{
    "items":[
        {
            "productId":2,
            "price": 35,
            "quantity": 2
        }
    ]
}
~~~

- Esta es la respuesta

~~~json
{
    "order": {
        "id": "1e5c9152-a12f-4a1a-b3c6-e069b842890e",
        "totalAmount": 240.4,
        "totalItems": 2,
        "status": "PENDING",
        "paid": false,
        "paidAt": null,
        "createdAt": "2025-08-22T14:37:47.556Z",
        "updatedAt": "2025-08-22T14:37:47.556Z",
        "orderItem": [
            {
                "price": 120.2,
                "quantity": 2,
                "productId": 2,
                "name": "Kombucha"
            }
        ]
    },
    "paymentSession": {
        "currency": "usd",
        "orderId": "1e5c9152-a12f-4a1a-b3c6-e069b842890e",
        "items": [
            {
                "name": "Kombucha", //EL DTO!
                "price": 120.2,
                "quantity": 2
            }
        ]
    },
    "stripeSession": {
        "id": "cs_test_a1DxulEwP1uyM8QW5xOStWB2Kkxb0XMSeZpUlQKfmrwCpyO5vmPbn0IHye",
        "object": "checkout.session",
        "adaptive_pricing": {
            "enabled": true
        },
        "after_expiration": null,
        "allow_promotion_codes": null,
        "amount_subtotal": 24040,
        "amount_total": 24040,
        "automatic_tax": {
            "enabled": false,
            "liability": null,
            "provider": null,
            "status": null
        },
        "billing_address_collection": null,
        "cancel_url": "http://localhost:3003/payments/cancel",
        "client_reference_id": null,
        "client_secret": null,
        "collected_information": null,
        "consent": null,
        "consent_collection": null,
        "created": 1755873902,
        "currency": "usd",
        "currency_conversion": null,
        "custom_fields": [],
        "custom_text": {
            "after_submit": null,
            "shipping_address": null,
            "submit": null,
            "terms_of_service_acceptance": null
        },
        "customer": null,
        "customer_creation": "if_required",
        "customer_details": null,
        "customer_email": null,
        "discounts": [],
        "expires_at": 1755960302,
        "invoice": null,
        "invoice_creation": {
            "enabled": false,
            "invoice_data": {
                "account_tax_ids": null,
                "custom_fields": null,
                "description": null,
                "footer": null,
                "issuer": null,
                "metadata": {},
                "rendering_options": null
            }
        },
        "livemode": false,
        "locale": null,
        "metadata": {},
        "mode": "payment",
        "origin_context": null,
        "payment_intent": null,
        "payment_link": null,
        "payment_method_collection": "if_required",
        "payment_method_configuration_details": {
            "id": "pmc_1RhY83RdtV1rEpQ2pmqNJrKN",
            "parent": null
        },
        "payment_method_options": {
            "card": {
                "request_three_d_secure": "automatic"
            }
        },
        "payment_method_types": [
            "card",
            "link"
        ],
        "payment_status": "unpaid",
        "permissions": null,
        "phone_number_collection": {
            "enabled": false
        },
        "recovered_from": null,
        "saved_payment_method_options": null,
        "setup_intent": null,
        "shipping_address_collection": null,
        "shipping_cost": null,
        "shipping_options": [],
        "status": "open",
        "submit_type": null,
        "subscription": null,
        "success_url": "http://localhost:3003/payments/success",
        "total_details": {
            "amount_discount": 0,
            "amount_shipping": 0,
            "amount_tax": 0
        },
        "ui_mode": "hosted",
        "url": "https://checkout.stripe.com/c/pay/cs_test_a1DxulEwP1uyM8QW5xOStWB2Kkxb0XMSeZpUlQKfmrwCpyO5vmPbn0IHye#fidkdWxOYHwnPyd1blpxYHZxWjA0V21cMnNXYXFTNHdAdVQ3UGB9aHJRZ2F8fHFIQGE2YGhxQEtHTkZhTjB0fEs3Z0pBcHJscEZya3Jxa2xvZDVXQjFVSXJCXTJ9YmxoNkhAcjA1Q2l2T0d1NTViX0J8TlNwaScpJ2N3amhWYHdzYHcnP3F3cGApJ2lkfGpwcVF8dWAnPyd2bGtiaWBabHFgaCcpJ2BrZGdpYFVpZGZgbWppYWB3dic%2FcXdwYHgl",
        "wallet_options": null
    }
}
~~~

- Hay demasiada data, regresemos solo lo que queremos del payments.service

~~~js
async createPaymentSession(paymentSessionDto: PaymentSessionDto){
  const {currency, items, orderId} = paymentSessionDto

  const lineItems = items.map(({name, price, quantity})=>{
    return{
      price_data:{
        currency,
        product_data:{
          name
        },
        unit_amount: Math.round(price*100)
      },
      quantity
    }
  })

    const session = await this.stripe.checkout.sessions.create({
      //colocar aquí el id de mi order
      payment_intent_data:{
        metadata:{
          orderId: orderId
        }
      },

      //aqui van los items que la gente está comprando
      line_items:lineItems,
      mode: 'payment',
      success_url: 'http://localhost:3003/payments/success',
      cancel_url: 'http://localhost:3003/payments/cancel'
    }) 

    return {
    cancelUrl: session.cancel_url,
    successUrl: session.success_url,
    url: session.url                
    }
  }
~~~

- Modifico el orders-ms/orders.controller

~~~js
 @MessagePattern('createOrder')
  async create(@Payload() createOrderDto: CreateOrderDto) {
    //return this.ordersService.create(createOrderDto);

    const order = await this.ordersService.create(createOrderDto)
    const paymentSession = await this.ordersService.createPaymentSession(order)
   
    return{
      order,
      paymentSession
    }
  }
~~~

- Ahora me da la respuesta más escueta

~~~json
{
    "order": {
        "id": "8b7df81a-9afb-4fd5-8b2e-871551b02ac7",
        "totalAmount": 240.4,
        "totalItems": 2,
        "status": "PENDING",
        "paid": false,
        "paidAt": null,
        "createdAt": "2025-08-22T14:50:49.433Z",
        "updatedAt": "2025-08-22T14:50:49.433Z",
        "orderItem": [
            {
                "price": 120.2,
                "quantity": 2,
                "productId": 2,
                "name": "Kombucha"
            }
        ]
    },
    "paymentSession": {
        "cancelUrl": "http://localhost:3003/payments/cancel",
        "successUrl": "http://localhost:3003/payments/success",
        "url": "https://checkout.stripe.com/c/pay/cs_test_a18H1CKIlxOnfoOPBp1RQXpJ7Y8FfXe3iwCq0w4QDZoHb4PX2T9HIheflj#fidkdWxOYHwnPyd1blpxYHZxWjA0V21cMnNXYXFTNHdAdVQ3UGB9aHJRZ2F8fHFIQGE2YGhxQEtHTkZhTjB0fEs3Z0pBcHJscEZya3Jxa2xvZDVXQjFVSXJCXTJ9YmxoNkhAcjA1Q2l2T0d1NTViX0J8TlNwaScpJ2N3amhWYHdzYHcnP3F3cGApJ2lkfGpwcVF8dWAnPyd2bGtiaWBabHFgaCcpJ2BrZGdpYFVpZGZgbWppYWB3dic%2FcXdwYHgl"
    }
}
~~~

- Ahora cuando se crea la orden (tenemos el listener en orders) se llama a payments que se comunica con stripe
- Esto es la FASE 1
- Una vez hecho el pago en STripe tenemos que asegurarnos de implementar la comunicación con el webhook
- Va a ser el webhook quien se va a comunicar no payments, hablar con NATS, decirle a orders que la orden está pagada, entonces marcar la orden como pagada si el webhook me lo dice
- También quisiera saber el id del recibo
- **Primera fase completada**

## Hookdeck - Levantar proxy y forwarder


- Si la red de Docker no lee los cambios probar con

> "start:dev": "nest start --watch --poll 1000"

- Para hacer login en hookdeck usar

> hookdeck login

- Para que escuche usar

> hookdeck listen 3003

- Es el puerto 3003  que es dónde corre el payments-ms
- Seleccionar el proyecto a escuchar, en este caso stripe-to-localhost
- Para recordar cómo configurar Hookdeck
  - Create connection
  - Name: stripe-to-localhost
  - Type connection: CLI
  - Configure destination: /payments/webhook
  - Create
  - Ejecuto el comando en CMD: hookdeck listen 3003 stripe-to-localhost
  - En consola me dará una URL tipo stripe-to-localhost URL: https://hkdk.events/l8hjiw3h5gos1y
  - Esta URL es la que usaré en STRIPE
    - Voy a Webhooks de Stripe y lo uso como Endpoint URL
  - En Stripe/Webhooks/Eventos tengo el botón de reenviar (para no hacer todo el proceso)
- Cuando se paga, Stripe nos va a hablar por nuestro webhook
- El webhook va a caer en el payments-ms, y el payments-ms va a mandar la notificación a los interesados, en este caso orders-ms para que marque la orden cómo pagada. También quiero guardar cierta información del pago
- Realizo de nuevo todo el proceso:
  - Apunto a :3000/api/orders
~~~json
{
    "items":[
        {
            "productId":2,
            "price": 35,
            "quantity": 2
        }
    ]
}
~~~
- Realizo el pago dándole al link de stripe, tarjeta de crédito 4242424242424242
- En payments-ms/payments/payments.service.ts tengo el console.log en el StripeWebhook

~~~js
  async stripeWebhook(req: Request, res: Response) {
    const sig = req.headers['stripe-signature']!;

    let event: Stripe.Event;

    
    const endpointSecret = envs.endpointSecret

    try {
      event = this.stripe.webhooks.constructEvent(
        req['rawBody'],
        sig,
        endpointSecret,
      );
    } catch (err) {
      res.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }
    
    //console.log({event})
    switch( event.type ) {
      case 'charge.succeeded': 
        const chargeSucceeded = event.data.object;
        const payload = {
          stripePaymentId: chargeSucceeded.id,
          orderId: chargeSucceeded.metadata.orderId,
          receiptUrl: chargeSucceeded.receipt_url,
        }

      console.log({ //---------> AQUí!!!
        metadata: chargeSucceeded.metadata,
        orderId: chargeSucceeded.metadata.orderId
      })

      break;

      
      default:
        console.log(`Event ${ event.type } not handled`);
    }

    return res.status(200).json({ sig });
  }
~~~

- Este console.log lo necesito ver para asegurarme de que se está comunicando correctamente, ya que en este punto es donde necesito establecer la comunicación con orders-ms a través de NATS
- Extraeremos el URL del recibo para almacenarlo en la DB
- NOTA: si no detecta los cambios la red de Docker, prueba en el package.json de cada microservicio poner en el start:dev
>"start:dev": nest start --watch --poll 2000 --legacy-watch

## EventPattern - Emitir eventos

- Para comunicarme con orders-ms desde payments-ms necesito configurar NATS en payments-s
- Para ello copio la carpeta transports y la copio en src/
- Contiene nats.module.ts

~~~js
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

- En config/services.ts creo el token de inyección

~~~js
export const NATS_SERVICE = 'NATS_SERVICE'
~~~

- Importo el modulo de NATS en payments-ms/payments.module

~~~js
import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { NatsModule } from 'src/transports/nats.module';

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService],
  imports: [NatsModule]
})
export class PaymentsModule {}
~~~

- Ahora ya puedo usar el ClientProxy en el payments.service
- Creo un logger si no lo he creado ya

~~~js
import { Inject, Injectable, Logger } from '@nestjs/common';
import { envs } from 'src/config/envs';
import Stripe from 'stripe';
import { PaymentSessionDto } from './dto/payment-session.dto';
import {Request, Response} from 'express'
import { ClientProxy } from '@nestjs/microservices';
import { NATS_SERVICE } from 'src/config/services';


@Injectable()
export class PaymentsService {

  private readonly stripe = new Stripe(envs.stripeSecret);
  private readonly logger = new Logger('PaymentsService');

  constructor(
    @Inject(NATS_SERVICE) private readonly client: ClientProxy
  ){}

  {...}
}
~~~

- Ahora ya puedo emitir y comunicarme con NATS
- Creo el payload que enviaré 

~~~js
async stripeWebhook(req: Request, res: Response) {
    const sig = req.headers['stripe-signature']!;

    let event: Stripe.Event;

    
    const endpointSecret = envs.endpointSecret

    try {
      event = this.stripe.webhooks.constructEvent(
        req['rawBody'],
        sig,
        endpointSecret,
      );
    } catch (err) {
      res.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }
    
    //console.log({event})
    switch( event.type ) {
      case 'charge.succeeded': 
        const chargeSucceeded = event.data.object;
        const payload = {
          stripePaymentId: chargeSucceeded.id,
          orderId: chargeSucceeded.metadata.orderId,
          receiptUrl: chargeSucceeded.receipt_url,
        }

        this.client.emit('payment.succeeded', payload) //<--- AQUI!

      break;

      
      default:
        console.log(`Event ${ event.type } not handled`);
    }

    return res.status(200).json({ sig });
  }
~~~

- Todavía no tengo a nadie escuchando el 'payment.succeeded'
- Lo creo en orders-ms/orders.controller

~~~js
@EventPattern('payment.succeeded')
  paidOrder(@Payload() paidOrderDto: any){
    console.log({paidOrderDto})
    return;
}
~~~

- Debería poder ver el payload en consola al hacer un pago
- Lo veo desde orders-ms
- El emit no espera respuesta
- Ahora lo que hay que hacer es marcar cómo pagada esta orden, almacenar la información del payload (el recibo de pago, el orderId)
- En fin, actualizar la DB como se hace habitualmente

## Preparar base de datos y PaidOrderDto

- En la Db de orders tenemos paid en FALSE por defecto y STATUS como PENDING por defecto
- También está paidAt que corresponde a la fecha en la cual se pagó con NULL
- No deberíamos tener NULL, sino crear una tabla independiente con relación OneToOne con orders
- Vamos a almacenar los recibos en una tabla independiente y en la tabla de orders voy a añadir stripeId que si no está pagado tendrá NULL
- En orders-ms modifico el schema.prisma y añado el PAID en el enum y el stripeChargeId como string opcional

~~~prisma

generator client {
  provider = "prisma-client-js"
  binaryTargets = ["native", "linux-musl-openssl-3.0.x"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum OrderStatus {
  PENDING
  PAID //<--- Añado PAID
  DELIVERED
  CANCELED
}

model Order {
  id            String  @id  @default(uuid())
  totalAmount   Float
  totalItems    Int
  status        OrderStatus @default(PENDING)
  paid Boolean  @default(false)
  paidAt        DateTime?
  stripeChargeId String? //<---- Añado esto como opcional

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

- Es lo que en el payload anterior he añadido como stripePaymentId
  - Se que es el charge porque el string empieza con ch_
- Para guardar el recibo de stripe en otra tabla creo un nuevo modelo
- Tengo que especificar que el orderId es un id único para permitir la relación uno a uno (que lo pongo como ? en OrderReceipt)
- Uso @unique, así es como establezco una relación uno a uno, añadiendo ? y @unique (además de la declaración con @relation, claro!)

~~~prisma

generator client {
  provider = "prisma-client-js"
  binaryTargets = ["native", "linux-musl-openssl-3.0.x"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum OrderStatus {
  PENDING
  PAID 
  DELIVERED
  CANCELED
}

model Order {
  id            String  @id  @default(uuid())
  totalAmount   Float
  totalItems    Int
  status        OrderStatus @default(PENDING)
  paid Boolean  @default(false)
  paidAt        DateTime?
  stripeChargeId String? 

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  OrderItem     OrderItem[]
  OrderReceipt  OrderReceipt?
}

model OrderItem{
  id   String @id  @default(uuid())
  productId Int  //no hay una relación física con SQLite
  quantity Int
  price Float //los precios pueden variar. Este precio se queda aquí en el momento de la orden
  
  Order Order? @relation(fields: [orderId], references: [id]) //establezco la relación
  orderId String?
}

model OrderReceipt{
  id String @id @default(uuid())
  order Order @relation(fields: [orderId], references: [id])
  orderId String @unique
  receiptUrl String

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
~~~

- Para impactar la Db y generar la migración, en la carpeta de orders-ms

> npx prisma migrate dev --name stripe-pay

- En el .env de orders-ms tengo expuesto el puerto 5432

> DATABASE_URL="postgresql://postgres:123456@localhost:5432/ordersdb?schema=public"

- Borra la carpeta de postgres de orders-ms si da error
- Puedo comprobar en TablePlus que se hayan reconocido los cambios
- Creemos el DTO dentro de orders-ms en src/orders/dto/paid-order.dto.ts
- Necesito colocar los tres valores del payload

~~~js
import { IsString, IsUrl, IsUUID } from "class-validator"

export class PaidOrderDto{
    @IsString()
    stripePaymentId: string
    
    @IsString()
    @IsUUID()
    orderId: string
    
    @IsString()
    @IsUrl()
    receiptUrl: string
}
~~~

- Ahora solo queda grabar en db cuando se suceda el webhook

## Actualizar order como pagada

- En orders-ms/orders.controller ya puedo tipar el dto
- Debemos crear el método paidOrder en el servicio

~~~js
@EventPattern('payment.succeeded')
  paidOrder(@Payload() paidOrderDto: PaidOrderDto){
    
    return this.ordersService.paidOrder(paidOrderDto)
  }
~~~

- En el orders-ms/orders.service
- *NOTA*: he cambiado orderItem en el schema por OrderItem! cambiar
- Dentro de la data, como tengo una relación uno a uno con OrderReceipt, puedo crear el receiptUrl
- Si el OrderReceipt falla, el status y el paid, etc, también (como si usara thi.$transaction, hace un roll-back)
- El retorno da igual, porque estoy usando el @EventPattern
- **Se puede usar simultáneamente el @EventPattern y el @MessagePattern sin problema**
- Si tiene también el @MessagePattern si va a esperar una respuesta

~~~js
async paidOrder(paidOrderDto:PaidOrderDto){
    this.logger.log('Paid Order')
    this.logger.log(paidOrderDto)

    const order = await this.order.update({
      where: {id: paidOrderDto.orderId}, //el id tiene que hacer match
      data:{
        status: 'PAID',
        paid: true,
        paidAt: new Date(),
        stripeChargeId: paidOrderDto.stripePaymentId,

        OrderReceipt:{
          create:{
            receiptUrl: paidOrderDto.receiptUrl
          }
        }
      }
    })

    return order
}
~~~

- Para que los cambios de prisma hagan efecto debo volver a construir con docker compose build, ya que en el docker-compose.yml tengo asociada la carpeta src, y prisma está un nivel por encima
- Ahora, haciendo una orden a localhost:3000/api/orders y le doy clic al paymentSession/url de la respuesta, realizo el pago poniendo 4242 4242 4242 en la tarjeta debería aparecer como PAID!!
- Puedo quitar los logs de orders-ms/orders.service


