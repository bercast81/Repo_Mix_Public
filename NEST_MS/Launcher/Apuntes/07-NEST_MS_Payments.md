# 07 NEST_MS - Payments

- Estableceré y configuararé la coenxión con Stripe. La secert-key es una variable de entorno que generaré en la web de Stripe y le pasaré a la nueva instancia de Stripe en el servicio tras validarla con joi
- Stripe hará lo que tenga que hacer (puede realizar el pago o cancelar) y mediante un webhook lo confirmaré

## Configuración

- Creo una API (todavía no va a ser un microservicio) con **nest new payments-ms**
- Borro el app.controller y el app.service, lso quito del app.module
- Creo el archivo config/envs, para ello instalo dotenv y joi

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
    port: envVars.PORT,
}
~~~

- En payments-ms/.env

~~~
PORT=3003
~~~

- Creemos un logger en el main de payments-ms

~~~js
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { envs } from './config/envs';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Payments-ms')
  await app.listen(envs.port);
  logger.log(`Server running on port ${envs.port}`)
}
bootstrap();
~~~

- Creo el módulo Payments con **nest g res payments**, de momento como REST API 
- Creo unos métodos en el controller

~~~js
import { Controller, Get, Post } from '@nestjs/common';
import { PaymentsService } from './payments.service';


@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create-payment-session')
  createPaymentSession() {
    return this.paymentsService.createPaymentSession()
  }

  @Get('success')
  success() {
    return this.paymentsService.success();
  }

  @Get('cancel')
  cancel() {
    return this.paymentsService.cancel();
  }

  @Post('webhook')
  async stripeWebhook(){
    return this.paymentsService.stripeWebhook()
  }

}
~~~

- Creo los servicios correspondientes para que no de error de compilación al levantar el server
- Creo la instancia de Stripe y un logger, instalo con **npm i stripe**

~~~js
import { Injectable, Logger } from '@nestjs/common';
import { envs } from 'src/config/envs';
import Stripe from 'stripe';

@Injectable()
export class PaymentsService {

  private readonly stripe = new Stripe(envs.stripeSecret);
  private readonly logger = new Logger('PaymentsService');



  createPaymentSession(){

  }

  success(){

  }

  cancel(){

  }

  stripeWebhook(){

  }
}
~~~

- Añado la validación de la variable de entorno a paymenst-ms/config/envs.ts

~~~js
import 'dotenv/config'
import * as joi from 'joi'


interface EnvVars{
    PORT: number
    STRIPE_SECRET_KEY: string
}

const envsSchema = joi.object({
    PORT: joi.number().required(),
    STRIPE_SECRET_KEY: joi.string().required()
})
.unknown(true) //hay muchas variables más del entorno como el path de node, etc


const {error, value}= envsSchema.validate(process.env)

if(error){
    throw new Error(`Config validation error: ${error.message}`)
}

const envVars: EnvVars = value


export const envs={
    port: envVars.PORT,
    stripeSecret: envVars.STRIPE_SECRET_KEY
}
~~~

- Para configurar Stripe y obtener la secret_key debo poner Stripe en modo test y acudir al apartado Developer una vez logueado

## Crear sesión de pago

- En payments-ms/payments.service.ts creo el método createPaymentSession

~~~js
async createPaymentSession(){
const session = await this.stripe.checkout.sessions.create({
    //colocar aquí el id de mi order
    payment_intent_data:{
    metadata:{
        order_id: 'order123456'
    }
    },

    //aqui van los items que la gente está comprando
    line_items:[
    {
        price_data:{
        currency: 'eur',
        product_data:{
            name: 'T-shirt'
        },
        unit_amount: 2000 //esto equivale a 20 eur, no permite decimales
        },
        quantity: 2 //20*2 = 40 eur
    }
    ],
    mode: 'payment',
    success_url: 'http://localhost:3003/payments/success',
    cancel_url: 'http://localhost:3003/payments/cancel'
}) 

return session
}

success(){
    return "Pago completado"
  }

  cancel(){
    return "Pago cancelado"
  }
~~~


- Apunto con POST a localhost:3000/payments/create-payment-session 
- Me devuelve esto en la respuesta

