# 05 NEST GRAPHQL - MAESTRO DETALLE

## Paginaciones

- Vamos a trabajar con maestro detalle, muy relacionado con índices, llaves únicas, strainghts compuestos...
- Es el ejercicio más complejo hecho hasta ahora, porque hay muchas inserciones, actualizaciones, maneras de trabajar
- Le daremos un montón de flexibilidad a nuestros querys
- Trabajaremos con un usuario con role de admin autenticado

~~~
mutation login($loginInput: LoginInput!){
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
        "email": "fernando@google.com",
        "password": "123456"
    }
}
~~~

- Copio el token y lo pego en headers/Authorization Bearer(espacio) token_sin_comillas

### Paginar resultados

- No queremos el volcado completo de la data, pierde el sentido de GraphQL
- En common/dto/pagination.args.ts

~~~js
import { ArgsType, Field, Int } from "@nestjs/graphql";
import { IsOptional, Min } from "class-validator";

@ArgsType()
export class PaginationArgs{

    @Field(()=> Int, {nullable: true})
    @IsOptional()
    @Min(0)
    offset: number = 0


    @Field(()=>Int, {nullable: true})
    @IsOptional()
    @Min(1)
    limit: number = 10
}
~~~

- En el items.resolver recuerda que el @UseGuards(JwtAuthGuard) está a nivel de resolver
- item.resolver.ts

~~~js
@Query(() => [Item], { name: 'items' })
findAll(@CurrentUser() user: User,
        @Args() paginationArgs: PaginationArgs) {
return this.itemsService.findAll(user, paginationArgs);
}
~~~

- Args no lleva ningún parámetro entre paréntesis porque le estoy pasando la data como un objeto con paginationArgs
- Nest lo mapea automáticamente
- item.service

~~~js
async findAll(user: User, paginationArgs: PaginationArgs): Promise<Item[]> {

const {limit, offset}= paginationArgs

const queryBuilder = this.itemRepository.createQueryBuilder()
                        .take(limit)
                        .skip(offset)
                        .where('"userId" = :userId', {userId: user.id})

return queryBuilder.getMany()
}
~~~

- "userId": es el nombre exacto de la columna en la base de datos (por eso está entre comillas dobles, útil si tu columna tiene mayúsculas o un nombre reservado).
- :userId: es un parámetro que se reemplaza por el valor real (similar a un placeholder).
- { userId: user.id }: es el objeto que provee el valor real para :userId.
- El query seria

~~~
query findAll{
    items(limit:100, offset:0){
        name
    }
}
~~~

- Recuerda usar el usuario con el que se hizo el seed (!) en este caso **pedro@hotmail.com**
- El dto SearchArgs me servirá patra buscar por una palabra en concreto
- common/dto/search.args.ts

~~~js
import { ArgsType, Field } from "@nestjs/graphql";
import { IsOptional, IsString } from "class-validator";

@ArgsType()
export class SearchArgs{
    
    @Field(()=> String, {nullable:true})
    @IsOptional()
    @IsString()
    search?: string
}
~~~

- Lo añado en el findAll del item.resolver

~~~js
@Query(() => [Item], { name: 'items' })
findAll(@CurrentUser() user: User,
        @Args() paginationArgs: PaginationArgs,
        @Args() searchArgs: SearchArgs
    ) {
return this.itemsService.findAll(user, paginationArgs, searchArgs);
}
~~~

- Si coloco el searchArgs antes que el paginationArgs me salta un error
- Es por el class-validator
- El forbidNonWhitelisted sirve para ignorar cuando me mandan más info de la que espero en el endpoint
- Comento la linea en el main

~~~js
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';


async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    //forbidNonWhitelisted: true,
    transform: true
  }))
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
~~~

- En el item.service uso el Like para que el search incluya o sea similar al parámetro
- Para usar este Like (de la consulta que hay comentada) debería crear un índice especializado
- Los comodines % son para que no importe lo que haya antes o despuies de la palabra
- O grabo todo en lowercase en la DB o formateo
- en el queryBuilder uso LOWER para reducir a minúsculas el name, uso el like para asemejarlo al parámetro del search que quiero como name con :name. Lo manejo como una variable porque necesito estar seguro de que no lo estoy inyectando directamente en la sentencia SQL
- En un objeto le paso en un template string el search que paso a minúsculas y coloco los comodines

