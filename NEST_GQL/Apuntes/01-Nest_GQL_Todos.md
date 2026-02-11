# 01 NEST GRAPHQL HERRERA - TODOS

- Instalo

> npm i @nestjs/graphql @nestjs/apollo graphql apollo-server-express apollo-server-core

- Hay que hacer la configuración de ApolloDriver
- Necesita al menos una consulta, creo el TodosModule
- Creo el módulo de todos con **nest g res todos** dentro del proyecto
- Elijo GraphQl **(code first)**
- App.module

~~~js
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { TodosModule } from './todos/todos.module';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      playground: false, // Desactiva el playground clásico
      plugins: [ApolloServerPluginLandingPageLocalDefault()],
    }),
    TodosModule
  ],
})
export class AppModule {}
~~~


- Pongo en marcha el server con **npm start:dev**
- Para acceder a Apollo

> http://localhost:3000/graphql

- El todos.resolver que genera el CLI de Nest
- El Resolver lleva el decorador **@Resolver** con el tipo Todo
- Uso **@Mutation** cuando cambio algo de la data. Le paso el tipo (Todo) de retorno
- Si no, cuando solo es una consulta uso **@Query**. Le paso el tipo también (Todo) de retorno
- Puedo nombrar la consulta con un objeto usando **name** y el nombre de la consulta
- Puedo usar el objeto con **type** para transformar la data, a Int en este caso
- Si devuelve un arreglo coloco el tipo entre corcehetes
- Uso **@Args** para tomar la data de la consulta
- todos.resolver.ts

~~~js
import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { TodosService } from './todos.service';
import { Todo } from './entities/todo.entity';
import { CreateTodoInput } from './dto/create-todo.input';
import { UpdateTodoInput } from './dto/update-todo.input';

@Resolver(() => Todo)
export class TodosResolver {
  constructor(private readonly todosService: TodosService) {}

  @Mutation(() => Todo)
  createTodo(@Args('createTodoInput') createTodoInput: CreateTodoInput) {
    return this.todosService.create(createTodoInput);
  }

  @Query(() => [Todo], { name: 'todos' })
  findAll() {
    return this.todosService.findAll();
  }

  @Query(() => Todo, { name: 'todo' })
  findOne(@Args('id', { type: () => Int }) id: number) {
    return this.todosService.findOne(id);
  }

  @Mutation(() => Todo)
  updateTodo(@Args('updateTodoInput') updateTodoInput: UpdateTodoInput) {
    return this.todosService.update(updateTodoInput.id, updateTodoInput);
  }

  @Mutation(() => Todo)
  removeTodo(@Args('id', { type: () => Int }) id: number) {
    return this.todosService.remove(id);
  }
}
~~~

- El schema.gql no se modifica, se genera automáticamente. Es este

~~~gql
# ------------------------------------------------------
# THIS FILE WAS AUTOMATICALLY GENERATED (DO NOT MODIFY)
# ------------------------------------------------------

type Todo {
  """Example field (placeholder)"""
  exampleField: Int!
}

type Query {
  todos: [Todo!]!
  todo(id: Int!): Todo!
}

type Mutation {
  createTodo(createTodoInput: CreateTodoInput!): Todo!
  updateTodo(updateTodoInput: UpdateTodoInput!): Todo!
  removeTodo(id: Int!): Todo!
}

input CreateTodoInput {
  """Example field (placeholder)"""
  exampleField: Int!
}

input UpdateTodoInput {
  """Example field (placeholder)"""
  exampleField: Int
  id: Int!
}
~~~

- En la entity uso los decoradores **@ObjectType** en lugar de **@Entity** para indicar que es un objeto de graphQL
- Uso **@Field** para los campos pasándole el tipo y una descripción (opcional)
- todo.entity.ts

~~~js
import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class Todo {
  @Field(() => Int, { description: 'id' })
  id: number
  
  @Field(() => String, { description: 'description' })
  description: string

  @Field(() => Boolean, { description: 'Todo completed/pending' })
  done: boolean
}
~~~

- Instalo class-validator y class-transformer para el dto
- Configuro **useGlobalPipes** en el main
- main.ts

~~~js
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true
  }))

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
~~~

- El createTodoInput

~~~js
import { InputType, Int, Field } from '@nestjs/graphql';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

@InputType()
export class CreateTodoInput {
  
  @Field(() => String, { description: 'description' })
  @IsString()
  @IsNotEmpty()
  description: string

  @Field(() => Boolean)
  @IsBoolean()
  @IsOptional()
  done?: boolean
}
~~~


- En el todos.service.ts de momento no usamos DB, por lo que el código es más complejo delo que debería

~~~js
import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTodoInput } from './dto/create-todo.input';
import { UpdateTodoInput } from './dto/update-todo.input';
import { Todo } from './entities/todo.entity';

@Injectable()
export class TodosService {


  private Todos: Todo[] = [
    {id:1, description: "Piedra del Alma", done: false},
    {id:2, description: "Piedra del Espacio", done: false},
    {id:3, description: "Piedra del Poder", done: false},
    {id:4, description: "Piedra del Tiempo", done: false}
  ]

//Aggregations
  get totalTodos(){
    return this.Todos.length
  }

