# 02 NEST DURO DE ROER - AUTENTICACIÓN (MongoDB)


> nest new authentication
> npm i @nestjs/swagger swagger-ui-express @nestjs/mongoose mongoose

- Borro app.controller y app.service
- Configuro swagger y useGlobalPipes en el main.ts

~~~js
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true,transform: true}))
  app.setGlobalPrefix('api/v1')

  const config = new DocumentBuilder()
    .setTitle('Authentication')
    .setDescription('API Authentication')
    .setVersion('1.0')
    .addTag('auth')
    .build()

    const document = SwaggerModule.createDocument(app,config)
    SwaggerModule.setup('swagger', app, document)

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
~~~

- Instalo

> npm i @nestjs/config 

- Guardo el .env.development en la raíz
- Tengo también el .env en la raíz con el NODE_ENV en development
- En el app.module

~~~js
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';


@Module({
  imports: [ConfigModule.forRoot({
    load: [], //aquí irá el objeto de configuración de mongo
    envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
    isGlobal: true
  })],
  controllers: [],
  providers: [],
})
export class AppModule {}
~~~

- Creo la carpeta configuration en src con el archivo **configuration-mongo.ts**
- Lo importaré en load de ConfigModule.forRoot en app.module

~~~js
import { registerAs } from "@nestjs/config";

export default registerAs('mongo', ()=>({}))
~~~

- Lo importo en loads:

~~~js
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongoConnectionModule } from './modules/mongo-connection/mongo-connection.module';
import MongoConfig from './configuration/configuration-mongo'


@Module({
  imports: [ConfigModule.forRoot({
    load: [MongoConfig],//lo nombro como quiero al ser export default
    envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
    isGlobal: true
  })
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}

~~~

- Creo la carpeta src/modules
- Dentro genero el módulo de mongo-connection y el servicio

> nest g mo mongo-connection 
> nest g s mongo-connection

- Exporto el servicio en el módulo

~~~js
import { Module } from '@nestjs/common';
import { MongoConnectionService } from './mongo-connection.service';

@Module({
  providers: [MongoConnectionService],
  exports:[MongoConnectionService]
})
export class MongoConnectionModule {}
~~~

- En el servicio hacemos un Singleton (una sola conexión a mongo). Así no lo vuelvo a inyectar en otro lado 
- mongo-connection.service

~~~js
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Connection, createConnection } from 'mongoose';

@Injectable()
export class MongoConnectionService {
    
    private dbConnection: Connection

    constructor(private configService: ConfigService){
        this.createConnectionDB()
    }

    async createConnectionDB(){
        const host = this.configService.get('mongo.host')
        const port = this.configService.get('mongo.port')
        const user = this.configService.get('mongo.user')
        const password = this.configService.get('mongo.password')
        const database = this.configService.get('mongo.database')

        const DB_URI = `mongodb://${host}:${port}/${database}`

        this.dbConnection = createConnection(DB_URI)

        this.dbConnection.once('open', ()=>{
            console.log('Connected to database')
        })
        this.dbConnection.once('error', ()=>{
            console.log(`Error connecting to ${database}`)
        })
    }

    getConnection(){
        return this.dbConnection
    }

}
~~~

- Si usara autenticación en la url de mongo sería algo así

> `mongodb://${user}:${password}@${host}:$:{port}/${database}?authSource=admin`

- **NOTA:** Para crear usuario y password entrar en la terminal **mongosh**
    - Escribir
        - use admin
    - Escribir lo siguiente:

~~~
db.createUser({user:"admin", pwd:"123456", roles:
["clusterAdmin","readAnyDatabase","readWriteAnyDatabase",
"userAdminAnyDatabase","dbAdminAnyDatabase"]
})
~~~

- En MongoCompass crear una nueva conexión autentication User/Password
- Colocar el usuario y el password

> mongodb://admin:123456@localhost:27017/authSource=admin

- Aqui crear la DB users
- OK, **sigamos**
- En .env.development

~~~
PORT_MONGODB=27017
HOST_MONGODB=localhost
DATABASE_MONGODB=users
~~~

- En el configuration-mongo.ts puedo poner valores por defecto (por si acaso, como no estoy validando con joi)

~~~js
import { registerAs } from "@nestjs/config";

export default registerAs('mongo', ()=>({
    host: process.env.HOST_MONGODB || 'localhost',
    port: parseInt(process.env.PORT_MONGODB || '27017', 10),
    database: process.env.DATABASE_MONGODB || 'users'
}))
~~~

- Añado el módulo de MongoConnection en app.module

~~~js
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongoConnectionModule } from './modules/mongo-connection/mongo-connection.module';
import configurationMongo from './configuration/configuration-mongo'