~~~js
async findAll(user: User, paginationArgs: PaginationArgs, searchArgs: SearchArgs): Promise<Item[]> {

const {limit, offset}= paginationArgs
const {search} = searchArgs

const queryBuilder = this.itemRepository.createQueryBuilder()
                        .take(limit)
                        .skip(offset)
                        .where('"userId" = :userId', {userId: user.id})

if(search){
    queryBuilder.andWhere('LOWER(name) like :name', {name: `%${search.toLowerCase()}%`})
}

return queryBuilder.getMany()

// return this.itemRepository.find({
//   take: limit,
//   skip: offset,
//   where:{
//     user:{
//       id: user.id
//     },
//     name: Like(`%${search?.toLowerCase()}%`)
//   }
// })

}
~~~

- La query sería algo así (incluyendo el itemCount del user)

~~~
query findAll{
    items(limit:100, offset:0, search:"Rice"){
        name
        user{
            itemCount
        }
    }
}
~~~

- Si quiero hacer la consulta de items desde users ya no funciona por la relación que tenemos
- Nuestors usuarios tienen el campo items que está asociado con la DB
- Quiero romper esa relación automática y definir la forma en la que quiero que estos items se construyan y no decirle a typeorm que lo haga
- Ahora quiero que desde usuarios me cargue automáticamente un número de items (una paginación)
- De esta manera en graphQL creamos querys y mutaciones con campos que podemos ir añadiendo
- Añado paginationArgs y searchArgs al user.resolver
- user.resolver.ts

~~~js
@ResolveField(()=> [Item], {name: 'items'})
async getItemsByUser(
@CurrentUser([ValidRoles.admin]) adminUser: User,
@Parent() user: User,
@Args() paginationArgs: PaginationArgs,
@Args() searchArgs: SearchArgs
){
return this.itemService.findAll(user, paginationArgs, searchArgs)
}
~~~

### ¿Qué es `@ResolveField()` en NestJS + GraphQL?

`@ResolveField()` es un decorador que se usa dentro de un resolver (generalmente de una entidad como `User`, `Post`, etc.) para resolver **campos anidados o derivados** que no vienen directamente de la base de datos o que necesitan lógica adicional para ser devueltos.

### 📌 ¿Cuándo se usa?

* Cuando quieres **resolver un campo personalizado** en un tipo de GraphQL.
* Cuando necesitas **cargar relaciones manualmente**, por ejemplo, `user.posts`, `order.items`, etc.
* Cuando quieres aplicar lógica (paginación, filtros, validaciones, permisos, etc.).


###  ¿Qué es `@Parent()`?

`@Parent()` es un decorador que te da acceso al **objeto padre** del campo que estás resolviendo.

Por ejemplo, si estás resolviendo un campo `posts` dentro de `User`, entonces `@Parent()` te da acceso al `User`.

### ¿Qué pasa cuando haces este query?

```graphql
query {
  users {
    id
    name
    items(limit: 3) {
      id
      title
    }
  }
}
```

### El flujo es:

1. GraphQL ejecuta el resolver `users`.
2. Por cada `User`, GraphQL llama al `@ResolveField()` para obtener `items`.
3. NestJS inyecta:
   * El objeto `user` en `@Parent()`
   * El argumento `limit` en `@Args()`
4. Se ejecuta la lógica dentro de `getitemsByUser()` para devolver los posts correspondientes a ese usuario.


### ¿Cuándo usar `@ResolveField` + `@Parent`?

Usa esto cuando:

* El campo no viene directamente con la entidad (relaciones opcionales, filtradas, cargadas condicionalmente).
* Quieres tener control sobre cómo se resuelve (paginación, permisos, lógica personalizada).
* El campo necesita argumentos, lo cual no puedes hacer fácilmente con decoradores como `@OneToMany()`

## Nest GraphQL - Entidad para el manejo de listas Maestro Detalle

- Creo el módulo de Lists
- Necesitaré también el módulo de list-items

