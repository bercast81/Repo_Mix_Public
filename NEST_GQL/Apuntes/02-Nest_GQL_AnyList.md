# 02 NEST GQL - ANYLIST

- Creo AnyList con **nest new AnyList**
- Instalo

> npm i @nestjs/graphql @nestjs/apollo graphql apollo-server-express apollo-server-core

- Creo el modulo de Items con **nest g res items**. Elijo **GraphQL code first**

- Configuro ApolloDriver en app.module

~~~js
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { ItemsModule } from './items/items.module';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      playground: false, // Desactiva el playground clásico
      plugins: [ApolloServerPluginLandingPageLocalDefault()],
    }),
    ItemsModule
  ],
})
export class AppModule {}
~~~

- Instalo class-validator y class-transformer, lo configuro en el main

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

- Usaremos typeorm con una imagen de Docker de postgres
- Para poder usar las variables de entorno instalo @nestjs/config, instalo también pg (postgres)

> npm i @nestjs/typeorm typeorm @nestjs/config pg

- Para poder usar las variables de entorno importo **ConfigModule**
- Uso **TypeOrmModule.forRoot** para setear la db
- app.module.ts

~~~js
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { ItemsModule } from './items/items.module';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    ConfigModule.forRoot(),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      playground: false, // Desactiva el playground clásico
      plugins: [ApolloServerPluginLandingPageLocalDefault()],
    }),

    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: +process.env.DB_PORT!,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      synchronize: true,
      autoLoadEntities: true
    }),
    ItemsModule
  ],
})
export class AppModule {}
~~~

- En .env

~~~
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD= 123456
DB_NAME=anylist
~~~

## Docker

- Para consultar la documentación acudir a dockerhub y buscar postgres
- Creo docker-compose.yml

~~~yml
services:
  db:
    image: postgres:latest
    restart: always
    ports:
      - "5432:5432"
    environment:
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME}
      POSTGRES_USERNAME: ${DB_USERNAME}
    container_name: anylistDB
    volumes:
      - ./postgres:/var/lib/postgresql/data
~~~

> docker compose up -d

- Si el puerto está ocupado cambiar la variable de entorno por 5433 o 5434
- Para mapearlo en el Docker sería "5434:5432"

## Item Entity

- Combino los decoradores de typeorm y graphql
- Uso **@ObjectType** y **@Entity** para declarar la entidad

~~~js
import { ObjectType, Field, ID, Float } from '@nestjs/graphql';
import { Column, PrimaryGeneratedColumn, Entity } from 'typeorm';

@ObjectType()
@Entity()
export class Item {
  @PrimaryGeneratedColumn('uuid')
  @Field(() => ID)
  id: string

  @Column()
  @Field(()=> String)
  name: string

  @Column()
  @Field(()=> Float)
  quantity : number

  @Column({nullable: true})
  @Field(()=> String, {nullable: true})
  quantityUnits?: string

  //stores
  //user 
}
~~~

- Importo la entidad en items.module

~~~js
import { Module } from '@nestjs/common';
import { ItemsService } from './items.service';
import { ItemsResolver } from './items.resolver';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Item } from './entities/item.entity';

@Module({
  imports:[TypeOrmModule.forFeature([Item])],
  providers: [ItemsResolver, ItemsService],
})
export class ItemsModule {}
~~~

## Create-item.input

- En el dto uso también el decorador @Field más los del class-validator

