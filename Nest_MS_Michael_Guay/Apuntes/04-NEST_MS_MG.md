# 04 MICROSERVICIIOS NEST - EMIT NOTIFICATIONS

- Vamos a realizar un microservicio para emitir notificacionesa los usuarios que se ha cargado la factura a su tarjeta y la reserva
- En sleepr/

> nest g app notifications

- Creo un Dockerfile, copio y pego de cualquier otro, cambio el comando final

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

CMD ["node", "dist/apps/notifications/main"]
~~~

- En docker-compose.yaml creo el nuevo servicio
- No necesito exponer los puertos denotifications ni de payments tampoco

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
    volumes:
      - .:/usr/src/app
  notifications:
    build:
      context: .
      dockerfile: ./apps/notifications/Dockerfile
      target: development
    command: npm run start:dev notifications
    env_file:
      - ./apps/notifications/.env
    volumes:
      - .:/usr/src/app
  
~~~

- En el main de notifications
- apps/notifications/src/main.ts

~~~js
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser'
import { Transport } from '@nestjs/microservices';
import { NotificationsModule } from './notifications.module';

async function bootstrap() {
  const app = await NestFactory.create(NotificationsModule);
  const configService = app.get(ConfigService)

  app.connectMicroservice({
    transport: Transport.TCP,
    options:{
      host: '0.0.0.0',
      port: configService.get('TCP_PORT')
    }
  })
  app.useLogger(app.get(Logger))


  await app.startAllMicroservices()
}
bootstrap();
~~~

- Coloco el puerto 3004 en las variables de entorno
- .env
~~~
TCP_PORT=3004
~~~

- Hago la validación de la variable de entorno en notifications.module
- Importo el módulo de Logger que yo creé
- app/notifications/src/notifications.module

~~~js
import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { LoggerModule } from '@app/common';

@Module({
  imports: [
    ConfigModule.forRoot({
    isGlobal: true,
    validationSchema: Joi.object({
      TCP_PORT: Joi.number().required(),
      
    })
   }),
   LoggerModule
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService],
})
export class NotificationsModule {}
~~~

- Hay un tipo de comunicación en microservicios el cual no espera una respuesta
- En el controlador

~~~js
import { Controller} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { EventPattern, Payload } from '@nestjs/microservices';

@Controller()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @EventPattern('notify-email')
  async notifyEmail(@Payload() data: any){

  }
}
~~~

- Creo un dto para tipar la data del payload
- apps/notifications/src/dtos/NotifyEmailDto.dto.ts

~~~js
import { IsEmail } from "class-validator";

export class NotifyEmailDto{
    @IsEmail()
    email: string
}
~~~

- Llamo al notificationService
- Para aplicar validaciones uso @UsePipes

~~~js
import { Controller, UsePipes, ValidationPipe} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { EventPattern, Payload } from '@nestjs/microservices';
import { NotifyEmailDto } from './dtos/notify-email.dto';

@Controller()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @EventPattern('notify-email')
  @UsePipes(new ValidationPipe())
  async notifyEmail(@Payload() data: NotifyEmailDto){
    return this.notificationsService.notifyEmail(data)
  }
}
~~~

- En el servicio desestructuro el email del dto

~~~js
import { Injectable } from '@nestjs/common';
import { NotifyEmailDto } from './dtos/notify-email.dto';

@Injectable()
export class NotificationsService {
  notifyEmail({email}: NotifyEmailDto){
    console.log(email)
  }
}
~~~

- Después de crear un cargo voy a emitir una notificación
- Para poder usarlo desde el módulo de payments debo registrarlo con ClientsModule.registerAsync dentro de un objeto dentro de una arreglo
- Para usar el useFactory debo usar **siempre el inject**
- apps/payments/src/payments.module

~~~js
import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as Joi from 'joi';
import { LoggerModule } from '@app/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { NOTIFICATIONS_SERVICE } from '@app/common/constants/services';

@Module({
  imports: [   ConfigModule.forRoot({
    isGlobal: true,
    validationSchema: Joi.object({
      PORT: Joi.string().required(),
      STRIPE_SECRET_KEY: Joi.string().required(),
      NOTIFICATIONS_HOST: Joi.string().required(),
      NOTIFICATIONS_PORT: Joi.string().required()
    })
  }),
  LoggerModule,
  ClientsModule.registerAsync([{
    name: NOTIFICATIONS_SERVICE,
    useFactory: (configService: ConfigService)=>({
      transport: Transport.TCP,
      options:{
        host: configService.get('NOTIFICATIONS_HOST'),
        port: configService.get('NOTIFICATIONS_PORT')
      }
    }),
    inject: [ConfigService] //SIEMPRE EL INJECT!!
  }])
],
  controllers: [PaymentsController],
  providers: [PaymentsService],
})
export class PaymentsModule {}
~~~

- Creo el token de inyección 
- libs/common/src/constants/services.ts

~~~js
export const AUTH_SERVICE= 'auth'
export const PAYMENTS_SERVICE = 'payments'
export const NOTIFICATIONS_SERVICE = 'notifications'
~~~