> nest g res lists --no-spec
> nest g res list-items --no-spec

- GraphQl code first, endpoints Yes
- Exporto el servicio de ListItems e importo el módulo en ListModule para poder usarlo
- list-items.module

~~~js
import { Module } from '@nestjs/common';
import { ListItemsService } from './list-items.service';
import { ListItemsResolver } from './list-items.resolver';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ListItem } from './entities/list-item.entity';

@Module({
  imports:[TypeOrmModule.forFeature([ListItem])],
  providers: [ListItemsResolver, ListItemsService],
  exports:[TypeOrmModule,ListItemsService]
})
export class ListItemsModule {}
~~~

- list.module

~~~js
import { Module } from '@nestjs/common';
import { ListsService } from './lists.service';
import { ListsResolver } from './lists.resolver';
import { ListItemsModule } from 'src/list-items/list-items.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { List } from './entities/list.entity';

@Module({
  imports: [
  TypeOrmModule.forFeature([List]), 
  ListItemsModule],
  providers: [ListsResolver, ListsService],
  exports:[TypeOrmModule, ListsService]
})
export class ListsModule {}
~~~

- El create-list.input

~~~js
import { InputType, Field } from '@nestjs/graphql';
import { IsNotEmpty, IsString } from 'class-validator';

@InputType()
export class CreateListInput {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  name: string
}
~~~

- En el update-list.input uso el ID

~~~js
import { IsUUID } from 'class-validator';
import { CreateListInput } from './create-list.input';
import { InputType, Field, PartialType, ID } from '@nestjs/graphql';

@InputType()
export class UpdateListInput extends PartialType(CreateListInput) {
  @Field(() => ID)
  @IsUUID()
  id: string;
}
~~~

- La entidad de List
- @Field aparece comentado porque quiero resolver estos campos con @ResolveField

~~~js
import { ObjectType, Field, Int, ID } from '@nestjs/graphql';
import { ListItem } from 'src/list-items/entities/list-item.entity';
import { User } from 'src/user/entities/user.entity';
import { Column, Entity, Index, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@ObjectType()
@Entity({name: 'lists'})
export class List {

  @PrimaryGeneratedColumn('uuid')
  @Field(()=> ID)
  id: string

  @Column()
  @Field(()=> String)
  name: string

  @ManyToOne(()=> User, (user)=> user.lists, {nullable: false, lazy: true})
  @Index('userId-list-index')
  @Field(()=> User)
  user: User

  @OneToMany(()=> ListItem, (listItem)=> listItem.list, {lazy: true})
  //@Field(()=> [ListItem])
  listItem: ListItem[]
}
~~~

- La entity de list-item

~~~js
import { ObjectType, Field, Int, ID } from '@nestjs/graphql';
import { Item } from 'src/items/entities/item.entity';
import { List } from 'src/lists/entities/list.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';

@ObjectType()
@Entity({name: 'listItems'})
//los constrainghts son reglas de validación para la DB, primero se añade la entidad y luego el decorador 
@Unique('listItem-item', ['list', 'item'])
export class ListItem {
  @PrimaryGeneratedColumn('uuid')
  @Field(()=> ID)
  id: string

  @Column({type: 'numeric'})
  @Field(()=> Number)
  quantity: number


  @Column({type: 'boolean'})
  @Field(()=> Boolean)
  completed: boolean

  @ManyToOne(()=> List, (list)=> list.listItem, {lazy: true})
  @Field(()=> List) 
  list: List
  
  @ManyToOne(()=> Item, (item)=> item.listItem, {lazy: true} )
  @Field(()=>Item)
  item: Item
}

~~~

- La user.entity

~~~js
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Item } from 'src/items/entities/item.entity';
import { List } from 'src/lists/entities/list.entity';
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

  @OneToMany(()=>Item, (item)=>item.user, {lazy: true})
  //@Field(()=> [Item])
  items: Item[]


  @OneToMany( () => List, (list) => list.user )
  // @Field( () => [Item] )
  lists: List[];
}
~~~

- La item.entity

