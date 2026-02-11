# 03 NEST GQL - USUARIOS Y ENUMS

- Importo el AuthModule que es donde tengo el JwtService (exporto el JwtService en exports de AuthModule)
- Uso .forRootAsync y el useFactory para inyectar el JwtService, el driver es obligatorio
- Con el useFactory tengo el context desde donde desetructuro la request
- Si no dejo un espacio después del Bearer usando el replace para eliminar esto de la request y quedarme solo con el token quedaría un espacio antes del token lo que daría error
- Debo ponerle ? a authorization porque puede no venir
- Si el payload es null lanzo error
- Puedo comprobar si tengo el token y decodificarlo
- De esta manera puedo bloquear el schema con la autenticación
- Pero de esta manera también **ESTOY PIDIENDO UN TOKEN PARA EL SIGNIN Y EL SIGNUP**, por lo que lo dejaré comentado de momento


~~~js
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { ItemsModule } from './items/items.module';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [
    ConfigModule.forRoot(),
    GraphQLModule.forRootAsync({
      driver: ApolloDriver,
      imports: [AuthModule],
      inject: [JwtService],
      useFactory: async( JwtService: JwtService)=>({
        playground: false,
        autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
        plugins: [ApolloServerPluginLandingPageLocalDefault()],
        context({req}){                               //dejo un espacio después de Bearer
          //  const token = req.headers.authorization?.replace('Bearer ', '') 
          //  if(!token) throw Error('Token needed')
          //  const payload = JwtService.decode(token)
          //  if(!payload) throw Error('Token not valid')
        }
      }),
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
    ItemsModule,
    UserModule,
    AuthModule
  ],
})
export class AppModule {}
~~~

- De momento voy a dejar que en el context devuelva la req para que el AuthGuard pueda hacer su trabajo

~~~js
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { ItemsModule } from './items/items.module';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [
    ConfigModule.forRoot(),
    GraphQLModule.forRootAsync({
      driver: ApolloDriver,
      imports: [AuthModule],
      inject: [JwtService],
      useFactory: async( JwtService: JwtService)=>({
        playground: false,
        autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
        plugins: [ApolloServerPluginLandingPageLocalDefault()],
        context: ({req})=>({req}) //<---- AQUI!
        })
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
    ItemsModule,
    UserModule,
    AuthModule
  ],
  providers: [JwtService]
})
export class AppModule {}
~~~

- En AuthModule exporto JwtModule (importante!)

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
  exports: [JwtModule] //<-----AQUI!
})
export class AuthModule {}
~~~

- Para hacer un enum del tipo graphql uso registerEnumType

~~~js
import { registerEnumType } from "@nestjs/graphql";

export enum ValidRoles{
    admin = 'admin',
    user='user',
    superUser='superUser'
}

registerEnumType( ValidRoles, {name: 'ValidRoles', description: "Fiesta en tu casa a las tres"})
~~~

- Creo el **@ArgsType** para pasarle los roles que me interesa devolver en el findAll 
- user/dto/args/valid-roles.args.ts

~~~js
import { ArgsType, Field } from "@nestjs/graphql";
import { IsArray } from "class-validator";
import { ValidRoles } from "src/auth/enums/valid-roles.enum";

@ArgsType()
export class ValidRolesArgs{
    @Field(()=> [ValidRoles], {nullable: true})
    @IsArray()
    roles: ValidRoles[]= [] // declararlo como un arreglo vacío indica que por defecto será nulo
}
~~~

- user.resolver.ts

~~~js
import { Resolver, Query, Mutation, Args, Int, ID } from '@nestjs/graphql';
import { UserService } from './user.service';
import { User } from './entities/user.entity';
import { ValidRolesArgs } from './dto/args/valid-roles.args';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { ValidRoles } from 'src/auth/enums/valid-roles.enum';
import { ParseUUIDPipe } from '@nestjs/common';
import { UpdateUserInput } from './dto/update-user.input';

@Resolver(() => User)
export class UserResolver {
  constructor(private readonly userService: UserService) {}

  @Query(() => [User], { name: 'users' })
  async findAll(
    @Args() validRoles: ValidRolesArgs, //al ser un array validRoles no va dentro del paréntesis de @Args
    @CurrentUser([ValidRoles.admin, ValidRoles.superUser]) user: User): Promise<User[]> {
    
      return this.userService.findAll(validRoles.roles);
  }