~~~json
{
  "id": "cs_test_a1a0UnZ8n1nrUI4fgUWxzlr8B3kxgwBpjpJ6r6VZasFRcuXYivjbDLEOSv",
  "object": "checkout.session",
  "adaptive_pricing": {
    "enabled": true
  },
  "after_expiration": null,
  "allow_promotion_codes": null,
  "amount_subtotal": 4000,
  "amount_total": 4000,
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
  "created": 1751730519,
  "currency": "eur",
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
  "expires_at": 1751816919,
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
    "bancontact",
    "eps",
    "klarna",
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
  "success_url": "http://localhost:3003/payments/sucess",
  "total_details": {
    "amount_discount": 0,
    "amount_shipping": 0,
    "amount_tax": 0
  },
  "ui_mode": "hosted",
  "url": "https://checkout.stripe.com/c/pay/cs_test_a1a0UnZ8n1nrUI4fgUWxzlr8B3kxgwBpjpJ6r6VZasFRcuXYivjbDLEOSv#fidkdWxOYHwnPyd1blpxYHZxWjA0V21cMnNXYXFTNHdAdVQ3UGB9aHJRZ2F8fHFIQGE2YGhxQEtHTkZhTjB0fEs3Z0pBcHJscEZya3Jxa2xvZDVXQjFVSXJCXTJ9YmxoNkhAcjA1Q2l2T0d1NTViX0J8TlNwaScpJ2N3amhWYHdzYHcnP3F3cGApJ2lkfGpwcVF8dWAnPyd2bGtiaWBabHFgaCcpJ2BrZGdpYFVpZGZgbWppYWB3dic%2FcXdwYHgl",
  "wallet_options": null
}
~~~

- Si le doy a la url del final me da la opción de pagar los 40 euros de las camisetas
- Relleno los datos con datos ficticios 4242 4242 4242 4242 para la tarjeta

## PaymentSession DTO

- en lugar de poner la información en duro, los datos vendrán de otro microservicio
- Para trabajar con dtos hay que instalar el class-validator y el class-transformer, además de una pequeña configuración en el main
- payments-ms/main.ts

~~~js
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { envs } from './config/envs';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Payments-ms')

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true
  }))

  await app.listen(envs.port);
  logger.log(`Server running on port ${envs.port}`)
}
bootstrap();
~~~

- El PaymentSessionDTo

~~~js
import { Type } from "class-transformer";
import { ArrayMinSize, IsArray, IsNumber, IsPositive, IsString, ValidateNested } from "class-validator";

export class PaymentSessionDto{

    @IsString()
    currency: string

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

- En el controller

~~~js
@Post('create-payment-session')
createPaymentSession(@Body() paymentSessionDto: PaymentSessionDto) {
  return this.paymentsService.createPaymentSession(paymentSessionDto)
}
~~~

- Debo pasarle el objeto en POSTMAN

~~~json
{
  "currency": "eur",
  "items":[
    {
      "name": "Preservativos",
      "price": 18.03,
      "quantity": 1
    }
  ]
}
~~~

- En el service desestructuro y hago un .map de items
- Como el precio puede venir en decimales uso Math.round para redondear y debo añadir 2 ceros

~~~js
async createPaymentSession(paymentSessionDto: PaymentSessionDto){

  const {currency, items} = paymentSessionDto

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
          order_id: 'order123456'
        }
      },

      //aqui van los items que la gente está comprando
      line_items:lineItems,
      mode: 'payment',
      success_url: 'http://localhost:3003/payments/success',
      cancel_url: 'http://localhost:3003/payments/cancel'
    }) 

    return session
  }
~~~

- Ahora falta configurar el webhook para ser motificados cuando el pago se haya realizado

## Probando webhooks de Stripe

- Cuando realizo un pago, Stripe mediante un POST manda a llamar el webhook y lo envía a mi endpoint
- Tengo que controlar que lleve la firma de Stripe
- En la web de Stripe, voy a Developers/webhooks (hay muchos)
- Añadir punto de conexión, podemos probar test in a local environment o directamente en un endpoint
- Para el test in a local environment hay que instalar el cliente de Stripe (un zip, darle al exe y configurar el path)
  - Se puede hacer a través de Docker 
- Usaré un endpoint real directamente, selecciono los eventos a escuchar
- Al lado derecho tenemos el código a implementar
- Usa Express (y nosotros también, por debajo de Nest)
- Dice que mandemos el body como un raw y eso puede ser un poco tedioso si queremos crear un middleware, pero Nest facilita mucho la faena
- En el main, en app, coloco el rawBody en true
- main.ts

~~~js
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { envs } from './config/envs';

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

  await app.listen(envs.port);
  logger.log(`Server running on port ${envs.port}`)
}
bootstrap();
~~~

- En el controller ocupo la Request y la Response de express

