# 04 NEST DURO DE ROER - EMAILS

- Creo el proyecto con **nest new emails**
- Creo el módulo con **nest g res emails**
- Instalo **class-validator y class-transformer**
- Instalo @nestjs/swagger también
- Lo configuro en el main.ts

~~~js
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.setGlobalPrefix('api/v1')
  
  app.useGlobalPipes(new ValidationPipe({whitelist: true, transform: true}))

    const config = new DocumentBuilder()
    .setTitle('Emails')
    .setDescription('API Emails')
    .setVersion('1.0')
    .addTag('emails')
    .build()

    const document = SwaggerModule.createDocument(app,config)
    SwaggerModule.setup('swagger', app, document)

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
~~~

- email.dto.ts

~~~js
import { ApiProperty } from "@nestjs/swagger";
import { ArrayNotEmpty, IsArray, IsNotEmpty, IsString } from "class-validator";

export class CreateEmailDto {


    @ApiProperty({
        name: 'body',
        required: true,
        type: String,
        description: 'Cuerpo del mensaje a enviar'
    })
    @IsString()
    @IsNotEmpty()
    body: string
    
    @ApiProperty({
        name: 'subject',
        required: true,
        type: String,
        description: 'Asunto del mensaje a enviar'
    })
    @IsString()
    @IsNotEmpty()
    subject: string

    @ApiProperty({
        name: 'receivers',
        required: true,
        isArray: true,
        type: String,
        description: 'Destinatarios del mensaje a enviar'
    })
    @IsArray()
    @ArrayNotEmpty()
    @IsString({each: true})
    receivers: string[]
}
~~~

- Para validar el array de strings voy a crear sender-dto

~~~js
import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty } from "class-validator";

export class SenderDto{
    @ApiProperty({
        name: 'email',
        type: String,
        required: true,
        description: 'Email del destinatario'
    })
    @IsEmail()
    @IsNotEmpty()
    email: string
}
~~~

- Uso **@ValidateNested** para validar lo que hay dentro del array
- create-email.dto.ts

~~~js
 @ApiProperty({
        name: 'receivers',
        required: true,
        isArray: true,
        type: String,
        description: 'Destinatarios del mensaje a enviar'
    })
    @IsArray()
    @ArrayNotEmpty()
    @ValidateNested({each: true})
    @Type(()=>SenderDto)
    receivers: SenderDto[]
~~~

## EmailConfig

- Creo config/email.config.ts
- Le coloco el puerto como opcional, el 25 por defecto

~~~js
export class EmailConfig{
    from : string
    password: string
    service: SERVICES
    port?: number = 25
    secure?: boolean = false
}

export enum SERVICES{
    GMAIL='gmail',
    OUTLOOK='outlook365'
}
~~~

## Módulo dinámico

- Un módulo dinámico es un módulo al que le podemos pasar parámetros y le podemos cambiar los controllers, providers, etc
- Se usa cuando un módulo debe comportarse diferente según el caso de uso
- Para cuando quiera pasar las opciones a mi EmailsService creo un objeto y lo llamo **CONFIG_OPTIONS**

~~~js
import { DynamicModule, Module } from '@nestjs/common';
import { EmailsService } from './emails.service';
import { EmailsController } from './emails.controller';
import { EmailConfig } from 'src/config/email.config';

@Module({
  controllers: [EmailsController],
  providers: [EmailsService],
})
export class EmailsModule {
  static register(options: EmailConfig): DynamicModule{
    return{
      module: EmailsModule,
      controllers:[EmailsController],
      providers:[
        {
          provide: 'CONFIG_OPTIONS',
          useValue: options
        }
      ]
    }
  }
}
~~~

- En el service lo obtengo usando **@Inject**
- Instalo **nodemailer**

~~~js
import { Inject, Injectable } from '@nestjs/common';
import { CreateEmailDto } from './dto/create-email.dto';
import { UpdateEmailDto } from './dto/update-email.dto';
import { EmailConfig } from 'src/config/email.config';

@Injectable()
export class EmailsService {
  
  constructor(
    @Inject('CONFIG_OPTIONS')
    private options: EmailConfig
  ){}
}
~~~

- En app.module con la función register le paso los campos del email-config

~~~js
import { Module } from '@nestjs/common';
import { EmailsModule } from './emails/emails.module';
import { SERVICES } from './config/email.config';


@Module({
  imports: [EmailsModule.register({
    from:'mi_email@gmail.com',
    password: 'mi_app_password',
    service: SERVICES.GMAIL
  })],
  controllers: [],
  providers: [],
})
export class AppModule {}
~~~

- Hay que configurar la dobkle verificación en GMAIL
- Seguridad/Verificación en dos pasos (activarla)
- Hay que sincronizar la cuenta
- Ahora, en iniciar sesión en google aparece **contraseñas de aplicaciones**
- Selecciona la aplicación o dispositivo: Otro (y le pongo un nombre: test nest)
- Esto me va a generar una contraseña, la uso en lugar de mi password

## Enviar correos con nodemailer

- emails.controller.ts

~~~js
@Post()
createEmail(@Body() createEmailDto: CreateEmailDto) {
return this.emailsService.sendEmail(createEmailDto);
}
~~~

- Inyecto el ConfigService para obtener las variables de entorno
- Creo el transporter en el constructor
- emails.service.ts

~~~js
import { Inject, Injectable } from '@nestjs/common';
import { CreateEmailDto } from './dto/create-email.dto';
import { EmailConfig } from 'src/config/email.config';
import * as nodemailer from 'nodemailer'
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailsService {
  
  private transporter

  constructor(
    @Inject('CONFIG_OPTIONS')
    private options: EmailConfig,
  
  ){
     this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.options.from,
        pass: this.options.password,
      },
       tls: {
        rejectUnauthorized: false, // Esto evita el error del certificado autofirmado
      },
    });
  }

    async sendEmail(message: CreateEmailDto) {

    const to = message.receivers.map(e=> e.email)

    await this.transporter.sendMail({
      from: this.options.from,
      to,
      subject: message.subject,
      html: message.body ,
    });
  }
}

~~~

- En el body de la petición POST

~~~json
{
  "subject": "Test correo",
  "body": "<h1>Hola mundo!</h1>",
  "receivers":[
    {"email": "meikakuservices@gmail.com"}
    ]
}
~~~

## Documentación endpoint

- emails.controller.ts

~~~js
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller('emails')
export class EmailsController {
  constructor(private readonly emailsService: EmailsService) {}

  @Post()
  @ApiOperation({
    description: 'Envía un email'
  })
  @ApiBody({
    description: 'envía un email usando createEmailDto',
    type: CreateEmailDto,
    examples:{
      ejemplo1:{
        value: {
        subject: "Test correo",
        body: "<h1>Hola mundo!</h1>",
        receivers:[
    {email: "meikakuservices@gmail.com"}
      ]
    }
   }
  }})
  @ApiResponse({
    status: 201,
    description: 'Correo enviado correctamente'
  })
  createEmail(@Body() createEmailDto: CreateEmailDto) {
    return this.emailsService.sendEmail(createEmailDto);
  }
}
~~~

-------