~~~js
import { ObjectType, Field, ID, Float } from '@nestjs/graphql';
import { ListItem } from 'src/list-items/entities/list-item.entity';
import { User } from 'src/user/entities/user.entity';
import { Column, Entity, Index, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

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
  @Field(()=> String)
  category: string

  @Column({nullable: true})
  @Field(()=> String, {nullable: true})
  quantityUnits?: string

  @ManyToOne( () => User, (user) => user.items, { nullable: false, lazy: true })
  @Index('userId-index')
  @Field( () => User )
  user: User;

  @OneToMany(() => ListItem, (listItem) => listItem.item, { lazy: true })
  @Field( () => [ListItem] )
  listItem: ListItem[] 
}
~~~

## ✅ 1. RELACIONES ENTRE ENTIDADES

Te explico las relaciones clave entre las entidades: `User`, `List`, `Item` y `ListItem`.


### 🧍‍♂️ `User` tiene muchas `List`

```ts
@OneToMany(() => List, (list) => list.user)
lists: List[];
```

* **Relación**: Un usuario puede crear varias listas.
* **Sentido inverso**:

  ```ts
  @ManyToOne(() => User, (user) => user.lists)
  user: User
  ```


### 📋 `List` tiene muchos `ListItem`

```ts
@OneToMany(() => ListItem, (listItem) => listItem.list)
listItem: ListItem[];
```

* Una lista contiene varios ítems con cantidades (`ListItem`).
* **Sentido inverso**:

  ```ts
  @ManyToOne(() => List, (list) => list.listItem)
  list: List;
  ```


### 📦 `Item` representa un producto (reutilizable)

```ts
@OneToMany(() => ListItem, (listItem) => listItem.item)
listItem: ListItem[]
```

* Cada `Item` puede aparecer en varias listas, pero **en combinación con otras propiedades**, como cantidad o estado (por eso existe `ListItem`).
* **Sentido inverso**:

  ```ts
  @ManyToOne(() => Item, (item) => item.listItem)
  item: Item;
  ```

### 🧩 `ListItem` es una **entidad puente** entre `List` e `Item`

* Relaciona un `Item` con una `List`.
* Permite agregar datos personalizados como:

  * `quantity`
  * `completed`

> 🔁 Esta es una relación **muchos a muchos con información adicional**, por eso no se usa `@ManyToMany`, sino una entidad intermedia.


## ✅ 2. ¿Por qué usar `@Unique()` en `ListItem`?

```ts
@Unique('listItem-item', ['list', 'item'])
```

### 📌 Esto significa:

> "En la tabla `listItems`, **no puede haber dos registros con el mismo `list_id` y `item_id`**."

### 🔒 ¿Por qué es útil?

Evita duplicados como:

| list\_id | item\_id | quantity | completed            |
| -------- | -------- | -------- | -------------------- |
| L1       | I1       | 2        | false                |
| L1       | I1       | 3        | true ❌   ← duplicado |

* Ayuda a mantener integridad: un item **no puede estar dos veces** en la misma lista.
* Si necesitas cambiar la cantidad o estado, **actualizas** el `ListItem`, no creas otro.


## ✅ Relación visual resumida

```
User
 ├── List  (1:N)
 │    ├── ListItem  (1:N)
 │         └── Item (N:1)
 └── Item (1:N)
```

Y en forma más abstracta:

* `User` tiene `Lists` y `Items`
* `ListItem` une `List` + `Item`, con datos extra
* `@Unique(['list', 'item'])` asegura que un item esté solo una vez por lista


## 🧠 Resumen final

| Entidad    | Relación clave                               | ¿Por qué usar `@Unique`?                 |
| ---------- | -------------------------------------------- | ---------------------------------------- |
| `User`     | Tiene muchas `Lists` y muchos `Items`        | —                                        |
| `List`     | Pertenece a un `User`, tiene `ListItems`     | —                                        |
| `Item`     | Pertenece a un `User`, puede estar en listas | —                                        |
| `ListItem` | Une `List` + `Item`, con `quantity`          | Para evitar duplicados en la misma lista |

- El lists.resolver