~~~js
@Post('webhook')
async stripeWebhook(@Req() req: Request, @Res() res: Response  ){
  return this.paymentsService.stripeWebhook(req,res)
}
~~~

- En el service

~~~js
stripeWebhook(req: Request, res: Response){
    const sig = req.headers['stripe-signature'] 
    return res.status(200).json({sig})
}
~~~

## Implementar el webhook

- Si procesamos el body vamos a tener un error, porque Stripe lo verifica
- Por eso lo tomamos directamente de la Request
- En Listen to Strip Events en la web de Stripe debería colocar el endpoint de mi web

> https://ismael-beron.com/api/stripe/webhook

- Creo una cuenta en hookdeck
- Creo una nueva conexión
- SourceName = stripe-to-localhost
- Source-type = webhook
- DestinationName= to-localhost
- DestinationType = CLI, porque lo que quiero es hacer un forward de mi localhost hacia ese endpoint
- CLI-Path=/payments/webhook
- Le doy a crear
- Me devuelve este link

> https://hkdk.events/l8hjiw3h5gos1y

- Y me indica los pasos a seguir (instalar el CLI, etc)

> npm install hookdeck-cli -g //ejecutar como admin
> hookdeck login
> hookdeck listen PORT stripe-to-localhost

- Coloco el link en Stripe en crear Webhook (selecciono solo el charge.succeded)
- Lo llamo nest-payments, en la descripción coloco Stripe to localhost /payments/webhook
- Visualizo el secreto de firma (lo coloco en .env)

~~~
ENDPOINT_SECRET=whsec_0nstppGGJsFtlYIrerjx1uQLyG7PiydE
~~~

- Lo coloco en el payments.service

~~~js
async stripeWebhook(req: Request, res: Response) {
    const sig = req.headers['stripe-signature']!;

    let event: Stripe.Event; //si quiero ver el event hago un console.log

    // Real
    const endpointSecret ="whsec_0nstppGGJsFtlYIrerjx1uQLyG7PiydE";

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
    
    switch( event.type ) {
      case 'charge.succeeded': 
        const chargeSucceeded = event.data.object;
        const payload = {
          stripePaymentId: chargeSucceeded.id,
          orderId: chargeSucceeded.metadata.orderId,
          receiptUrl: chargeSucceeded.receipt_url,
        }

      this.logger.log(payload) //hago un log del payload
      break;
      
      default:
        console.log(`Event ${ event.type } not handled`);
    }

    return res.status(200).json({ sig });
  }
~~~

- 

- El proceso es ir al POST localhost:3003/payments/create-payment-session con un objeto como este

~~~json
{
  "currency": "usd",
  "items":[
    {
      "name": "Teclado",
      "price": 100,
      "quantity": 1
    }
  ]
}
~~~

- Me devuelve esto

~~~json
{
  "id": "cs_test_a1TYnBZkpTfN0vjBLbhiL0Uroof0iMGqRH96swIs0OPj7nmQ1Yn82UPrdZ",
  "object": "checkout.session",
  "adaptive_pricing": {
    "enabled": true
  },
  "after_expiration": null,
  "allow_promotion_codes": null,
  "amount_subtotal": 10000,
  "amount_total": 10000,
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
  "created": 1751884947,
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
  "expires_at": 1751971347,
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
  "url": "https://checkout.stripe.com/c/pay/cs_test_a1TYnBZkpTfN0vjBLbhiL0Uroof0iMGqRH96swIs0OPj7nmQ1Yn82UPrdZ#fidkdWxOYHwnPyd1blpxYHZxWjA0V21cMnNXYXFTNHdAdVQ3UGB9aHJRZ2F8fHFIQGE2YGhxQEtHTkZhTjB0fEs3Z0pBcHJscEZya3Jxa2xvZDVXQjFVSXJCXTJ9YmxoNkhAcjA1Q2l2T0d1NTViX0J8TlNwaScpJ2N3amhWYHdzYHcnP3F3cGApJ2lkfGpwcVF8dWAnPyd2bGtiaWBabHFgaCcpJ2BrZGdpYFVpZGZgbWppYWB3dic%2FcXdwYHgl",
  "wallet_options": null
}
~~~

- Doy a la url de pagar (la última) y hago el pago , numero de tarjeta 4242 4242 4242 4242
- Si voy a Stripe veo en webhooks 1, y en Hookdeck también veo en verde 1 (Accepted)
- En el despliegue solo tendré que editar el Endpoint URL del webhook por el mio de producción

## Enviar y recibir el id de la orden

- Recuerda hacer login en hookdeck