  @Query(() => User, { name: 'user' })
  findOne(@Args('id', { type: () => ID}, ParseUUIDPipe) id: string): Promise<User> {
    return this.userService.findOneById(id);
  }

  @Mutation(()=> User, {name: 'updateUser'})
  async updateUser(
    @Args('updateUserInput') UpdateUserInput: UpdateUserInput,
    @CurrentUser([ValidRoles.admin]) user: User): Promise<User | undefined>{
      return this.userService.update(UpdateUserInput.id, UpdateUserInput, user)
    }

  @Mutation(()=> User)
  blockUser(
    @Args('id', {type: ()=> ID}, ParseUUIDPipe) id: string,
    @CurrentUser([ValidRoles.admin]) user: User): Promise<User>{
    return this.userService.blockUser(id, user)
  }
}
~~~

- user.service

~~~js
import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { SignupInput } from 'src/auth/dto/signup.input';
import * as bcrypt from 'bcrypt'
import { ValidRolesArgs } from './dto/args/valid-roles.args';
import { UpdateUserInput } from './dto/update-user.input';
import { ValidRoles } from 'src/auth/enums/valid-roles.enum';

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

  async findAll(roles: ValidRoles[]) {
    if (roles.length === 0){
      return this.userRepository.find()
    }

    return this.userRepository.createQueryBuilder('user') //importante usar un alias!
      .andWhere('user.roles && ARRAY[:...roles]', { roles })
      .setParameter('roles', roles)
      .getMany()
  }

  async findOneByEmail(email: string): Promise<User| undefined>{
    try {
      return await this.userRepository.findOneByOrFail({email})
    } catch (error) {
       throw new NotFoundException(`El cliente con id ${email} no se encuentra`)
    }
  }

  async findOneById(id: string): Promise<User> {
    try {
      return await this.userRepository.findOneByOrFail({id})
      
    } catch (error) {
      throw new NotFoundException(`El cliente con id ${id} no se encuentra`)
    }
  }

  async update(id: string, updateUserInput: UpdateUserInput, updateBy: User): Promise<User | undefined>{
    try {
      const user = await this.userRepository.preload({
        ...updateUserInput,
        id
      })

      if(!user) throw new NotFoundException("User not found")

      user.lastUpdateBy = updateBy  //relación ManyToOne en user.entity
      return await this.userRepository.save(user)

    } catch (error) {
      this.handleDbErrors(error)
    }
  }

  async blockUser(id: string, adminUser: User): Promise<User>{
    const userToBlock = await this.findOneById(id)
    userToBlock.isActive = false
    userToBlock.lastUpdateBy = adminUser
    return await this.userRepository.save(userToBlock)
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

### Explicación findAll

### 1. Parámetro `roles: ValidRoles[]`

* Esta función recibe un arreglo de roles (`roles`), que son valores del enum `ValidRoles` (por ejemplo, `['admin', 'user']`).

### 2. Condición para cuando no se pasan roles

```ts
if (roles.length === 0){
  return this.userRepository.find()
}
```

* Si no se pasó ningún rol, devuelve **todos los usuarios** de la base de datos con `find()`, sin filtro.

### 3. Query builder con alias

```ts
return this.userRepository.createQueryBuilder('user')
```

* Crea una consulta a la tabla de usuarios usando el alias `'user'`. El alias es un nombre corto para referirse a la tabla dentro de la consulta SQL.

### 4. Filtro con `andWhere`

```ts
.andWhere('user.roles && ARRAY[:...roles]', { roles })
```

* Aquí se usa una cláusula SQL `AND WHERE` con el operador PostgreSQL `&&` que significa **"intersección entre arrays"**.

* `user.roles` es la columna que guarda un array de roles del usuario.

* `ARRAY[:...roles]` crea un array en SQL a partir del parámetro `roles` que le pasamos.

* El filtro devuelve solo usuarios cuyo array `roles` tenga **al menos un elemento en común** con el array `roles` pasado.


### 5. `setParameter`

```ts
.setParameter('roles', roles)
```

* Aquí asignamos el valor de la variable `roles` (el array de roles) al parámetro `:roles` dentro de la consulta SQL.

* Ejecuta la consulta y devuelve un array con todos los usuarios que cumplen el filtro.

### Resumen

* Si no pasas roles, devuelve todos los usuarios.
* Si pasas roles, devuelve solo los usuarios que tengan alguno de esos roles (comparando arrays en PostgreSQL).

### Nota importante:

* La sintaxis correcta para pasar un array como parámetro en TypeORM + PostgreSQL suele ser **sin usar el spread `...`** dentro del `ARRAY[]`.
* Por ejemplo, mejor es usar:

```ts
.andWhere('user.roles && :roles', { roles })
```

y pasar el array directamente sin `ARRAY[:...roles]`.

- La user.entity

~~~js
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Column, Entity, JoinColumn, ManyToMany, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

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
  password?: string

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

  @ManyToOne(()=> User, (user)=> user.lastUpdateBy, {nullable: true, lazy: true})
  @JoinColumn({name: 'lastUpdateBy'})
  @Field(()=>User, {nullable: true})
  lastUpdateBy?: User
}
~~~