~~~js
import { Resolver, Query, Mutation, Args, Int, ResolveField, Parent, ID } from '@nestjs/graphql';
import { ListsService } from './lists.service';
import { List } from './entities/list.entity';
import { CreateListInput } from './dto/create-list.input';
import { UpdateListInput } from './dto/update-list.input';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { User } from 'src/user/entities/user.entity';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { PaginationArgs } from 'src/common/dto/pagination.args';
import { SearchArgs } from 'src/common/dto/search.args';
import { ListItemsService } from 'src/list-items/list-items.service';
import { ListItem } from 'src/list-items/entities/list-item.entity';

@Resolver(() => List)
@UseGuards(JwtAuthGuard)
export class ListsResolver {
  constructor
  (private readonly listsService: ListsService,
   private readonly listItemsService: ListItemsService
  ) {}

  @Mutation(() => List)
  createList(
  @Args('createListInput') createListInput: CreateListInput,
  @CurrentUser() user: User
  ): Promise<List> {
    return this.listsService.create(createListInput, user);
  }

  @Query(() => [List], { name: 'lists' })
  findAll(
    @CurrentUser() user: User,
    @Args() paginationArgs: PaginationArgs,
    @Args() searchArgs: SearchArgs
  ): Promise<List[]> {
    return this.listsService.findAll(user, paginationArgs, searchArgs);
  }

  @Query(() => List, { name: 'list' })
  findOne(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: User
  ): Promise<List> {
    return this.listsService.findOne(id, user);
  }

  @Mutation(() => List)
  updateList(
    @Args('updateListInput') updateListInput: UpdateListInput,
    @CurrentUser() user: User
  ): Promise<List> {
    return this.listsService.update(updateListInput.id, updateListInput, user);
  }

  @Mutation(() => List)
  removeList(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: User
) {
    return this.listsService.remove(id, user);
  }

  @ResolveField(()=> [ListItem], {name: 'items'})
  async getListItems(
    @Parent() list : List
    @Args() paginationArgs: PaginationArgs,
    @Args() searchArgs: SearchArgs
  ): Promise<ListItem[]>{
    return this.listItemsService.findAll(list, paginationArgs, searchArgs)
  }

  @ResolveField(()=> Number, {name: 'totalItems'})
  async countListItemsByList(
    @Parent() list: List
  ): Promise<number>{
    return this.listItemsService.countListItemsByList(list)
  }
}
~~~

- El list.service

~~~js
import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateListInput } from './dto/create-list.input';
import { UpdateListInput } from './dto/update-list.input';
import { List } from './entities/list.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/user/entities/user.entity';
import { PaginationArgs } from 'src/common/dto/pagination.args';
import { SearchArgs } from 'src/common/dto/search.args';

@Injectable()
export class ListsService {

  constructor(
    @InjectRepository(List)
    private readonly listRepository: Repository<List>
  ){}


  async create(createListInput: CreateListInput, user: User): Promise<List> {
    const newList = this.listRepository.create({...createListInput, user})

    return await this.listRepository.save(newList)
  }

  async findAll(user: User, paginationArgs: PaginationArgs, searchArgs: SearchArgs): Promise<List[]> {
    const {limit, offset} = paginationArgs
    const {search} = searchArgs

    const queryBuilder = this.listRepository.createQueryBuilder()
                  .take(limit)
                  .skip(offset)
                  .where(`"userId" = :userId`, {userId: user.id})

    if(search) {
      queryBuilder.andWhere('LOWER(name) like :name', {name: `%${search.toLowerCase()}%`})
    }

    return queryBuilder.getMany()
  }

  async findOne(id: string, user: User): Promise<List> {
    const list = await this.listRepository.findOneBy({
      id,
      user: {id: user.id}
    })
    
    if(!list) throw new NotFoundException(`List with id ${id} not found`)

    return list
  }

  async update(id: string, updateListInput: UpdateListInput, user: User): Promise<List> {
      await this.findOne(id,user)

      const list = await this.listRepository.preload({...updateListInput, user})
      if(!list) throw new NotFoundException(`List with id ${id} not found`)
      
      return await this.listRepository.save(list)
  }