~~~js
import { InputType, Field, Float } from '@nestjs/graphql';
import { IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

@InputType()
export class CreateItemInput {

  @Field(()=> String)
  @IsString()
  @IsNotEmpty()
  name: string

  @Field(()=> Float)
  @IsNumber()
  @IsPositive()
  quantity: number

  @Field(()=> String, {nullable: true})
  @IsOptional()
  @IsString()
  quantityUnits?: string
}
~~~

- En el update-item.input.ts

~~~js
import { IsUUID } from 'class-validator';
import { CreateItemInput } from './create-item.input';
import { InputType, Field, PartialType, ID } from '@nestjs/graphql';

@InputType()
export class UpdateItemInput extends PartialType(CreateItemInput) {
  @Field(() => ID)
  @IsUUID()
  id: string;
}
~~~

- En el items.service usop **@InjectRepository** y **Repository** para trabajar con la entidad

~~~js
import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateItemInput } from './dto/create-item.input';
import { UpdateItemInput } from './dto/update-item.input';
import { InjectRepository } from '@nestjs/typeorm';
import { Item } from './entities/item.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ItemsService {

  constructor(
    @InjectRepository(Item)
    private readonly itemRepository: Repository<Item>
  ){}


 async create(createItemInput: CreateItemInput): Promise<Item> {
    const newItem = this.itemRepository.create(createItemInput)
    return await this.itemRepository.save(newItem)
  }

  async findAll(): Promise<Item[]> {
    //TODO: filtrar, paginar
    return await this.itemRepository.find();
  }

  async findOne(id: string): Promise<Item> {
    const item = await this.itemRepository.findOneBy({id})
    if(!item) throw new NotFoundException(`El item con id ${id} no se encuentra`)
    return item
  }

  async update(id: string, updateItemInput: UpdateItemInput): Promise<Item> {
    const item = await this.itemRepository.preload(updateItemInput)
    if(!item) throw new NotFoundException(`El item con id ${id} no se encuentra`)
    return await this.itemRepository.save(item)
  }

  async remove(id: string): Promise<Item> {
    const item = await this.findOne(id)
    await this.itemRepository.remove(item)
    return {...item, id}
  }
}
~~~

- Veamos el resolver como es

~~~js
import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { ItemsService } from './items.service';
import { Item } from './entities/item.entity';
import { CreateItemInput } from './dto/create-item.input';
import { UpdateItemInput } from './dto/update-item.input';

@Resolver(() => Item)
export class ItemsResolver {
  constructor(private readonly itemsService: ItemsService) {}

  @Mutation(() => Item)
  createItem(@Args('createItemInput') createItemInput: CreateItemInput) {
    return this.itemsService.create(createItemInput);
  }

  @Query(() => [Item], { name: 'items' })
  findAll() {
    return this.itemsService.findAll();
  }

  @Query(() => Item, { name: 'item' })
  findOne(@Args('id', {type: ()=> ID}) id: string) {
    return this.itemsService.findOne(id);
  }

  @Mutation(() => Item)
  updateItem(@Args('updateItemInput') updateItemInput: UpdateItemInput) {
    return this.itemsService.update(updateItemInput.id, updateItemInput);
  }

  @Mutation(() => Item)
  removeItem(@Args('id', {type: ()=> ID}) id: string) {
    return this.itemsService.remove(id);
  }
}
~~~

- La query sería así

~~~
mutation CreateItem($createItemInput: CreateItemInput!){
  createItem(createItemInput : $createItemInput){
    id
    name
    quantity
    quantityUnits
  }
}
~~~

- En el apartado variables escribo:

~~~
{
  "createItemInput":{
    "name": "Cervezas",
    "quantity": 1
  }
}
~~~

- Para el findOne (llamado item en el resolver) le paso el id
- Puedo llamar la mutation como quiera(QueryItem), pero en el objeto tengo que pasarle el nombre del resolver

~~~
query QueryItem($idDelItem: ID!){
  item(id: $idDelItem){
    id
    name
    quantity
    quantityUnits
  }
}
~~~

- En variables le paso el uuid 

~~~
{
  "idDelItem": "0d0da57b-c5f6-4825-b34c-4a66d9024a29"

}
~~~

## Autenticación

- Estamos creando una app para manejar listas
- El usuario solo podrá ver sus listas
- El administrador podrá ver todas las listas
- Instalo

> npm i bcrypt passport passport-jwt @nestjs/passport @nestjs/jwt @types/passport-jwt

- Autenticación (saber quien es el usuario) y autorización (los permisos que tiene el usuario), habrá ciertos querys bloqueados a ciertos roles
- Signup y Login normalmente no están en GraphQL, porque cualquier persona no autorizada tendría acceso a los endpoints
- Se suele usar REST
- Crearemos custom decorators, haremos la autenticación, veremos las estrategias para logearnos, validar los tokens, mutations...
- Veremos como bloquear el schema en caso de no tener acceso