> hookdeck login

- Levanto el launcher con **docker compose up**
- ¿Cómo hacemos match con la orden de pago y el orderId?
- Necesito saber el orderId que estoy creando en orders-ms (UUID), para conectar y que STRIPE me diga qué orden fue la que se pagó
- Hay un recibo 'receipt' en la respuesta al crear la sesión de pago
  - Está en Stripe/ buscar -> webhooks/ Eventos -> hay una terminal a la derecha, ahí está el recibo
  - Algo así

~~~json
"receipt_url": 
"https://pay.stripe.com/receipts/payment/CAcaFwoVYWNjdF8xUmhZN3ZSZHRWMXJFcFEyKJXDjMUGMgYqoFMubLI6LBa4o7no8G6HX4Kjv_pllMOAjMNidhAxJ3YlQY_y4PwnrLHGC0hEkvkUiPHs"
~~~

- Vamos al PaymentSessionDto de payments-ms

~~~js
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
~~~

- Ahora coloco un orderId temporal en el objeto al hacer el POST a payments/create-payment-session

~~~json
{
  "currency": "usd",
  "orderId": "XYZ123",
  "items":[
    {
      "name": "Burbujas",
      "price": 350,
      "quantity": 1
    }
  ]
}
~~~

- Desestructuro el orderId desde el servicio de payments-ms/payments.service
- Lo coloco en la metadata
- Puedo recibir la metadata en el stripeWebhook

~~~js
import { Injectable, Logger } from '@nestjs/common';
import { envs } from 'src/config/envs';
import Stripe from 'stripe';
import { PaymentSessionDto } from './dto/payment-session.dto';
import {Request, Response} from 'express'

@Injectable()
export class PaymentsService {

  private readonly stripe = new Stripe(envs.stripeSecret);
  private readonly logger = new Logger('PaymentsService');



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
      payment_intent_data:{
        metadata:{
          orderId: orderId //<---- Coloco el orderId en la METADATA
        }
      },

      line_items:lineItems,
      mode: 'payment',
      success_url: 'http://localhost:3003/payments/success',
      cancel_url: 'http://localhost:3003/payments/cancel'
    }) 

    return session
  }

  success(){
      return `Order completed!`
  }

  cancel(){
    return `Order canceled!`
  }

  async stripeWebhook(req: Request, res: Response) {
    const sig = req.headers['stripe-signature']!;

    let event: Stripe.Event;

    // Real
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

      console.log({
        metadata: chargeSucceeded.metadata //<----METADATA!
      })
      
      break;

      
      default:
        console.log(`Event ${ event.type } not handled`);
    }

    return res.status(200).json({ sig });
  }
}
~~~

- Hago todo el ciclo completo (POST a 3003:payments/create-payment-session) con el objeto, ahora con el orderId

~~~json
{
  "currency": "usd",
  "orderId": "XYZ123",
  "items":[
    {
      "name": "Burbujas",
      "price": 350,
      "quantity": 1
    }
  ]
}
~~~

- Tengo la consola escuchando con

> hookdeck listen 3003 stripe-to-localhost

- Me devuelve un 200 y en consola tengo

~~~
{ metadata: { orderId: 'XYZ123' } }
~~~

- Puedo obtener específicamente la de orderId (si hubiera más metadata) colocando en el console.log

~~~js
console.log({
  orderId: chargeSucceeded.metadata.orderId
})
~~~

- Puedo usar el botón de reenviar el evento desde la consola de Stripe en Workbench/Eventos para no tener que estar haciendo el ciclo completo desde POSTMAN con el POST, etc
- Ahora lo que hace falta es integrar este microservicio con los demás
- El archivo envs de payments-ms de payments/config/envs queda así

~~~js
import 'dotenv/config'
import * as joi from 'joi'


interface EnvVars{
    PORT: number
    STRIPE_SECRET_KEY: string
    ENDPOINT_SECRET: string
}

const envsSchema = joi.object({
    PORT: joi.number().required(),
    STRIPE_SECRET_KEY: joi.string().required(),
    ENDPOINT_SECRET: joi.string().required()
})
.unknown(true) //hay muchas variables más del entorno como el path de node, etc


const {error, value}= envsSchema.validate(process.env)

if(error){
    throw new Error(`Config validation error: ${error.message}`)
}

const envVars: EnvVars = value


export const envs={
    port: envVars.PORT,
    stripeSecret: envVars.STRIPE_SECRET_KEY,
    endpointSecret: envVars.ENDPOINT_SECRET
}
~~~
------------------------------