  async remove(id: string, user: User): Promise<List> {
    const list= await this.findOne(id, user)
    await this.listRepository.remove(list)
    return {...list, id}
  }

  async listCountByUser(user: User): Promise<number>{
    return this.listRepository.count({
      where:{
        user: {id: user.id}
      }
    })
  }
}
~~~

- El list-item.resolver.ts

~~~js
import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { ListItemsService } from './list-items.service';
import { ListItem } from './entities/list-item.entity';
import { CreateListItemInput } from './dto/create-list-item.input';
import { UpdateListItemInput } from './dto/update-list-item.input';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Resolver(() => ListItem)
@UseGuards(JwtAuthGuard)
export class ListItemsResolver {
  constructor(private readonly listItemsService: ListItemsService) {}

  @Mutation(() => ListItem)
  createListItem(
    @Args('createListItemInput') createListItemInput: CreateListItemInput): Promise<ListItem> {
    return this.listItemsService.create(createListItemInput);
  }

  @Query(() => ListItem, { name: 'listItem' })
  findOne(@Args('id', { type: () => Int }) id: number): Promise<ListItem> {
    return this.listItemsService.findOne(id);
  }

  @Mutation(() => ListItem)
  updateListItem(
    @Args('updateListItemInput') updateListItemInput: UpdateListItemInput): Promise<ListItem> {
    return this.listItemsService.update(updateListItemInput.id, updateListItemInput);
  }
}
~~~

- El create-listItem.input

~~~js
import { InputType, Int, Field, ID } from '@nestjs/graphql';
import { IsBoolean, IsNumber, IsOptional, IsUUID, Min } from 'class-validator';

@InputType()
export class CreateListItemInput {

  @Field( () => Number, { nullable: true })
  @IsNumber()
  @Min(0)
  @IsOptional()
  quantity: number = 0;

  @Field( () => Boolean, { nullable: true })
  @IsBoolean()
  @IsOptional()
  completed: boolean = false;

  @Field( () => ID )
  @IsUUID()
  listId: string;

  @Field( () => ID )
  @IsUUID()
  itemId: string;
}
~~~

- El update-list-item.input

~~~js
import { CreateListItemInput } from './create-list-item.input';
import { InputType, Field, PartialType, ID } from '@nestjs/graphql';

@InputType()
export class UpdateListItemInput extends PartialType(CreateListItemInput) {
  @Field(() => ID)
  id: string;
}
~~~

- El list-item.service.ts

~~~js
import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateListItemInput } from './dto/create-list-item.input';
import { UpdateListItemInput } from './dto/update-list-item.input';
import { InjectRepository } from '@nestjs/typeorm';
import { ListItem } from './entities/list-item.entity';
import { Repository } from 'typeorm';
import { List } from 'src/lists/entities/list.entity';
import { PaginationArgs } from 'src/common/dto/pagination.args';
import { SearchArgs } from 'src/common/dto/search.args';

@Injectable()
export class ListItemsService {

  constructor(
    @InjectRepository(ListItem)
    private readonly listItemsRepository: Repository<ListItem>
  ){}

  async create(createListItemInput: CreateListItemInput): Promise<ListItem> {
    const {itemId, listId, ...rest} = createListItemInput
    const newListItem = await this.listItemsRepository.create({
      ...rest,
      item: {id: itemId},
      list: {id: listId}
    })

    await this.listItemsRepository.save(newListItem)

    return this.findOne(newListItem.id)
  }

  async findAll(list: List, paginationArgs: PaginationArgs, searchArgs: SearchArgs
  ) : Promise<ListItem[]> {
    const {limit, offset} = paginationArgs
    const {search} = searchArgs

    const queryBuilder = this.listItemsRepository.createQueryBuilder('listItem')
            .innerJoin('listItem.item', 'item')
            .take(limit)
            .skip(offset)
            .where(`"listId" = :listId`, {listId: list.id})
      if(search){
        queryBuilder.andWhere('LOWER(item.name) like :name', {name: `%${search.toLowerCase()}%`})
      }

      return await queryBuilder.getMany()
  }

  async countListItemsByList( list: List): Promise<number>{
    return this.listItemsRepository.count({
      where: {list: {id: list.id}}
    })
  }