- Explicación de la relación:

Cada usuario (`User`) puede haber sido **actualizado por otro usuario**, es decir, existe un campo que apunta a **quién hizo la última modificación**.

Este es un ejemplo clásico de **autorreferencia**: la entidad se relaciona consigo misma.

#### 1. `@ManyToOne(() => User, (user) => user.lastUpdateBy, { nullable: true, lazy: true })`

* `@ManyToOne` indica que **muchos usuarios pueden ser actualizados por un solo usuario** (relación muchos-a-uno).
* `() => User` es la función que devuelve la entidad relacionada (en este caso, la misma clase `User`).
* `(user) => user.lastUpdateBy` está **mal en este contexto**. Lo explicaré más abajo.
* `{ nullable: true }` permite que el campo sea `null` (es decir, el usuario puede no haber sido actualizado por nadie).
* `lazy: true` significa que esta propiedad no se carga automáticamente; en cambio, se carga solo cuando haces algo como `await user.lastUpdateBy`.

#### 2. `@JoinColumn({ name: 'lastUpdateBy' })`

* Indica que esta entidad (`User`) contiene la **columna de clave foránea** `lastUpdateBy` que apunta a otro `User`.

#### 3. `@Field(() => User, { nullable: true })`

* Esto es parte de la integración con GraphQL. Expone este campo como un tipo `User` (puede ser `null`) en el schema GraphQL.

---

### ⚠️ Error potencial: `(user) => user.lastUpdateBy`

Esa parte indica que en la otra entidad (el otro `User`) hay una **propiedad inversa** llamada `lastUpdateBy`, lo cual **no tiene sentido aquí**, porque eso causaría un ciclo infinito.

Si **no necesitas navegar de "usuario actualizador" hacia "usuarios que actualizó"**, entonces esta propiedad inversa no es necesaria. La forma correcta sería simplemente:

```ts
@ManyToOne(() => User, { nullable: true, lazy: true })
@JoinColumn({ name: 'lastUpdateBy' })
@Field(() => User, { nullable: true })
lastUpdateBy?: Promise<User>  // o sin Promise si no usas lazy loading
```

> **Recomendación**: Usa la forma sin la propiedad inversa a menos que realmente necesites saber qué usuarios ha actualizado alguien.

- Añado los campos al updateDto

~~~js
import { ValidRoles } from 'src/auth/enums/valid-roles.enum';
import { CreateUserInput } from './create-user.input';
import { InputType, Field, PartialType, ID } from '@nestjs/graphql';
import { IsArray, IsBoolean, IsOptional, IsUUID } from 'class-validator';

@InputType()
export class UpdateUserInput extends PartialType(CreateUserInput) {
  @Field(() => ID)
  @IsUUID()
  @IsOptional()
  id: string;

  @Field(()=> [ValidRoles], {nullable: true})
  @IsArray()
  @IsOptional()
  roles?: ValidRoles[]

  @Field(()=> Boolean, {nullable: true})
  @IsBoolean()
  @IsOptional()
  isActive?: boolean
}
~~~

- Para el query del findAll debo estar logueado
- He cambiado a Pedro a admin

~~~
mutation LoginUser($loginInput: LoginInput!){
  login(loginInput: $loginInput){
    user{
      fullName
    }
    token
  }
}
~~~