- Creo las variables de entorno NOTIFICATIONS_PORT y NOTIFICATIONS_HOST
- El HOST será tal y como llamamos al servicio en el docker-compose.yaml

~~~
PORT=3003
PUBLIC_KEY_STRIPE=
STRIPE_SECRET_KEY=
NOTIFICATIONS_PORT=3004
NOTIFICATIONS_HOST=notifications
~~~

- Ahora puedo inyectar el servicio de notifications en payments

~~~js
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { CreateChargeDto } from '../../../libs/common/src/dto/create-charge.dto';
import { NOTIFICATIONS_SERVICE } from '@app/common/constants/services';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class PaymentsService {
  private readonly stripe = new Stripe(this.configService.get('STRIPE_SECRET_KEY'),{
    apiVersion: "2024-11-20.acacia"
  })

  constructor(
    private readonly configService: ConfigService,
    @Inject(NOTIFICATIONS_SERVICE) private readonly notificationsService: ClientProxy
  ){}

...code}
~~~

- No necesitamos recibir una respuesta de notifications.service 
- Uso emit con el pattern que coloqué en el notifications.controller

~~~js
import { Controller, UsePipes, ValidationPipe} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { EventPattern, Payload } from '@nestjs/microservices';
import { NotifyEmailDto } from './dtos/notify-email.dto';

@Controller()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @EventPattern('notify-email')//<---- ESTE PATTERN!
  @UsePipes(new ValidationPipe())
  async notifyEmail(@Payload() data: NotifyEmailDto){
    return this.notificationsService.notifyEmail(data)
  }
}
~~~

- Nosotros ya tenemos acceso al user en el reservation.controller gracias al JwtAuthGuard y el @CurrentUser decorator
- reservations.controller

~~~js
 @UseGuards(JwtAuthGuard)
  @Post()
 async create(@Body() createReservationDto: CreateReservationDto, 
 @CurrentUser() user: UserDto) {
    return this.reservationsService.create(createReservationDto, user._id);
  }
~~~

- JwtAuthGuard

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
            catchError(()=>of(false))
        )
    }   
}
~~~

- En el reservations.service, en lugar de enviar solo el userId , puedo enviar el user completo y desestructurar el email 
- resrevations.service

~~~js
                                                      //desestructuro email y id, lo renombro a userId
   async create(createReservationDto: CreateReservationDto, {email, _id: userId}: UserDto) {
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
- Desde el reservations.controller le paso el user

~~~js
@UseGuards(JwtAuthGuard)
  @Post()
 async create(@Body() createReservationDto: CreateReservationDto, 
 @CurrentUser() user: UserDto) {
    return this.reservationsService.create(createReservationDto, user);
  }
~~~

- En el reservations.service, cuando creo el cargo, esparzo el dto y añado el email 

~~~js
 async create(createReservationDto: CreateReservationDto, {email, _id: userId}: UserDto) {
    return this.paymentsService
    .send('create_charge', {
      ...createReservationDto.charge,
      email //añado el email!!
    })
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

- En el payments.controller  hacemos uso del CreateChargeDto
- Pero no queremos añadir el email a ese DTO
- En su lugar podemos crear un nuevo dto específico para el servicio de pago y extender ese dto para obtener las props de la tarjeta y añadirle el correo
- en payments/dto/payments-create-charge.dto.ts

~~~js
import { CreateChargeDto } from "@app/common";
import { IsEmail } from "class-validator";

export class PaymentsCreateChargeDto extends CreateChargeDto{
    @IsEmail()
    email: string
}
~~~

- Ahora puedo usar este dto en el payments.controller

~~~js
import { Controller, Get, UsePipes, ValidationPipe } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CreateChargeDto } from '../../../libs/common/src/dto/create-charge.dto';
import { PaymentsCreateChargeDto } from '../dto/payments-create-charge.dto';

@Controller()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @MessagePattern('create_charge')
  @UsePipes(new ValidationPipe())
  async createCharge(@Payload() data: PaymentsCreateChargeDto){
    return this.paymentsService.createCharge(data)
  }
}
~~~

- Ahora en el servicio uso este dto y puedo desestructurar el email

~~~js
 async createCharge({card, amount, email}: PaymentsCreateChargeDto){
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

    this.notificationsService.emit('notify-email', {email})

    return paymentIntent
  }
~~~
---------

## Email Notification

- Usaremos NodeMailer con gmail

> npm i nodemailer

- Instalo los tipos

> npm i -D @types/nodemailer

- apps/notifications/src/notifications.service

~~~js
import { Injectable } from '@nestjs/common';
import { NotifyEmailDto } from './dtos/notify-email.dto';
import * as nodemailer from 'nodemailer'
import { ConfigService } from '@nestjs/config';

@Injectable()
export class NotificationsService {

  constructor(private readonly configService: ConfigService){}

  private readonly transporter = nodemailer.createTransport({
    service: 'gmail',
    auth:{
      type: 'OAuth2',
      user: this.configService.get('SMTP_USER'),
      clientId: this.configService.get('GOOGLE_OAUTH_CLIENT_ID'),
      clientSecret: this.configService.get('GOOGLE_OAUTH_CLIENT_SECRET'),
      refreshToken: this.configService.get('GOOGLE_OAUTH_REFRESH_TOKEN')
    }
  })