  async findOne(id: string): Promise<ListItem> {
      const listItem = await this.listItemsRepository.findOneBy({id})
      if(!listItem) throw new NotFoundException(`Item with id ${id} not found`)
      return listItem
  }

 async update(id: string, updateListItemInput: UpdateListItemInput): Promise<ListItem> {
  const { listId, itemId, id: _, ...rest } = updateListItemInput;

  // Construimos un objeto con los campos a actualizar
  const updateData: any = { ...rest };

  if (listId) updateData.list = { id: listId };
  if (itemId) updateData.item = { id: itemId };

  await this.listItemsRepository
    .createQueryBuilder()
    .update()
    .set(updateData)
    .where('"id" = :id', { id })
    .execute();

  return this.findOne(id);
}

}
~~~

- El list.resolver queda así con los @ResolveField

~~~js
import { Resolver, Query, Mutation, Args, Int, ResolveField, Parent, ID } from '@nestjs/graphql';
import { ListsService } from './lists.service';
import { List } from './entities/list.entity';
import { CreateListInput } from './dto/create-list.input';
import { UpdateListInput } from './dto/update-list.input';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { User } from 'src/user/entities/user.entity';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { PaginationArgs } from 'src/common/dto/pagination.args';
import { SearchArgs } from 'src/common/dto/search.args';
import { ListItemsService } from 'src/list-items/list-items.service';
import { ListItem } from 'src/list-items/entities/list-item.entity';

@Resolver(() => List)
@UseGuards(JwtAuthGuard)
export class ListsResolver {
  constructor
  (private readonly listsService: ListsService,
   private readonly listItemsService: ListItemsService
  ) {}

  @Mutation(() => List)
  createList(
  @Args('createListInput') createListInput: CreateListInput,
  @CurrentUser() user: User
  ): Promise<List> {
    return this.listsService.create(createListInput, user);
  }

  @Query(() => [List], { name: 'lists' })
  findAll(
    @CurrentUser() user: User,
    @Args() paginationArgs: PaginationArgs,
    @Args() searchArgs: SearchArgs
  ): Promise<List[]> {
    return this.listsService.findAll(user, paginationArgs, searchArgs);
  }

  @Query(() => List, { name: 'list' })
  findOne(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: User
  ): Promise<List> {
    return this.listsService.findOne(id, user);
  }

  @Mutation(() => List)
  updateList(
    @Args('updateListInput') updateListInput: UpdateListInput,
    @CurrentUser() user: User
  ): Promise<List> {
    return this.listsService.update(updateListInput.id, updateListInput, user);
  }

  @Mutation(() => List)
  removeList(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: User
) {
    return this.listsService.remove(id, user);
  }

  @ResolveField(()=> [ListItem], {name: 'items'})
  async getListItems(
    @Parent() list : List,
    @Args() paginationArgs: PaginationArgs,
    @Args() searchArgs: SearchArgs
  ): Promise<ListItem[]>{
    return this.listItemsService.findAll(list, paginationArgs, searchArgs)
  }

  @ResolveField(()=> Number, {name: 'totalItems'})
  async countListItemsByList(
    @Parent() list: List
  ): Promise<number>{
    return this.listItemsService.countListItemsByList(list)
  }
}
~~~

## ✅ Queries disponibles: 

### 1. `lists(pagination, search): [List]`

```graphql
query {
  lists(limit: 10, offset: 0, search: "compras") {
    id
    name
    items {
      id
      quantity
      completed
    }
    totalItems
  }
}
```

🔁 **Backend:**

* `listsService.findAll()` con paginación y búsqueda.
* Cada lista incluye los campos resueltos por `@ResolveField`:

  * `items` → usa `listItemsService.findAll()` con paginación y búsqueda.
  * `totalItems` → usa `countListItemsByList()`.


### 2. `list(id): List`

```graphql
query {
  list(id: "LIST_ID") {
    id
    name
    items(limit: 5, offset: 0, search: "leche") {
      id
      quantity
      completed
    }
    totalItems
  }
}
```

🔁 **Backend:**

