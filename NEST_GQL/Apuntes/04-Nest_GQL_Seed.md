# 04 NEST GRAPHQL - SEED

- La variable de entorno STATE (ahora en dev) nos servirá para que cuando estemos en producción no se pueda ejecutar el SEED y nos destruya la DB
- Vamos a llenar la DB con usuarios e items
- Creo el módulo de SEED

> nest g res seed --no-spec

- GraphQL (code first) sin endpoints
- El SEED se podría hacer con una query pero técnicamente es una mutación
- Dentro del SEED creo la carpeta data con la data a insertar
- La data seed a insertar está en

> https://raw.githubusercontent.com/pedroobando/curso-nest-graphql/refs/heads/main/03-anylist/src/seed/data/data-seed.ts

- La data luce así

~~~js
export const SEED_USERS = [
  {
    fullName: 'Pedro E Obando M',
    email: 'pedro@hotmail.com',
    password: '123456',
    roles: ['user', 'admin', 'superUser'],
    isActive: true,
  },
  {
    fullName: 'Fernando Herrera',
    email: 'fernando@google.com',
    password: '123456',
    roles: ['admin', 'superUser', 'user'],
    isActive: true,
  },
  {
    fullName: 'Luis F Medina',
    email: 'luis@hotmail.com',
    password: '123456',
    roles: ['user', 'admin'],
    isActive: true,
  },
  {
    fullName: 'Pedro Rafael Medina Milla',
    email: 'pedrom@hotmail.com',
    password: '123456',
    roles: ['user'],
    isActive: false,
  },
];

export const SEED_ITEMS = [
  {
    name: 'Chicken breast (skinless,boneless)',
    quantityUnits: 'lb',
    category: 'meat',
  },
  {
    name: 'Chicken thighs (skinless,boneless)',
    quantityUnits: 'box',
    category: 'meat',
  },
  {
    name: 'Fish filets',
    quantityUnits: 'unit',
    category: 'meat',
  },
  {
    name: 'Ground turkey or chicken',
    quantityUnits: 'lb',
    category: 'meat',
  },
  {
    name: 'Lean ground beef',
    quantityUnits: 'pound',
    category: 'meat',
  },
  {
    name: 'Veggie burgers',
    quantityUnits: 'box',
    category: 'meat',
  }
]

export const SEED_LISTS = [{ name: 'Lista de Supermercado' }, { name: 'Diarios' }, { name: 'Fin de semana' }];
~~~

- En el seed.module importo los módulos de ItemsModule y UsersModule. 
- Debo haber exportado los servicios de ambos **y el TypeOrmModule** en exports
- Añado el ConfigModule para poder usar el ConfigService

~~~js
import { Module } from '@nestjs/common';
import { SeedService } from './seed.service';
import { SeedResolver } from './seed.resolver';
import { ItemsModule } from 'src/items/items.module';
import { UserModule } from 'src/user/user.module';

@Module({
  imports:[ConfigModule, ItemsModule, UserModule],
  providers: [SeedResolver, SeedService],
})
export class SeedModule {}
~~~

- En el seed.resolver

~~~js
import { Mutation, Resolver } from '@nestjs/graphql';
import { SeedService } from './seed.service';

@Resolver()
export class SeedResolver {
  constructor(private readonly seedService: SeedService) {}

  @Mutation(()=> Boolean, {name: 'executedSeed'})
  async executeSeed(): Promise<boolean>{
    return this.seedService.executeSeed()
  }
}
~~~

- Inyecto los repositorios y los servicios

~~~js
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Item } from 'src/items/entities/item.entity';
import { ItemsService } from 'src/items/items.service';
import { User } from 'src/user/entities/user.entity';
import { UserService } from 'src/user/user.service';
import { Repository } from 'typeorm';

@Injectable()
export class SeedService {

    private isProd: boolean

    constructor(
        private readonly configService: ConfigService,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(Item)
        private readonly itemRepository: Repository<Item>,
        private readonly  userService: UserService,
        private readonly itemService: ItemsService
    ){
        this.isProd = configService.get('STATE') === 'prod'
    }
    
}
~~~

- Los métodos del seedService para ejecutar el SEED

~~~js
    async executeSeed(){
        if(this.isProd){
            throw new UnauthorizedException('We can not run SEED on Prod')
        }

        await this.deleteDB()
        const user= await this.loadUsers()
        await this.loadItems(user)

        return true
    }

    async deleteDB(){
        await this.itemRepository.createQueryBuilder('items')
            .delete()
            .where({})
            .execute()

        await this.userRepository.createQueryBuilder('users')
            .delete()
            .where({})
            .execute()
    }

    async loadUsers(): Promise<User>{
        const users: User[]= []
        for (const user of SEED_USERS){
             const createdUser = await this.userService.create(user)
            users.push(createdUser!)
        }

        return users[0]
    }

    async loadItems(user: User): Promise<void> {
    const itemsPromises: Promise<Item>[] = [];

    for (const item of SEED_ITEMS) {
    const cleanItem = {
        ...item,
        quantityUnits: item.quantityUnits ?? undefined, // convierte null → undefined
    };

    itemsPromises.push(this.itemService.create(cleanItem, user));
}
    await Promise.all(itemsPromises);
}
~~~

- He tenido que hacer unos cambios en el create-item.input y la item.entity
- En el create-item.input he borrado quantity y he añadido category

~~~js
import { InputType, Field, Float } from '@nestjs/graphql';
import { IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

@InputType()
export class CreateItemInput {

  @Field(()=> String)
  @IsString()
  @IsNotEmpty()
  name: string


  @Field(()=> String, {nullable: true})
  @IsOptional()
  @IsString()
  quantityUnits?: string

  @Field(()=> String)
  @IsString()
  category: string
}
~~~

- Lo mismo en la entity

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

  @Column()
  @Field(()=> String)
  category: string

  @Column({nullable: true})
  @Field(()=> String, {nullable: true})
  quantityUnits?: string

  @ManyToOne( ()=> User, (user)=> user.items, {nullable: true, lazy: true})
  @Index('userId-index')
  @Field(()=> User)
  user: User  
}
~~~

- Para ejecutar el seed

~~~
mutation executeSeed{
  executeSeed
}
~~~

## README

~~~md
# Dev

1. Clonar el proyecto
2. Copiar el **env.template** y renombrar a **.env**
3. Ejecutar

> npm install

4. Levantar la imagen de docker

> docker-compose up -d

5. Levantar el backend 

> npm run start:dev

6. Visitar el sitio

> localhost:3000/graphql
~~~

---------------