  async notifyEmail({email}: NotifyEmailDto){
    this.transporter.sendMail({
      from : this.configService.get('SMTP_USER'),
      to: email,
      subject: 'Sleepr notification',
      text: 'Test text'
    })
  }
}
~~~

- Para usar gmail voy a mi cuenta de gmail
- Necesito google cloud

> https://console.cloud.google.com/

- Creo un proyecto
- Voy a API services
- Voy a pantalla de consentimiento OAuth

- Selecciono usuarios externos
- Relleno la información
- En add users agrego mi email
- Vuelvo al panel
- En la tab credenciales/Crear credenciales / ID de Cliente Oauth
- Pongo que es una website, el nombre sleepr
- En Authorized redirect URLS pego esta

> https://developers.google.com/oauthplayground

- Create
- Lo usaremos para obtener un refresh token
- Copio las credenciales a .env

~~~
TCP_PORT=3004
GOOGLE_OAUTH_CLIENT_ID=
GOOGLE_OAUTH_CLIENT_SECRET=
~~~

- Voy a 

> https://developers.google.com/oauthplayground

- En settings clico en use your own OAUTH credentials
- Busco gmail v1
- Clico en http://gmail.com
- Autorizar API
- En exchange Auth code for tokens copio el Refresh Token
- Lo añado a las variables de entorno
- Creo también SMTP_USER que será el correo con el que he hecho esta configuracion

~~~
TCP_PORT=3004
GOOGLE_OAUTH_CLIENT_ID=
GOOGLE_OAUTH_CLIENT_SECRET=
GOOGLE_AUTH_REFRESH_TOKEN=
SMTP_USER=
~~~

- Ahora debo validar estas variables en notifications.module

~~~js
import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { LoggerModule } from '@app/common';

@Module({
  imports: [
    ConfigModule.forRoot({
    isGlobal: true,
    validationSchema: Joi.object({
      TCP_PORT: Joi.number().required(),
      GOOGLE_OAUTH_CLIENT_ID: Joi.string().required(),
      GOOGLE_OAUTH_CLIENT_SECRET: Joi.string().required(),
      GOOGLE_AUTH_REFRESH_TOKEN: Joi.string().required(),
      SMTP_USER: Joi.string().required()
      
    })
   }),
   LoggerModule
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService],
})
export class NotificationsModule {}
~~~

- Debo crear un usuario con email real para poder recibir el email
- Para acabar creo en el dto la propiedad texto que desestructuraré en el servicio

~~~js
import { IsEmail, IsString } from "class-validator";

export class NotifyEmailDto{
    @IsEmail()
    email: string

    @IsString()
    text: string
}
~~~

- notifications.servcie

~~~js
import { Injectable } from '@nestjs/common';
import { NotifyEmailDto } from './dtos/notify-email.dto';
import * as nodemailer from 'nodemailer'
import { ConfigService } from '@nestjs/config';

@Injectable()
export class NotificationsService {

  constructor(private readonly configService: ConfigService){}

  private readonly transporter = nodemailer.createTransport({
    service: 'gmail',
    auth:{
      type: 'OAuth2',
      user: this.configService.get('SMTP_USER'),
      clientId: this.configService.get('GOOGLE_OAUTH_CLIENT_ID'),
      clientSecret: this.configService.get('GOOGLE_OAUTH_CLIENT_SECRET'),
      refreshToken: this.configService.get('GOOGLE_OAUTH_REFRESH_TOKEN')
    }
  })

  async notifyEmail({email, text}: NotifyEmailDto){
    this.transporter.sendMail({
      from : this.configService.get('SMTP_USER'),
      to: email,
      subject: 'Sleepr notification',
      text
    })
  }
}
~~~

- En payments.service debo incluir la propiedad text

~~~js
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { CreateChargeDto } from '../../../libs/common/src/dto/create-charge.dto';
import { NOTIFICATIONS_SERVICE } from '@app/common/constants/services';
import { ClientProxy } from '@nestjs/microservices';
import { PaymentsCreateChargeDto } from '../dto/payments-create-charge.dto';

@Injectable()
export class PaymentsService {
  private readonly stripe = new Stripe(this.configService.get('STRIPE_SECRET_KEY'),{
    apiVersion: "2024-11-20.acacia"
  })

  constructor(
    private readonly configService: ConfigService,
    @Inject(NOTIFICATIONS_SERVICE) private readonly notificationsService: ClientProxy
  ){}

  async createCharge({card, amount, email}: PaymentsCreateChargeDto){
    const paymentMethod = await this.stripe.paymentMethods.create({
      type: 'card',
      card 
    })

    console.log(email)
    const paymentIntent= await this.stripe.paymentIntents.create({
      payment_method: paymentMethod.id,
      amount: amount*100, //El valor más pequeño son 100 cents
      confirm: true, //
      payment_method_types: ['card'],
      currency: 'eur'
    })

    this.notificationsService.emit('notify-email', {email,text: `Your payment of $ ${amount * 100} has completed succesfully`})

    return paymentIntent
  }
}
~~~