@Module({
  imports: [ConfigModule.forRoot({
    load: [configurationMongo],
    envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
    isGlobal: true
  }),
  MongoConnectionModule //<----- yeah!
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
~~~

- Debería funcionar

## Users

> nest g res users

- create-user.dto.ts

~~~js
import { ApiProperty } from "@nestjs/swagger"
import { IsEmail, IsNotEmpty, IsString } from "class-validator"

export class CreateUserDto {
    
    @ApiProperty({
        name: 'email',
        type: String,
        required: true,
        description: 'Email del usuario'
    })
    @IsNotEmpty()
    @IsEmail()
    email: string

    @ApiProperty({
        name: 'password',
        type: String,
        required: true,
        description: 'Password del usuario'
    })
    @IsNotEmpty()
    @IsString()
    password: string
}
~~~

- Creo la interfaz del usuario

~~~js
export interface IUser{
    email: string
    password: string
}
~~~

## Creando el Schema

- user.schema.ts

~~~js
import { Schema } from "mongoose";
import { IUser } from "../interfaces/user.interface";

export const userSchema = new Schema<IUser>({
    email: {type: String, unique: true, trim: true, required: true, lowercase: true},
    password: {type: String,required: true}
})
~~~

- Debo añadir en providers el objeto **provide**. Usaré useFactory al que le debo pasar el MongoConnectionModule
- Por tanto, **SACO** el MongoConnectionModule de app.module **porque lo voy a imporar en users.module**
- En useFactory **le paso el servicio** de Mongo (**que tiene que estar exportado en mongo-connection.module.ts**), le paso el nombre del modelo (que le pongo ahora), el schema y la colección (la tabla)
- El **inject** es necesario para hacer el **.getConnection**

~~~js
import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { MongoConnectionModule } from 'src/modules/mongo-connection/mongo-connection.module';
import { MongoConnectionService } from 'src/modules/mongo-connection/mongo-connection.service';
import { IUser } from './interfaces/user.interface';
import { userSchema } from './schema/user.schema';

@Module({
  imports:[MongoConnectionModule],
  controllers: [UsersController],
  providers: [UsersService, 
    {
      provide: 'USER_MODEL',
      useFactory: (db:MongoConnectionService)=> db.getConnection().model<IUser>('user', userSchema, 'users'),
      inject: [MongoConnectionService]
    }
  ],
})
export class UsersModule {}
~~~

- Inyecto el schema en el users.service, creo un usuario

~~~js
import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Model } from 'mongoose';
import { IUser } from './interfaces/user.interface';

@Injectable()
export class UsersService {

  constructor(
    @Inject('USER_MODEL')
    private userModel: Model<IUser>
  ){}


  async createUser(createUserDto: CreateUserDto) {

    const userExists = await this.userModel.findOne({email: createUserDto.email})
    if(userExists) throw new ConflictException("El usuario ya existe")

    const user = new this.userModel(createUserDto)

    await user.save()

    user.password = "" //para no retornar el password
    
    return user
  }

  {...code}
}
~~~

## Encriptar password

> npm i bcrypt @types/bcrypt

- Usaremos .pre en el schema para guardar el password encriptado antes de salvar
- user.schema.ts

~~~js
import { Schema } from "mongoose";
import { IUser } from "../interfaces/user.interface";
import * as bcrypt from 'bcrypt'

export const userSchema = new Schema<IUser>({
    email: {type: String, unique: true, trim: true, required: true, lowercase: true},
    password: {type: String,required: true}
})

userSchema.pre<IUser>('save', async function(){
    const salt = await bcrypt.genSalt(10)
    const hash = await bcrypt.hash(this.password, salt)
    this.password = hash
})
~~~

## Obtener usuarios

- Si uso password: 0 es como decirle un false, no lo muestra

~~~js
getUsers() {
    return this.userModel.find({}, {password: 0});
  }
~~~

## Obtener usuario por email

- user.controller.ts

~~~js
@Get(':email')
findUserByEmail(@Body('email') email: string) {
  return this.usersService.findUserByEmail(email);
}
~~~

- user.service.ts

~~~js
async findUserByEmail(email: string) {
   return await this.userModel.findOne({email: email.toLowerCase()}) 
  }
~~~

## Poblar usuarios

- users.service.ts

~~~js
  async populateUsers(){

    await this.userModel.deleteMany()

    const users: CreateUserDto[]=[
      {
        email: "laura@gmail.com",
        password: "123456"
      },
      {
        email: "pedro@gmail.com",
        password: "123456"
      },
      {
        email: "maria@gmail.com",
        password: "123456"
      },
      {
        email: "jose@gmail.com",
        password: "123456"
      },

    ]

    for (const user of users){
      const userExists = await this.findUserByEmail(user.email)
      if(userExists) throw new ConflictException("El usuario ya existe")
      await this.createUser(user)
    }
    return 'Populate users OK'
  }
~~~

- En el controller uso un POST

~~~js
@Post('populate')
populateUsers(){
  return this.usersService.populateUsers()
}
~~~

## Creando auth module

> nest g res auth

- Creo un fichero de configuración para auth
- Coloco una palabra por defecto por si acaso
- configuration/configuration-auth.ts

~~~js
import { registerAs } from "@nestjs/config";

export default registerAs('auth', ()=>({
    secretKey: process.env.SECRETKEY_AUTH || "secret_key"
}))
~~~

- En env.development

~~~
PORT_MONGODB=27017
HOST_MONGODB=localhost
DATABASE_MONGODB=users
SECRETKEY_AUTH=secret_key
~~~

- Debo añadir el módulo en app.module

~~~js
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import configurationMongo from './configuration/configuration-mongo'
import configurationAuth from './configuration/configuration-auth';


@Module({
  imports: [ConfigModule.forRoot({
    load: [configurationMongo, configurationAuth],
    envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
    isGlobal: true
  }),
  UsersModule,
  AuthModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
~~~

## AuthDto

- auth.dto.ts

~~~js
import { ApiProperty } from "@nestjs/swagger"
import { IsEmail, IsNotEmpty, IsString } from "class-validator"

export class AuthCredentialsDto {
    
    @ApiProperty({
        name: 'email',
        type: String,
        required: true,
        description: 'Email del usuario a loguear'
    })
    @IsNotEmpty()
    @IsEmail()
    email: string

    @ApiProperty({
        name: 'password',
        type: String,
        required: true,
        description: 'Password del usuario a loguear'
    })
    @IsNotEmpty()
    @IsString()
    password: string
}
~~~

## Passport

- Usaremos el módulo de Passport
- Hay dos tipos de autenticación, con passport local y con jwt
- Se pueden combinar

> npm i @nestjs/passport passport @nestjs/jwt passport-jwt

- En **auth.module**

~~~js
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Module({
  imports:[
    PassportModule.register({defaultStrategy: "jwt"}),
    JwtModule.registerAsync({
      useFactory: (configService:ConfigService)=>{
        return{
          secret: configService.get('auth.secretKey'),
          signOptions: {expiresIn: '2h'}
        }
      },
      inject: [ConfigService]
    })

  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
~~~

## Estrategia JWT

- Creo la carpeta auth/strategy para el servicio, puedo usar el cli de NEST dentro del directorio

> nest g s jwt-strategy

~~~js
import { Injectable, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { UsersService } from "src/users/users.service";
import { JwtPayload } from "../interfaces/jwt-payload.interface";

@Injectable()
export class JwtStrategyService extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly usersService: UsersService,
  
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get<string>('auth.secretKey')!
    })
  }

  async validate(payload: JwtPayload) {
    const user = await this.usersService.findUserByEmail(payload.email);
    if (!user) throw new NotFoundException('El usuario no existe');
    user.password = ''; // remover contraseña
    return user;
  }
}
~~~

- Creo la interfaz de JwtPayload

~~~js
export interface JwtPayload {
    email: string
}
~~~

- Debo incluir JwtStrategyService en los providers de AuthModule
- Como uso el UsersService importo el UsersModule (y debo exportar en este el servicio)

~~~js
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategyService } from './strategy/jwt-strategy.service';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports:[
    PassportModule.register({defaultStrategy: "jwt"}),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService:ConfigService)=>{
        return{
          secret: configService.get('auth.secretKey'),
          signOptions: {expiresIn: '2h'}
        }
      },
      inject: [ConfigService]
    }),
    UsersModule

  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategyService],
})
export class AuthModule {
  
}
~~~