* `listsService.findOne(id, user)` → verifica que la lista sea del usuario.
* Luego, `items` y `totalItems` se resuelven como en el anterior.

### 3. `listItem(id): ListItem`

```graphql
query {
  listItem(id: 123) {
    id
    quantity
    completed
    item {
      id
      name
    }
  }
}
```

🔁 **Backend:**

* `listItemsService.findOne(id)` → busca por ID directamente.

> 🔸 Mejorar: No estás validando si el `listItem` realmente le pertenece al usuario. Podés extenderlo con validación similar a `listsService.findOne()` si querés más seguridad.


## ✅ Mutations disponibles

### 4. `createList(createListInput): List`

```graphql
mutation {
  createList(createListInput: { name: "Mi lista nueva" }) {
    id
    name
  }
}
```

🔁 **Backend:**

* `listsService.create(input, user)` → guarda con la relación `user`.


### 5. `createListItem(createListItemInput): ListItem`

```graphql
mutation {
  createListItem(createListItemInput: {
    quantity: 2,
    completed: false,
    listId: "LIST_ID",
    itemId: "ITEM_ID"
  }) {
    id
    quantity
    completed
  }
}
```

🔁 **Backend:**

* `listItemsService.create()` → crea la relación entre un `List`, un `Item` y las propiedades del `ListItem`.


### 6. `updateList(updateListInput): List`

```graphql
mutation {
  updateList(updateListInput: {
    id: "LIST_ID"
    name: "Nombre actualizado"
  }) {
    id
    name
  }
}
```

🔁 **Backend:**

* `listsService.update()` → verifica propietario y actualiza.


### 7. `updateListItem(updateListItemInput): ListItem`

```graphql
mutation {
  updateListItem(updateListItemInput: {
    id: "LIST_ITEM_ID",
    quantity: 3,
    completed: true
  }) {
    id
    quantity
    completed
  }
}
```

🔁 **Backend:**

* `listItemsService.update()` → ejecuta `.update()` con `QueryBuilder`.

> 🛠 **Posible mejora:** También podés validar si el `ListItem` pertenece al `user` como extra.

## 🧩 ¿Qué pasa dentro del backend?

### Ejemplo: `lists` query

1. **El cliente ejecuta:**

   ```graphql
   query {
     lists(limit: 10, offset: 0, search: "compras") {
       id
       name
       items { id quantity }
       totalItems
     }
   }
   ```

2. **NestJS llama:**

   * `listsResolver.findAll()`
   * Que invoca `listsService.findAll(user, pagination, search)`

3. **GraphQL ve que pediste `items` → llama `getListItems()`**

   * `listItemsService.findAll(list, pagination, search)`

4. **También llama `countListItemsByList()`** para el `totalItems`.


## ✅ Conclusión: lógica de las queries

Tu sistema usa:

* **Queries** con filtros + paginación (`limit`, `offset`, `search`).
* **Field resolvers** para obtener relaciones (`items`, `totalItems`).
* **Mutations** para crear y actualizar entidades, con relaciones creadas vía IDs.
* **Autenticación con `@UseGuards(JwtAuthGuard)`** y uso de `@CurrentUser()`.

## Querys

- Para crear una lista (debo estar logueado)

~~~
mutation {
  createList(createListInput: { name: "Compras" }) {
    id
    name
  }
}
~~~

- Para crear un Item

~~~
mutation {
  createItem(createItemInput: {
    name: "Leche de avena",
    category: "Bebida vegetal"

  }) {
    id
    name
  }
}
~~~

- Para añadir un item a la lista

~~~
mutation {
  createListItem(createListItemInput: {
    listId: "60817c30-30ca-4771-b93a-9a5e1c7e4300" , //LISTA_ID
    itemId: "58dfedc0-e150-47ca-a99f-71b4d4f0c646",  //ITEM_ID
    quantity: 2,
    completed: false
  }) {
    id
    quantity
    completed
    item {
      name
    }
  }
}
~~~

- Para listar items de la lista compras

~~~
query {
  lists(limit: 10, offset: 0) {
    id
    name
    items {
      id
      quantity
      completed
      item {
        name
      }
    }
  }
}
~~~
---------