- En las variables le paso

~~~
{
  "loginInput":{
    "email": "pedro@gmail.com",
    "password": "123456"
  }
}
~~~

- Para el findAll le paso el token en headers/Authorization y el token con Bearer (espacio) y comillas ni nada
- Para ser admin, primero debo cambiar el role
- Le indico que acepte el ValidRoles.user en el update para poder hacerlo (momentáneamente)
- Uso el @UseGuard(AuthGuard) en el endpoint

~~~
mutation UpdateUser($updateUserInput: UpdateUserInput!) {
  updateUser(updateUserInput: $updateUserInput) {
    roles
  }
}
~~~

- En las variables

~~~
{
  "updateUserInput": {
    "id": "98d1510e-0f4a-43ab-9471-7c342cdcfff8",
    "roles": ["admin"]
  }
}
~~~

- Le paso el token que he extraído del login y se lo paso a headers/ Auth y escribo Bearer(espacio) y el token sin comillas
- Recuerda que **debes usar @UseGuards(JwtAuthGuard)** en el endpoint

~~~js
@Query(() => [User], { name: 'users' })
@UseGuards(JwtAuthGuard)
async findAll(
  @Args() validRoles: ValidRolesArgs, //al ser un array validRoles no va dentro del paréntesis de @Args
  @CurrentUser([ValidRoles.admin, ValidRoles.superUser, ValidRoles.user]) user: User): Promise<User[]> {
  
    return this.userService.findAll(validRoles.roles);
}
~~~

## Bloquear un usuario - ManyToOne


- En el resolver

~~~js
@Mutation(()=> User)
@UseGuards(JwtAuthGuard)
blockUser(
  @Args('id', {type: ()=> ID}, ParseUUIDPipe) id: string,
  @CurrentUser([ValidRoles.admin]) user: User): Promise<User>{
  return this.userService.blockUser(id, user)
}
~~~

- En la user.entity
  - La relación es con User
  - lazy en true para que cargue la relación, porque no puedo usar eager al usar queryBuilder
  - JoinColumn para que typeOrm cargue la info de este campo, uso el name para ponerle nombre
  - Hay que indicarle con Field a graphQL el tipo de dato

~~~js
@ManyToOne(()=> User, (user)=> user.lastUpdateBy, {nullable: true, lazy: true})
@JoinColumn({name: 'lastUpdateBy'})
@Field(()=>User, {nullable: true})
lastUpdateBy?: User
~~~

- En el user.service

~~~js
async blockUser(id: string, adminUser: User): Promise<User>{
  const userToBlock = await this.findOneById(id)
  userToBlock.isActive = false
  userToBlock.lastUpdateBy = adminUser
  return await this.userRepository.save(userToBlock)
}
~~~

- En el método findAll

~~~js
async findAll(roles: ValidRoles[]) {
  if (roles.length === 0){
    return this.userRepository.find({
      relations:{
        lastUpdateBy: true
      }
    })
  }

  return this.userRepository.createQueryBuilder('user')
    .andWhere('user.roles && ARRAY[:...roles]', { roles })
    .setParameter('roles', roles)
    .getMany()
}
~~~

## Update

- En el user.resolver

~~~js
@Mutation(()=> User, {name: 'updateUser'})
@UseGuards(JwtAuthGuard)
async updateUser(
  @Args('updateUserInput') UpdateUserInput: UpdateUserInput,
  @CurrentUser([ValidRoles.admin]) user: User): Promise<User | undefined>{
    return this.userService.update(UpdateUserInput.id, UpdateUserInput, user)
  }
~~~

- En el user.service

~~~js
async update(id: string, updateUserInput: UpdateUserInput, updateBy: User): Promise<User | undefined>{
  try {
    const user = await this.userRepository.preload({
      ...updateUserInput,
      id
    })

    if(!user) throw new NotFoundException("User not found")

    user.lastUpdateBy = updateBy  //relación ManyToOne en user.entity
    return await this.userRepository.save(user)

  } catch (error) {
    this.handleDbErrors(error)
  }
}
~~~

## Items + Usuarios: Peticiones autenticadas