- Exporto el UsersService en users.module!

~~~js
import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { MongoConnectionModule } from 'src/modules/mongo-connection/mongo-connection.module';
import { MongoConnectionService } from 'src/modules/mongo-connection/mongo-connection.service';
import { IUser } from './interfaces/user.interface';
import { userSchema } from './schema/user.schema';

@Module({
  imports:[MongoConnectionModule],
  controllers: [UsersController],
  providers: [UsersService, 
    {
      provide: 'USER_MODEL',
      useFactory: (db:MongoConnectionService)=> db.getConnection().model<IUser>('user', userSchema, 'users'),
      inject: [MongoConnectionService]
    }
  ],
  exports: [UsersService]
})
export class UsersModule {}
~~~

## Validar credenciales

- Validaremos las credenciales (no el usuario)
- Si el usuario está bien compruebo el password
- Si el password está bien retorno el user
- En el auth.controller.ts

~~~js
import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthCredentialsDto } from './dto/create-auth.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() authCredentialsDto: AuthCredentialsDto) {
    return this.authService.login(authCredentialsDto);
  }
}
~~~

- En el auth.service.ts inyecto el UsersService

~~~js
import { Injectable, NotFoundException } from '@nestjs/common';
import { AuthCredentialsDto } from './dto/create-auth.dto';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt'