## User Entity, resolver, servicio y AUth

- Creo los módulos de Auth(login, signin, revalidación del token) y User (para manejar los usuarios, en plan admin)

> nest g res user

- Selecciono GraphQL **code first** y los endpoints (y)

- Lo mismo con auth
- user.entity

~~~js
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@ObjectType()
@Entity({name: 'users'})
export class User {
  
  @Field(()=>ID)
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  @Field(()=> String)
  fullName: string

  @Column({unique: true})
  @Field(()=> String)
  email: string

  @Column()
  @Field(()=> String)
  password: string

  @Column({
    type: 'text',
    array: true,
    default: ['user']
  })
  @Field(()=>[String])
  roles: string[]

  @Column({
    type: 'boolean',
    default: true
  })
  @Field(()=> Boolean)
  isActive: boolean

  //TODO: relaciones
}
~~~

- En user.module debo usar el .forFeature para pasarle la entidad

~~~js
import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserResolver } from './user.resolver';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';

@Module({
  imports:[TypeOrmModule.forFeature([User])],
  providers: [UserResolver, UserService],
  exports:[UserService]
})
export class UserModule {}
~~~

- La parte de creación de los usuarios no la quiero aquí, la quiero en Auth. Si la tendré en el servicio pero no necesito un endpoint aquí
- El user.resolver.ts me da error el return porque no tengo implementados el findAll y el blockUser y el tipo de respuesta no coincide
- Puedo obviarlo de momento para poder poner en marcha el server

~~~js
import { Resolver, Query, Mutation, Args, Int, ID } from '@nestjs/graphql';
import { UserService } from './user.service';
import { User } from './entities/user.entity';

@Resolver(() => User)
export class UserResolver {
  constructor(private readonly userService: UserService) {}

  @Query(() => [User], { name: 'users' })
  findAll()/*: Promise<User[]>*/ {
    return this.userService.findAll();
  }

  @Query(() => User, { name: 'user' })
  findOne(@Args('id', { type: () => ID}) id: string): Promise<User> {
    return this.userService.findOneById(id);
  }

  @Mutation(()=> User)
  blockUser(@Args('id', {type: ()=> ID}) id: string)/*: Promise<User>*/{
    return this.userService.blockUser(id)
  }

}
~~~

- En el servicio inyecto el repo

~~~js
import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { SignupInput } from 'src/auth/dto/signup.input';
import * as bcrypt from 'bcrypt'

@Injectable()
export class UserService {

  private logger = new Logger('UsersService')

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
  ){}

  async create(signupInput: SignupInput): Promise<User | undefined>{

    try {
      const newUser = this.userRepository.create({
        ...signupInput,
        password: bcrypt.hashSync(signupInput.password, 10)
      })

      return await this.userRepository.save(newUser)
    } catch (error) {
      this.handleDbErrors(error)
    }
  }

  findAll() {
    return []
  }

  async findOneByEmail(email: string): Promise<User| undefined>{
    try {
      return await this.userRepository.findOneByOrFail({email})
    } catch (error) {
       throw new NotFoundException(`El cliente con id ${email} no se encuentra`)
    }
  }

  async findOneById(id: string) {
    try {
      return await this.userRepository.findOneByOrFail({id})
      
    } catch (error) {
      throw new NotFoundException(`El cliente con id ${id} no se encuentra`)
    }
  }

  blockUser(id: string){
    return 'block user'
  }

  handleDbErrors(error: any){
    if(error.code === '23505'){
      throw new BadRequestException(error.detail.replace('Key', ''))
    }
    if(error.code === 'error-001'){
      throw new BadRequestException(error.detail.replace('Key', ''))
    }
    this.logger.error(error)
    throw new InternalServerErrorException('Check server logs')
  }
}
~~~

- El signup.input

~~~js
import { InputType, Field } from '@nestjs/graphql';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

@InputType()
export class SignupInput {
  
  @Field(() => String)
  @IsEmail()
  email: string

  @Field(()=> String)
  @IsString()
  @IsNotEmpty()
  fullName: string

  @Field(()=>String)
  @IsString()
  @MinLength(6)
  password: string
}
~~~