- Trabajaremos basándonos en el dueño del token (no pidiendo el id del usuario)
- Más adelante haremos paginación
- No voy a poder crear un item si no se a qué usuario pertenece
- Me interesa poder diferenciar estos artículos porque podemos tener cientos de usuarios y algunos el mismo artículo
- Por eso necesito saber de quién es el artículo de manera indexada
- En la entidad item debo establecer la relación con los usuarios
- Uno a uno significaría un item por un usuario
- Muchos a uno significa que muchos articulos pueden estar asociados a una persona
- De uno a muchos significa que un item puede tener muchos usuarios
- **Tiene más sentido muchos (items) a uno (usuario)**
- Indico con qué entidad me voy a relacionar y defino el campo que voy a usar para establecer la relación
- Pongo user.items (que todavía no existe)
- Con **@Index** indico que lo quiero indexado 
- Se pueden crear índices únicos con unique en true

~~~js
@Index(["firstName", "lastName"], {unique: true})
~~~

- Debo indicarle el campo a GraphQL con **@Field**
- El nullable en true indica que puede ser nulo, y el lazy en true es para poder traerme la información en la query (sirve como el eager)
- item.entity

~~~js
import { ObjectType, Field, ID, Float } from '@nestjs/graphql';
import { User } from 'src/user/entities/user.entity';
import { Column, Entity, Index, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@ObjectType()
@Entity()
export class Item {
  @PrimaryGeneratedColumn('uuid')
  @Field(() => ID)
  id: string

  @Column()
  @Field(()=> String)
  name: string

  // @Column()  Ya no pedimos quantity, no es parte del item la cantidad
  // @Field(()=> Float)
  // quantity : number

  @Column({nullable: true})
  @Field(()=> String, {nullable: true})
  quantityUnits?: string //si la cantidad de unidades

  @ManyToOne( ()=> User, (user)=> user.items, {nullable: true, lazy: true})
  @Index('userId-index')
  @Field(()=> User)
  user: User  
}
~~~

- Hago el cambio de quantity en el createItem.input también

~~~js
import { InputType, Field, Float } from '@nestjs/graphql';
import { IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

@InputType()
export class CreateItemInput {

  @Field(()=> String)
  @IsString()
  @IsNotEmpty()
  name: string

  //quantity

  @Field(()=> String, {nullable: true})
  @IsOptional()
  @IsString()
  quantityUnits?: string
}
~~~

- En la user.entity establezco la relación con Item

~~~js
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Item } from 'src/items/entities/item.entity';
import { Column, Entity, JoinColumn, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

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
  password?: string

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

  @ManyToOne(()=> User, (user)=> user.lastUpdateBy, {nullable: true, lazy: true})
  @JoinColumn({name: 'lastUpdateBy'})
  @Field(()=>User, {nullable: true})
  lastUpdateBy?: User
                      //el lazy en true deberemos deshabilitarlo después
  @OneToMany(()=>Item, (item)=>item.user, {lazy: true})
  @Field(()=> [Item])
  items: Item[]
}
~~~

## CreateItem

- Pusimos el **@UseGuards** a nivel de **resolver**, por lo que **tengo el user** en la request que extraigo con **@CurrentUser**
- Vamos con createItem

~~~js
import { Resolver, Query, Mutation, Args, Int, ID } from '@nestjs/graphql';
import { ItemsService } from './items.service';
import { Item } from './entities/item.entity';
import { CreateItemInput } from './dto/create-item.input';
import { UpdateItemInput } from './dto/update-item.input';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { User } from 'src/user/entities/user.entity';

@Resolver(() => Item)
@UseGuards(JwtAuthGuard)
export class ItemsResolver {
  constructor(private readonly itemsService: ItemsService) {}

  @Mutation(() => Item)
  createItem(@Args('createItemInput') createItemInput: CreateItemInput,
            @CurrentUser() user: User) {
    return this.itemsService.create(createItemInput, user);
  }
}
~~~

- En el item.service

~~~js
async create(createItemInput: CreateItemInput, user: User): Promise<Item> {
  const newItem = this.itemRepository.create({...createItemInput, user})
  return await this.itemRepository.save(newItem)
}
~~~

- Para el findAll en el resolver

~~~js
@Query(() => [Item], { name: 'items' })
findAll(@CurrentUser() user: User) {
  return this.itemsService.findAll(user);
}
~~~

- En el item.service

~~~js
async findAll(user: User): Promise<Item[]> {
    //TODO: filtrar, paginar
    return await this.itemRepository.find({
      where:{
        user:{
          id: user.id
        }
      }
    });
  }
~~~

- Para findOne y removeItem
- No deberíamos poder borrar un item que sea parte de una lista o si se borra un item borrar la lista (luego lo veremos)
- En el remove todavía no he hecho el borrado lógico (soft delete, ya se hará)
- En el resolver

~~~js
  @Query(() => Item, { name: 'item' })
  findOne(@Args('id', {type: ()=> ID}) id: string,
          @CurrentUser() user: User
) {
    return this.itemsService.findOne(id, user);
  }

  @Mutation(() => Item)
  removeItem(@Args('id', {type: ()=> ID}) id: string,
  @CurrentUser() user: User
) {
    return this.itemsService.remove(id, user);
  }
~~~

- En el item.service a findOne le paso el id y el id del user

~~~js
  async findOne(id: string, user: User): Promise<Item> {
                            //de esta manera tienen que cumplirse las dos condiciones
    const item = await this.itemRepository.findOneBy({id, user:{id: user.id}})
    if(!item) throw new NotFoundException(`El item con id ${id} no se encuentra`)
    return item
  }

  async remove(id: string, user: User): Promise<Item> {
    const item = await this.findOne(id, user)
    await this.itemRepository.remove(item)
    return {...item, id}
  }
~~~

- Puedo traerme la info del user cuando hago la query porque tengo el lazy en true desde la entidad
- El updateItem en el resolver

~~~js
@Mutation(() => Item)
updateItem(@Args('updateItemInput') updateItemInput: UpdateItemInput,
@CurrentUser() user: User
) {
  return this.itemsService.update(updateItemInput.id, updateItemInput, user);
}
~~~

- En el item.service
- Con el preload no puedo usar el where ni nada, pero si le paso los campos hace la búsqueda automáticamente

~~~js
async update(id: string, updateItemInput: UpdateItemInput, user: User): Promise<Item> {
  //si no usara el lazy en true podría hacerlo así con el preload
  //const item = await this.itemRepository.preload({...updateItemInput, user})

  await this.findOne(id, user)//si el flujo continua es que tengo el item
  const item = await this.itemRepository.preload(updateItemInput)
  if(!item) throw new NotFoundException(`El item con id ${id} no se encuentra`)
  return await this.itemRepository.save(item)
}
~~~

- El dto sigue igual

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

## ResolveField con información del padre

- Para poder limitar el número de items puedo crear un itemCount
- Sabiendo el usuario sería un simple **SELECT * la_tabla WHERE user.id== USER**
- Cómo lo quiero agregar a la query de usuarios, tiene sentido colocarlo en el user.resolver
- Con **@ResolveField** estoy modificando mi esquema diciéndole que voy a tener un nuevo campo y **este es el método que va a usarse en este campo cuando sea solicitado**
- **@Parent** nos permite tener acceso a la formación del padre (User)
- En el user.resolver también tengo el **@useGuard(JwtAuthGuard)** a nivel de resolver
- Inyecto el itemService

~~~js
@ResolveField(()=> Int, {name: 'itemCount'})
async itemCount(
  @CurrentUser([ValidRoles.admin]) adminUser: User,
  @Parent() user: User
): Promise<number>{
  return this.itemService.itemCountByUser(user)
}
~~~

- Para poder usar el servicio debo exportarlo de ItemModule e importar el módulo en UserModule

~~~js
import { Module } from '@nestjs/common';
import { ItemsService } from './items.service';
import { ItemsResolver } from './items.resolver';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Item } from './entities/item.entity';

@Module({
  imports:[TypeOrmModule.forFeature([Item])],
  providers: [ItemsResolver, ItemsService],
  exports:[TypeOrmModule, ItemsService]
})
export class ItemsModule {}
~~~

- En el user.module

~~~js
import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserResolver } from './user.resolver';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { ItemsModule } from 'src/items/items.module';

@Module({
  imports:[TypeOrmModule.forFeature([User]), ItemsModule],
  providers: [UserResolver, UserService],
  exports:[UserService]
})
export class UserModule {}
~~~

- En el items.service

~~~js
  itemCountByUser(user: User){
    return this.itemRepository.count({
      where:{
        user:{
          id: user.id
        }
      }
    })
  }
~~~
--------