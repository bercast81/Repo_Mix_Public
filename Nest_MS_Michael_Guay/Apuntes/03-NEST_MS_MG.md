# 03 MICROSERVICIOS MICHAEL GUAY - STRIPE

## STRIPE

- En sleepr/

> nest g app payments

- Copio el Dockerfile de reservations y lo pego en payments, solo cambia el comando del final

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

                        ##AQUI!
CMD ["node", "dist/apps/payments/main"]
~~~

- En docker-compose.yaml duplico el servicio de auth y lo modifico para payments

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
  payments:
    build:
      context: .
      dockerfile: ./apps/payments/Dockerfile
      target: development
    command: npm run start:dev payments
    env_file:
      - ./apps/payments/.env
    ports: 
      - '3003:3003'
    volumes:
      - .:/usr/src/app
~~~

- Creo el apps/payments/.env

~~~
PORT=3003
~~~

- En sleepr/

> docker compose up

- Vamos a convertir el módulo de payments en un microservicio aislado
- Copio el ConfigModule de auth.module y lo pego en payments.module. dejo solo el PORT

~~~js
import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';

@Module({
  imports: [   ConfigModule.forRoot({
    isGlobal: true,
    validationSchema: Joi.object({
      PORT: Joi.string().required(),
    })
  })],
  controllers: [PaymentsController],
  providers: [PaymentsService],
})
export class PaymentsModule {}
~~~

- apps/payments/main.ts

~~~js
import { NestFactory } from '@nestjs/core';
import { PaymentsModule } from './payments.module';
import { Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
 const app = await NestFactory.create(PaymentsModule)
 const configService = app.get(ConfigService)
app.connectMicroservice({
  transport: Transport.TCP,
  options:{
    host: '0.0.0.0',
    port: configService.get('PORT')
  }
})

  await app.startAllMicroservices()
}
bootstrap();
~~~

- Importo el LoggerModule  de @app/common en el payments.module

~~~js
import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { LoggerModule } from '@app/common';

@Module({
  imports: [   ConfigModule.forRoot({
    isGlobal: true,
    validationSchema: Joi.object({
      PORT: Joi.string().required(),
    })
  }),
  LoggerModule
],
  controllers: [PaymentsController],
  providers: [PaymentsService],
})
export class PaymentsModule {}
~~~

- Tengo que especificar en el main de payments que uso el Logger de nestjs-pino

~~~js
import { NestFactory } from '@nestjs/core';
import { PaymentsModule } from './payments.module';
import { Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';

async function bootstrap() {
 const app = await NestFactory.create(PaymentsModule)
 const configService = app.get(ConfigService)

app.connectMicroservice({
  transport: Transport.TCP,
  options:{
    host: '0.0.0.0',
    port: configService.get('PORT')
  }
})

  app.useLogger(app.get(Logger))

  await app.startAllMicroservices()
}
bootstrap();
~~~

- El siguiente paso es abrir una cuenta en Stripe
- Obtengo una clave pública y una clave privada
- En sleepr instalo

> npm i stripe

> docker compose up

- Inicialicemos el cliente de strip en el servicio de payments
- Le paso la clave privada que tengo en las variables de entorno con ConfigService
- Hay que especificar la versión de la api

~~~js
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class PaymentsService {
  private readonly stripe = new Stripe(this.configService.get('STRIPE_SECRET_KEY'),{
    apiVersion: "2024-11-20.acacia"
  })

  constructor(
    private readonly configService: ConfigService
  ){}
}
~~~

- Valido la variable de entorno en payments.module

~~~js
import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { LoggerModule } from '@app/common';

@Module({
  imports: [   ConfigModule.forRoot({
    isGlobal: true,
    validationSchema: Joi.object({
      PORT: Joi.string().required(),
      STRIPE_SECRET_KEY: Joi.string().required()
    })
  }),
  LoggerModule
],
  controllers: [PaymentsController],
  providers: [PaymentsService],
})
export class PaymentsModule {}
~~~

- Creo el primer método en el servicio
- Obtengo el tipo de la card que le paso por argumento poniendo el cursor encima de la propiedad card

~~~js
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class PaymentsService {
  private readonly stripe = new Stripe(this.configService.get('STRIPE_SECRET_KEY'),{
    apiVersion: "2024-11-20.acacia"
  })

  constructor(
    private readonly configService: ConfigService
  ){}

  async createCharge(card: Stripe.PaymentMethodCreateParams.Card){
    const paymentMethod = await this.stripe.paymentMethods.create({
      type: 'card',
      card 
    })
  }
}
~~~

- Una vez tengo el método de crear el cargo puedo hacer el de intento de pago

~~~js
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class PaymentsService {
  private readonly stripe = new Stripe(this.configService.get('STRIPE_SECRET_KEY'),{
    apiVersion: "2024-11-20.acacia"
  })

  constructor(
    private readonly configService: ConfigService
  ){}

  async createCharge(card: Stripe.PaymentMethodCreateParams.Card, amount: number){
    const paymentMethod = await this.stripe.paymentMethods.create({
      type: 'card',
      card 
    })
    const paymentIntent= await this.stripe.paymentIntents.create({
      payment_method: paymentMethod.id,
      amount: amount*100, //El valor más pequeño son 100 cents
      confirm: true, //
      payment_method_types: ['card'],
      currency: 'eur'
    })

    return paymentIntent
  }
}
~~~

- En el controller uso MessagePattern para recibir la orden y Payload para extraer la data

~~~js
import { Controller, Get } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { MessagePattern, Payload } from '@nestjs/microservices';

@Controller()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @MessagePattern('create_charge')
  async createCharge(@Payload() data: CreateChargeDto){
    
  }
}
~~~