- El LoginInput 

~~~js
import { Field, InputType } from "@nestjs/graphql";
import { IsEmail, MinLength } from "class-validator";

@InputType()
export class LoginInput{

    @Field(()=> String)
    @IsEmail()
    email: string

    @Field(()=> String)
    @MinLength(6)
    password: string
}
~~~

- El update-user.input

~~~js
import { SignupInput } from './signup.input';
import { InputType, Field, PartialType, ID } from '@nestjs/graphql';
import { IsOptional, IsUUID } from 'class-validator';

@InputType()
export class UpdateUserInput extends PartialType(SignupInput) {
  
  @Field(() => ID)
  @IsUUID()
  @IsOptional()
  id: string;
}
~~~

- En el módulo de Auth (sin los endpoints) creo dos mutations, el signup y el login
- Hago un tercer método para revalidar el token
- En este momento no tengo el tipo de respuesta que devolverá la mutation
- Será src/auth/types/AuthResponse
- El custom decorator @CurrentUser lo veremos más adelante
- Aquí pasa lo mismo que anteriormente, el tipado de AuthResponse me da eror en el return por no tener implementado el método
  - Lo comento de momento
- Fijarse que lleva el decorador Resolver sin ninguna entidad, ya que no tenemos una entiddad Auth como tal
- Auth.resolver.ts

~~~js
import { Resolver, Mutation, Args} from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { AuthResponse } from './types/auth-response';
import { SignupInput } from './dto/signup.input';
import { LoginInput } from './dto/login.input';

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

 @Mutation(()=> AuthResponse, {name: 'signup'})
 async signup(@Args('signupInput') signupInput: SignupInput)/*: Promise<AuthResponse>*/{
  return this.authService.signup(signupInput)
 }

 @Mutation(()=> AuthResponse, {name: 'login'})
 async login(@Args('loginInput')loginInput: LoginInput)/*: Promise<AuthResponse>*/{
  return this.authService.login(loginInput)
 }

//  @Query(()=> AuthResponse, {name: 'revalidate'})
//  @UseGuards(JwtAuthGuard)
//  revalidateToken(@CurrentUser(/**Valid roles**/) user: User): AuthResponse{
//   return this.authService.revalidateToken
//  }
}
~~~

- El auth-response.ts

~~~js
import { Field, ObjectType } from "@nestjs/graphql";
import { User } from "src/user/entities/user.entity";

@ObjectType()
export class AuthResponse{

    @Field(()=> String)
    token: string

    @Field(()=> User)
    user: User
}
~~~

- En el AuthService inyecto el UserService y el JwtService
- Al incluir el JwtModule en auth.module dispongo del JwtService
- Importo también el módulo de User para poder usar el servicio (exporto el servicio en user.module)
- auth.module

~~~js
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthResolver } from './auth.resolver';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { UserModule } from 'src/user/user.module';

@Module({
  imports:[JwtModule, UserModule],
  providers: [AuthResolver, AuthService],
})
export class AuthModule {}
~~~

- auth.service

~~~js
import { BadRequestException, Injectable } from '@nestjs/common';
import { LoginInput } from './dto/login.input';
import { SignupInput } from './dto/signup.input';
import { InjectRepository } from '@nestjs/typeorm';
import { UserService } from 'src/user/user.service';
import { JwtService } from '@nestjs/jwt';
import { AuthResponse } from './types/auth-response';
import { User } from 'src/user/entities/user.entity';



@Injectable()
export class AuthService {

  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService
  ){}


  private getJwtToken(userId: string){
    return this.jwtService.sign({id: userId})
  }

  async signup(signupInput: SignupInput): Promise<AuthResponse>{
    const user= await this.userService.create(signupInput)
    if(!user) throw new BadRequestException("No se ha podido crear el usuario")
    const token = this.getJwtToken(user.id)
    return {token, user}
  }

  login(loginInput: LoginInput){
    
 }
}
~~~

- Configuro el ConfigService en el AuthModule para usarlo en el JwtModule y pasarle el secretKey del token como variable de entorno
- Todo lo que lleva Module va en los imports
- Para inyectar el configService uso **useFactory** con un **return implícito** (entre paréntesis)
- auth.module