@Injectable()
export class AuthService {

  constructor(
    private readonly usersService: UsersService
  ){}

async validateUser(credentials: AuthCredentialsDto){
  const user = await this.usersService.findUserByEmail(credentials.email)
  
  if(!user) throw new NotFoundException("No se encuentra el usuario")
  
  const passwordOk = await bcrypt.compare(credentials.password, user.password)
  
  if(passwordOk){
    return user
  }

  return null
}

}
~~~

## Login

- auth.service.ts

~~~js
import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { AuthCredentialsDto } from './dto/create-auth.dto';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt'
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { JwtService } from '@nestjs/jwt';


@Injectable()
export class AuthService {

  constructor(
    private readonly usersService: UsersService,
    private jwtService: JwtService
  ){}

async validateUser(credentials: AuthCredentialsDto){
  const user = await this.usersService.findUserByEmail(credentials.email)
  
  if(!user) throw new NotFoundException("No se encuentra el usuario")
  
  const passwordOk = await bcrypt.compare(credentials.password, user.password)
  
  if(passwordOk){
    return user
  }

  return null
}

async login(authCredentials: AuthCredentialsDto){
   const user = await this.validateUser(authCredentials)

   if(!user){
    throw new UnauthorizedException("Credenciales inválidas")
   }

   const payload: JwtPayload = {
    email: user.email
   }

   return {
    acessToken: this.jwtService.sign(payload)
   }
}

}
~~~