- en payments/dto/create-charge.dto

~~~js
import Stripe from "stripe"

export class CreateChargeDto{
    card: Stripe.PaymentMethodCreateParams.Card
    amount: number
}
~~~

- Tipo el createCharge del servicio

~~~js
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { CreateChargeDto } from '../dto/create-charge.dto';

@Injectable()
export class PaymentsService {
  private readonly stripe = new Stripe(this.configService.get('STRIPE_SECRET_KEY'),{
    apiVersion: "2024-11-20.acacia"
  })

  constructor(
    private readonly configService: ConfigService
  ){}

  async createCharge({card, amount}: CreateChargeDto){
    const paymentMethod = await this.stripe.paymentMethods.create({
      type: 'card',
      card 
    })
    const paymentIntent= await this.stripe.paymentIntents.create({
      payment_method: paymentMethod.id,
      amount: amount*100, //El valor más pequeño son 100 cents
      confirm: true, //
      payment_method_types: ['card'],
      currency: 'eur'
    })

    return paymentIntent
  }

}
~~~

- Llamo al servicio desde el controller

~~~js
import { Controller, Get } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CreateChargeDto } from '../dto/create-charge.dto';

@Controller()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @MessagePattern('create_charge')
  async createCharge(@Payload() data: CreateChargeDto){
    return this.paymentsService.createCharge(data)
  }
}
~~~
-------

## Payments Part 1

- Para poder inyectar el servicio en reservations debo declararlo en el ClientsModule de reservations.module 
- En libs/common/src/constants/services declaro el token de inyección

~~~js
export const AUTH_SERVICE= 'auth'
export const PAYMENTS_SERVICE = 'payments'
~~~