~~~js
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthResolver } from './auth.resolver';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { UserModule } from 'src/user/user.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports:[ ConfigModule,
            PassportModule.register({defaultStrategy: 'jwt'}),

      JwtModule.registerAsync({
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService)=>({
          secret: configService.get('JWT_SECRET'),
          signOptions:{
            expiresIn: '4h'
          }
        })
      }), 
      UserModule],
  providers: [AuthResolver, AuthService],
})
export class AuthModule {}
~~~

- En el archivo .env tengo JWT_SECRET=1234
- Creo la estrategia en auth/strategies/jwt.strategy.ts

~~~js
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { AuthService } from "../auth.service";
import { ConfigService } from "@nestjs/config";
import { User } from "src/user/entities/user.entity";
import { Injectable } from "@nestjs/common";
import { JwtPayload } from "../interfaces/jwt-payload";

@Injectable()
export class JwtStrategy extends PassportStrategy( Strategy){

    constructor(
        private readonly authService: AuthService,
        configService: ConfigService,
        
    ){
        const jwtSecret = configService.get<string>('JWT_SECRET');
        if (!jwtSecret) throw new Error('JWT_SECRET is not defined in environment variables');

        super({
            secretOrKey: jwtSecret,
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken()
        })
    }

    async validate(payload: JwtPayload): Promise<User>{
        const {id} = payload

        const user = await this.authService.validateUser(id)
        return user //este user pasa a estar en la request automáticamente

    }
}
~~~

- JwtStrategy debe estar en los providers de AuthModule

~~~js
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthResolver } from './auth.resolver';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { UserModule } from 'src/user/user.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports:[ ConfigModule,
            PassportModule.register({defaultStrategy: 'jwt'}),

      JwtModule.registerAsync({
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService)=>({
          secret: configService.get('JWT_SECRET'),
          signOptions:{
            expiresIn: '4h'
          }
        })
      }), 
      UserModule],
  providers: [AuthResolver, AuthService, JwtStrategy],
})
export class AuthModule {}
~~~
- Creo este método validateUser en el AuthService

~~~js
  async validateUser(id: string){
    const user = await this.userService.findOneById(id)
    if(!user.isActive) throw new UnauthorizedException('User is inactive') 

    const {password, ...rest} = user //elimino el password del retorno

    return rest
  }
~~~

- Como elimino el password en el retorno, para que no me marque error el return user del método validate de la estrategia, voy a la entidad y le coloco un ? a password en la user.entity (para que typescript no se queje)

~~~js
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@ObjectType()
@Entity({name: 'users'})
export class User {
  
  @Field(()=>ID)
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  @Field(()=> String)
  fullName: string

  @Column({unique: true})
  @Field(()=> String)
  email: string

  @Column()
  @Field(()=> String)
  password?: string //<------- AQUI!

  @Column({
    type: 'text',
    array: true,
    default: ['user']
  })
  @Field(()=>[String])
  roles: string[]

  @Column({
    type: 'boolean',
    default: true
  })
  @Field(()=> Boolean)
  isActive: boolean

  //TODO: relaciones
}
~~~

- La interface del payload JwtPayload

~~~js
export interface JwtPayload{
    id: string
    iat: number
    exp: number
}
~~~

- Normalmente queremos el login y el signup fuera de GraphQL, porque no queremos que la persona tenga acceso a los endpoints
- Lo recomendable es usar REST

## Login

- En el auth.service importo bcrypt * as bcrypt from 'bcrypt'

~~~js
async login(loginInput: LoginInput){
  const {email, password} = loginInput
  const user = await this.userService.findOneByEmail(email)

  if(!user) throw new NotFoundException('User not found')

  if(!bcrypt.compareSync(password, user.password!)){
    throw new BadRequestException("Password don't match")
  }

  const token = this.getJwtToken(user.id)
  return {token, user}
}
~~~

- Para validar las rutas creo en el auth.resolver una petición que requiera autenticación
- Siempre queremos regresar algo de tipo AuthResponse porque ahí es dónde tenemos el usuario y el token
- auth.resolver.ts