  get pendingTodos(){
    return this.Todos.filter(todo=>todo.done === false).length
  }
  get completedTodos(){
    return this.Todos.filter(todo=>todo.done === true).length
  }

  findAll(): Todo[]{
    return this.Todos
  }

  findOne(id: number): Todo {
    const todo= this.Todos.find(todo=>todo.id === id)

    if(!todo) throw new NotFoundException("Todo not found")

    return todo
  }

  create(createTodoInput: CreateTodoInput): Todo{
    const todo = new Todo()
    todo.description = createTodoInput.description
    todo.id = Math.max(...this.Todos.map(todo=> todo.id), 0) + 1
    createTodoInput.done ? todo.done = createTodoInput.done: todo.done = false

    this.Todos.push(todo)

    return todo
  }

  update(id: number, updateTodoInput: UpdateTodoInput): Todo{
    const {description, done} = updateTodoInput
    const todoToUpdate = this.findOne(id)

    if(description) todoToUpdate.description = description
    if(done !== undefined) todoToUpdate.done = done

    this.Todos = this.Todos.map(todo=>{
      return (todo.id===id) ? todoToUpdate: todo
    })

    return todoToUpdate
  }

  remove(id: number){
    const todo = this.findOne(id)

    this.Todos.filter(todo=> todo.id !== id)
    return true
  }

}
~~~

- Si quiero consultar las descripciones de los todos uso

~~~
query{
  todos {description}
}
~~~

- Si quiero cambiarle el nombre a tareas

~~~
query{
  tareas:todos{
    description
  }
}
~~~

- Cuando consulto el schema, si tengo **Int!** es que siempre voy a recibir un Int
- Lo mismo con los argumentos. Si no pongo el **nullable:true** es que el argumento será obligatorio
- Para hacer la consulta de un todo necesito indicarle el id

~~~
{
  todo(id:1){
    id
    description
    done
  }
}
~~~

- **fragment** son unidades reutilizables para hacer grupos de campos

~~~
{
  todo1: todo(id:1){
    ...fields
  }
  todo2:todo(id:2){
    ...fields
  }
}

fragment fields on Todo{
  description
  done
}
~~~

- **Para agregar filtros**, por ejemplo al finsAll
- En el resolver

~~~js
@Query(() => [Todo], { name: 'todos' })
findAll(@Args() statusArgs: StatusArgs) {
  return this.todosService.findAll(statusArgs);
}
~~~

- dto/statusArgs

~~~js
import { ArgsType, Field } from "@nestjs/graphql";
import { IsBoolean, IsOptional } from "class-validator";

@ArgsType()
export class StatusArgs{
    @Field(()=> Boolean, {nullable: true})
    @IsOptional()
    @IsBoolean()
    status?: boolean
}
~~~

- En el servicio

~~~js
findAll(statusArgs: StatusArgs): Todo[]{
  const {status} = statusArgs
  if(status !== undefined){
    return this.Todos.filter(todo=>todo.done === status)
  }
  return this.Todos
}
~~~

- En el query sería

~~~
query ($status: Boolean) {
pending: todos(status: false){
  ...fields
}
completed: todos(status: true){
  ...fields
}
}

fragment fields on Todo{
  description
  done
}
~~~

- Agrego conteos como campos adicionales en el resolver usando los gets del servicio

~~~js
@Query(()=>Int, {name: 'totalTodos'})
totalTodos(): number{
  return this.totalTodos()
}
@Query(()=>Int, {name: 'totalTodos'})
pendingTodos(): number{
  return this.pendingTodos()
}
@Query(()=>Int, {name: 'totalTodos'})
completedTodos(): number{
  return this.completedTodos()
}
~~~

- Los get en el servicio son estos
- todos.servcie.ts

~~~js
get totalTodos(){
  return this.Todos.length
}

get pendingTodos(){
  return this.Todos.filter(todo=>todo.done === false).length
}
get completedTodos(){
  return this.Todos.filter(todo=>todo.done === true).length
}
~~~

- Puedo juntarlos todos en una sola consulta creando un AggregationType

~~~js
import { Field, Int, ObjectType } from "@nestjs/graphql";

@ObjectType({description: 'Todo quick aggregations'})
export class AggregationType{

    @Field(()=> Int)
    total: number

    @Field(()=> Int)
    pending: number

    @Field(()=>Int)
    completed: number

    //en caso de que el metodo esté deprecado uso deprecationreason
    @Field(()=>Int, {deprecationReason: 'Most use completed instead'})
    totalTodosCompleted: number
}
~~~

- En el resolver

~~~js
@Query( ()=> AggregationType)
  aggregations(): AggregationType{
    return {
      completed: this.todosService.completedTodos,
      pending: this.todosService.pendingTodos,
      total: this.todosService.totalTodos,
      totalTodosCompleted: this.todosService.completedTodos
    }
  }
~~~

- Para hacer el query

~~~
{
  aggregations{
    completed
  }

  todos(status: true){
    ...fields
  }
}

fragment fields on Todo{
  description
  done
  id
}
~~~