- Lo uso en reservations.module

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
import { AUTH_SERVICE, PAYMENTS_SERVICE } from '@app/common/constants/services';

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
    },
    {name: PAYMENTS_SERVICE, 
    useFactory: (configService: ConfigService)=>({
      transport: Transport.TCP,
      options:{
        host: configService.get('PAYMENTS_HOST'),
        port: configService.get('PAYMENTS_PORT')
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

- Vamos a .env de reservations a setear PAYMENTS_HOST y PAYMENTS_PORT
- El host será el nombre que definimos en el docker-compose para el servicio
- El puerto el mismo que definimos en payments

~~~
MONGODB_URI=mongodb://mongo:27017/sleepr
PORT=3000
AUTH_PORT=3002
AUTH_HOST=auth
PAYMENTS_HOST=payments
PAYMENTS_PORT=3003
~~~

- Agrego estas variables al objeto de validación de Joi en reservations.module

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
import { AUTH_SERVICE, PAYMENTS_SERVICE } from '@app/common/constants/services';

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
      AUTH_PORT: Joi.number().required(),
      AUTH_HOST: Joi.string().required(),
      PAYMENTS_HOST: Joi.string().required(),
      PAYMENTS_PORT: Joi.number().required()
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
    },
    {name: PAYMENTS_SERVICE, 
    useFactory: (configService: ConfigService)=>({
      transport: Transport.TCP,
      options:{
        host: configService.get('PAYMENTS_HOST'),
        port: configService.get('PAYMENTS_PORT')
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

- Inyectemos el paymentsService en el servicio de reservations

~~~js
import { Inject, Injectable } from '@nestjs/common';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { ReservationsRepository } from './reservations.repository';
import { PAYMENTS_SERVICE } from '@app/common/constants/services';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class ReservationsService {

  constructor(
    private readonly reservationsRepository: ReservationsRepository,
    @Inject(PAYMENTS_SERVICE) paymentsService: ClientProxy
  ){}

   async create(createReservationDto: CreateReservationDto, userId: string) {
    return this.reservationsRepository.create({
      ...createReservationDto, 
      timestamp: new Date(),
      userId})

      
  }

  async findAll() {
    return this.reservationsRepository.find({});
  }

  async findOne(_id: string) {
    return this.reservationsRepository.findOne({_id})
  }

  async update(_id: string, updateReservationDto: UpdateReservationDto) {
    return this.reservationsRepository.findOneAndUpdate(
      {_id},
      {$set: updateReservationDto}
    )
  }

  async remove(_id: string) {
    return this.reservationsRepository.findOneAndDelete({_id});
  }
}
~~~

- Después de impactar la db con la reserva debo poder cargar el pago al usuario
- Entonces, vamos a actualizar el dto
- Para tipar la card creo otro dto 
- Voy a la definición situando el cursor + ctrl encima de  Stripe.PaymentMethodCreateParams.**Card** en createChargeDto
- Hago networks y token opcionales, networks lo tipo como any, menos problemas
~~~js
export class CardDto{
    
        cvc: string;
        
        exp_month: number;
        
        exp_year: number;

        networks?: any //Card.Networks
     
        number: string;

     
        token?: string; 
}
~~~

- Uso class-validator

~~~js
import { Type } from "class-transformer";
import { IsCreditCard, IsDate, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class CardDto{
        
        @IsString()
        @IsNotEmpty()
        cvc: string;
        
        @IsNumber()
        exp_month: number;
        
        @IsNumber()
        exp_year: number;

        @IsOptional()
        networks?: any //Card.Networks
     
        @IsCreditCard()
        number: string;

        @IsOptional()
        token?: string; 
}
~~~

- Ahora ya puedo tipar la card en create-reservation.dto
- Uso ValidateNested para poder validar lo que hay dentro del objeto CardDto

~~~js
import { Type } from "class-transformer";
import { IsDate, IsDefined, IsNotEmpty, IsNotEmptyObject, IsNumber, IsOptional, IsString, ValidateNested } from "class-validator";
import { CardDto } from "./card.dto";

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

    @IsDefined()
    @IsNotEmptyObject()
    @ValidateNested()
    card: CardDto

    @IsNumber()
    amount: number
}
~~~

- Muevo la card.dto y create-charge.dto dentro de libs/common/src/dto para no duplicar código y poder usarlo en cualquier lado
- En lugar de tipar la card con la clase de Stripe en create-charge.dto lo hago con mi dto
- Le paso a card los decoradores que tenía en create-reservation.dto 

~~~js

import { CardDto } from "./card.dto"
import { IsDefined, IsNotEmptyObject, IsNumber, ValidateNested } from "class-validator"

export class CreateChargeDto{
    
    @IsDefined()
    @IsNotEmptyObject()
    @ValidateNested()
    card: CardDto//Stripe.PaymentMethodCreateParams.Card
   
    @IsNumber()
    amount: number
}
~~~


- En create-reservation.dto, en lugar de la card tendremos la propiedad charge
- No quiero un objeto plano de javascript por lo que uso Type de class-transformer para tiparlo a una instancia 
- **NOTA**: hago esto para evitar el error de BAD REQUEST **charge.an unknown value we passed to the validate function**

~~~js
import { Type } from "class-transformer";
import { IsDate, IsDefined, IsNotEmpty, IsNotEmptyObject, IsNumber, IsOptional, IsString, ValidateNested } from "class-validator";
import { CardDto } from "../../../../libs/common/src/dto/card.dto";
import { CreateChargeDto } from "@app/common/dto/create-charge.dto";

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

    @IsDefined()
    @IsNotEmptyObject()
    @ValidateNested()
    @Type(()=> CreateChargeDto)
    charge: CreateChargeDto
}
~~~

- Sucede los mismo en create-charge.dto

~~~js

import { Type } from "class-transformer"
import { CardDto } from "./card.dto"
import { IsDefined, IsNotEmptyObject, IsNumber, ValidateNested } from "class-validator"

export class CreateChargeDto{
    
    @IsDefined()
    @IsNotEmptyObject()
    @ValidateNested()
    @Type(()=>CardDto)
    card: CardDto//Stripe.PaymentMethodCreateParams.Card
   
    @IsNumber()
    amount: number
}
~~~

- Puedo mejorar las importaciones usando archivos de barril
- Hago el login para obtener el token en las cookies

> http://localhost:3001/auth/login

~~~json
{
  "email": "user@correo.com",
  "password": "@123456Abc"
}
~~~

- Hago la reservation en http://localhost:3000/reservations con un objeto como este

~~~json
{
  "startDate": "02-01-2023",
  "endDate": "02-05-2023",
  "placeId": "123",
  "invoiceId": "123",
  "charge":{
    "amount": 5,
    "card":{
      "cvc": "413",
      "exp_month": 12,
      "exp_year": 2032,
      "number": "4242 4242 4242 4242" //hay que habilitar los datos en crudo en el modo prueba con el soporte de Stripe
    }
     }
  }
~~~

- En el servicio de reservations guardo la reservation
- Necesito usar el pattern que creé en el payments.controller

~~~js
import { Controller, Get } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CreateChargeDto } from '../../../libs/common/src/dto/create-charge.dto';

@Controller()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @MessagePattern('create_charge') //<-----ESTE!
  async createCharge(@Payload() data: CreateChargeDto){
    return this.paymentsService.createCharge(data)
  }
}
~~~

- En el servicio de reservations
- El callback de subscribe se ejecutará después de la respuesta con éxito
- Hago la reserva dentro del subscribe
- Hago un console.log de la response por motivos de desarrollo

~~~js
   async create(createReservationDto: CreateReservationDto, userId: string) {
    this.paymentsService.send('create_charge', createReservationDto.charge)
      .subscribe(async(response)=>{
        console.log(response)
        const reservation= await this.reservationsRepository.create({
          ...createReservationDto, 
          timestamp: new Date(),
          userId})   
      }) 
  }
~~~

- Obtengo la respuesta del pago pero no la de reservation. Vamos a arreglarlo
- Por defecto podemos deviolver el observable de nuevo a la raíz y Nestjs se subscribirá a el por su cuenta
- Puedo usar pipe con map para transformar la respuesta, en este caso responder con la reserva
- Queremos retornar la reserva, no necesito la response
- Retorno el observable

~~~js
async create(createReservationDto: CreateReservationDto, userId: string) {
return this.paymentsService
  .send('create_charge', createReservationDto.charge)
  .pipe(
    map(()=>{
        return this.reservationsRepository.create({
      ...createReservationDto, 
      timestamp: new Date(),
      userId
    })   

  })
)

}
~~~

- Cuando hago una petición sin autorización el server me devuelve un error 500
- Esto es porque no está manejando bien el error desde JwtAuthGuard
- Uso un catchError para capturar el error
- libs/common/guards/jwt-auth.guard.ts

~~~js
import { CanActivate, ExecutionContext, Inject, Injectable } from "@nestjs/common";
import { catchError, map, Observable, of, tap } from "rxjs";
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
            map(()=> true),
            catchError(()=>of(false))//si hay algún error en este observable retorna false
        )
    }
    
}
~~~

- Para validar la data con los decoradaores en el Payments Controller uso @UsePipes

~~~js
import { Controller, Get, UsePipes, ValidationPipe } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CreateChargeDto } from '../../../libs/common/src/dto/create-charge.dto';