~~~js
@Query(()=> AuthResponse, {name: 'revalidate'})
@UseGuards(JwtAuthGuard) //no hace falta invocarlo aquí
revalidateToken(@CurrentUser(/*Valid roles*/)user: User): AuthResponse{
  return this.authService.revalidateToken()
}
~~~

- El método en auth.service.ts

~~~js
revalidateToken(user: User):AuthResponse{
  const token = this.getJwtToken(user.id)
  return {token, user}
}
~~~

- El JwtAuthGuard (le paso 'jwt'), no hace falta invocarlo en @UseGuards en el endpoint del resolver porque lo estoy ejecutando aquí

~~~js
import { ExecutionContext, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
    getRequest(context: ExecutionContext) {
        const ctx = GqlExecutionContext.create(context)

        const request = ctx.getContext().req //obtengo la request
        return request
    }
}
~~~

- El custom decorator **@CurrentUser**
- auth/decorators/current-user.decorator

~~~js
import { createParamDecorator, ExecutionContext, ForbiddenException, InternalServerErrorException } from "@nestjs/common";
import { ValidRoles } from "../enums/valid-roles.enum";
import { GqlExecutionContext } from "@nestjs/graphql";
import { User } from "src/user/entities/user.entity";

export const CurrentUser = createParamDecorator(
   (roles: ValidRoles[]=[], context: ExecutionContext)=>{

    const ctx = GqlExecutionContext.create(context)

    //extraigo el user de la request que obtengo del strategy con validate
    const user: User = ctx.getContext().req.user

    if(!user) throw new InternalServerErrorException('No user inside the request')

    if(roles.length === 0) return user
    
    for(const role of user.roles){
        if(roles.includes(role as ValidRoles)){
            return user
        }
    }

    throw new ForbiddenException(`User ${user.fullName} needs a valid role`)
   }
)
~~~

- auth/enums/valid-roles.enum.ts

~~~js
export enum ValidRoles{
    admin = 'admin',
    user='user',
    superUser='superUser'
}
~~~

- Puedo pasarle el rol así al Query

~~~js
@Query(()=> AuthResponse, {name: 'revalidate'})
  @UseGuards(JwtAuthGuard)
  revalidateToken(@CurrentUser([ValidRoles.admin])user: User): AuthResponse{
   return this.authService.revalidateToken(user)
  }
~~~

- Para hacer la query debo crear en el apartado headers Authorization y pasarle el token como Bearer
- Bearer (espacio) token_sin_comillas_ni_nada
- El query revalidateToken es solo para comprobar que funciona el AuthGuard y el CurrentUser
- La query sería algo asi

~~~
mutation Signup($signup: SignupInput!){
  signup(signupInput: $signup){
    user{
      fullName
    }
    token
  }
}
~~~

- En las variables

~~~
{
  "signup":{
    "fullName": "Pedro",
    "email": "pedro@gmail.com",
    "password": "123456"
  }
}
~~~

- Para el login, en el caso que quiera que me retorne el fullName

~~~
mutation Login($loginInput: LoginInput!){
  login(loginInput: $loginInput){
    user{
      fullName
    }
    token
  }
}
~~~

- En las variables

~~~
{
  "loginInput":{
    "email": "pedro@gmail.com",
    "password":"123456"
  }
}
~~~

- En HTTP HEADERS debo pasarle el token

~~~
{
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNkODM4NTEyLWM5ZTUtNDk4MC04MmJjLThjYjcxMmVhMWFkYSIsImlhdCI6MTc1MDE4MzI1NSwiZXhwIjoxNzUwMTk3NjU1fQ.mL-7XEklEMzq8c-32kjZhzhDxJyz97yMyQyHoBoNgr8
}
~~~

- Para el revalidateToken

~~~
query Revalidate{
revalidate {
  token
  user{
    id
    fullName
    roles
    isActive
  }
}
}
~~~

- Debo pasarle en Authorization el Bearer psidjosidhosdiubsoduisoidjsdktoken sin comillas
- Como no es admin ( y le puse el rol de admin para poder acceder a la ruta) me da un UNAUTHORIZED
- Puedo cambiar a ValidRoles.user solo para probar que pasa
-------