- Si me logueo con un usuario y contraseña válidos me responde con un token
- Usaremos este token **para validar que somos nosostros y nos hemos logueado**

## Protegiendo endpoints de users

- Solo podremos usar getUsers y createUser si estamos logueados
- En el users.module necesito importar **PassportModule.register**
  - **Todo módulo que tenga seguridad lo necesita**
- users.module.ts

~~~js
import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { MongoConnectionModule } from 'src/modules/mongo-connection/mongo-connection.module';
import { MongoConnectionService } from 'src/modules/mongo-connection/mongo-connection.service';
import { IUser } from './interfaces/user.interface';
import { userSchema } from './schema/user.schema';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports:[PassportModule.register({defaultStrategy: "jwt"}),
    MongoConnectionModule],
  controllers: [UsersController],
  providers: [UsersService, 
    {
      provide: 'USER_MODEL',
      useFactory: (db:MongoConnectionService)=> db.getConnection().model<IUser>('user', userSchema, 'users'),
      inject: [MongoConnectionService]
    }
  ],
  exports: [UsersService]
})
export class UsersModule {}
~~~

- En el users.controller uso @UseGuards con AuthGuard y le paso 'jwt'
- users.controller.ts

~~~js
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  createUser(@Body() createUserDto: CreateUserDto) {
    return this.usersService.createUser(createUserDto);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  getUsers() {
    return this.usersService.getUsers();
  }

  @Get(':email')
  findUserByEmail(@Body('email') email: string) {
    return this.usersService.findUserByEmail(email);
  }

  @Post('populate')
  populateUsers(){
    return this.usersService.populateUsers()
  }
}
~~~

- Debo tener el token en el campo Auth/Bearer de POSTMAN para poder acceder al endpoint

## Comprobando la validación de la estrategia

- En la estrategia(jwt-strategy.service.ts), el validate es el que hace el trabao por detrás (sin que se vea)
- **Si retorna un false devuelve un Unauthorized**
- Solo se incluye en los providers (no se usa como el resto de servicios)

~~~js
import { Injectable, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { UsersService } from "src/users/users.service";
import { JwtPayload } from "../interfaces/jwt-payload.interface";

@Injectable()
export class JwtStrategyService extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly usersService: UsersService,
  
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get<string>('auth.secretKey')!
    })
  }

  async validate(payload: JwtPayload) {
    const user = await this.usersService.findUserByEmail(payload.email);
    if (!user) throw new NotFoundException('El usuario no existe');
    user.password = ''; // remover contraseña
    return user;
  }
}
~~~

- Hago un GET para obtener los datos del usuario logueado usando @Request
- Lo que metemos de payload se mete en la request

~~~js
@Get('data-user')
dataUser(@Request() req){
  console.log(req)
  return req.user
}
~~~

## Documentar

- auth.controller.ts

~~~js
import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthCredentialsDto } from './dto/create-auth.dto';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({
    description: "Nos loguea en la app"
  })
  @ApiBody({
    description: "Nos logueamos usando las credenciales",
    type: AuthCredentialsDto,
    examples:{
      ejemplo:{
        value:{
          email: "pedro@gmail.com",
          password: "123456"
        }
      }
    }
  })
  @ApiBearerAuth('jwt')
  @ApiResponse({
    status: 401,
    description: 'credenciales inválidas'
  })
  @ApiResponse({
    status: 201,
    description: 'Login correcto'
  })
  login(@Body() authCredentialsDto: AuthCredentialsDto) {
    return this.authService.login(authCredentialsDto);
  }
}
~~~
-----