@Controller()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @MessagePattern('create_charge')
  @UsePipes(new ValidationPipe())
  async createCharge(@Payload() data: CreateChargeDto){
    return this.paymentsService.createCharge(data)
  }
}
~~~

- Ahora tenemos el invoiceId hardcodeado, pero es lo que correlaciona la reserva con el pago
- Debo extraer el id de stripe y colocarlo en el invoiceId
- Borro de create-reservation.dto el invoiceId

~~~js
import { Type } from "class-transformer";
import { IsDate, IsDefined, IsNotEmpty, IsNotEmptyObject, IsNumber, IsOptional, IsString, ValidateNested } from "class-validator";
import { CardDto } from "../../../../libs/common/src/dto/card.dto";
import { CreateChargeDto } from "@app/common/dto/create-charge.dto";

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
    

    @IsDefined()
    @IsNotEmptyObject()
    @ValidateNested()
    @Type(()=> CreateChargeDto)
    charge: CreateChargeDto
}
~~~

- Borro el placeId de reservationSchema pero mantengo el invoiceId

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
    
    @Prop({type: String})
    userId: string
    
    
    @Prop({type: String, required: true})
    invoiceId: string
}

export const ReservationSchema = SchemaFactory.createForClass(ReservationDocument)
~~~

- Para extraer el id de la response de stripe en el reservations.service

~~~js
async create(createReservationDto: CreateReservationDto, userId: string) {
    return this.paymentsService
    .send('create_charge', createReservationDto.charge)
      .pipe(
        map((res)=>{
           return this.reservationsRepository.create({
          ...createReservationDto, 
          invoiceId: res.id, 
          timestamp: new Date(),
          userId
        })   
      })
    ) 
  }
~~~