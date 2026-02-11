# NEST DURO DE ROER - MySQL

> nest new mysql-project

> npm i class-validator class-transformer

> npm i @nestjs/swagger

> npm i @nestjs/typeorm typeorm mysql2

- Configuro el Swagger y el GlobalPipes en el main.ts, el app.controller y app.service no los quiero para nada

~~~js
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({transform: true}))

  const config = new DocumentBuilder()
    .setTitle('MySQL')
    .setDescription('Usando MySQL')
    .setVersion('1.0')
    .addTag('mysql')
    .build()

    const document = SwaggerModule.createDocument(app,config)
    SwaggerModule.setup('api', app, document)

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
~~~

- Configuración typeORM en app.module

~~~js
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({transform: true}))

  app.setGlobalPrefix('api/v1')

  const config = new DocumentBuilder()
    .setTitle('MySQL')
    .setDescription('Usando MySQL')
    .setVersion('1.0')
    .addTag('mysql')
    .build()

    const document = SwaggerModule.createDocument(app,config)
    SwaggerModule.setup('api', app, document)

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
~~~

- Creo la DB con Workbench con el mismo nombre (shop), el charset en utf8 con utf8_general_mysql

## CRUD completo de Product

> nest g res product

- create-product.dto.ts

~~~js
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from "class-validator";

export class CreateProductDto {

    @IsOptional()
    @IsNumber()
    @IsPositive()
    id: number

    @IsString()
    @IsNotEmpty()
    name: string

    @IsNotEmpty()
    @IsNumber()
    @IsPositive()
    stock: number

    @IsNotEmpty()
    @IsNumber()
    @IsPositive()
    price: number

    @IsOptional()
    @IsBoolean()
    deleted: boolean

    @IsOptional()
    @IsString()
    friendlySearch: string
}
~~~

- product.entity.ts

~~~js
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Product {
  
        @PrimaryGeneratedColumn()
        id: number
    
        @Column({
        type: String,
        nullable: false, 
        length: 40
        })
        name: string
    
        @Column({
            type: Number,
            nullable: false, 
            default: 0
        })
        stock: number
    
         @Column({
            type: Number,
            nullable: false,
            default: 0
        })
        price: number
    
        @Column({
            type: Boolean,
            nullable: false, 
            default: false
        })
        deleted: boolean

            @Column({
            type: String,
            nullable: false,
            unique: true
        })
        friendlySearch: String
}
~~~

- En el product.module uso el .forFeature para indicar la entidad

~~~js
import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';

@Module({
  imports:[
    TypeOrmModule.forFeature([Product])
  ],
  controllers: [ProductController],
  providers: [ProductService],
})
export class ProductModule {}
~~~

- También debo indicarla en app.module

~~~js
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductModule } from './product/product.module';
import { Product } from './product/entities/product.entity';


@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'root',
      database: 'shop',
      entities: [Product], //<------- AQUI!
      synchronize: true
    }),
    ProductModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
~~~

- Para usar las variables de entorno debo usar (e instalar) ConfigService de @nestjs/config
- Para la validación usaré ConfigModule.forRoot y joi
- app.module

~~~js
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductModule } from './product/product.module';
import { Product } from './product/entities/product.entity';
import { ClientModule } from './client/client.module';
import { Client } from './client/entities/client.entity';
import { Address } from './client/entities/address.entity';
import { ConfigService, ConfigModule} from '@nestjs/config';
import * as Joi from 'joi'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        HOST_DB: Joi.string().required(),
        PORT_DB: Joi.number().default(3306).required(),
        USERNAME_DB: Joi.string().required(),
        PASSWORD_DB: Joi.string().required(),
        NAME_DB: Joi.string().required()
      }),
    }),
    TypeOrmModule.forRootAsync({
      inject:[ConfigService],
      useFactory: (config:ConfigService)=>{
        return{
      type: 'mysql',
      host: config.get<string>('HOST_DB'),
      port: config.get<number>('PORT_DB'),
      username: config.get<string>('USERNAME_DB'),
      password: config.get<string>('PASSWORD_DB'),
      database: config.get<string>('NAME_DB'),
      entities: [Product, Client, Address], 
      synchronize: true
        }
      }
    }),
    ProductModule,
    ClientModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
~~~

- Inyecto el repositorio en el products.service
- Si no existe el producto lo inserta, si existe lo actualiza

~~~js
import { Injectable } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ProductService {

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>
  ){}


  async create(createProductDto: CreateProductDto) {
    return await this.productRepository.save(createProductDto)
  }
}
~~~

- En el body de la petición le paso este body

~~~json
{
    "id": 1,
    "name": "Producto1",
    "stock": 10,
    "price": 200
}
~~~

- Al crearle el id en el primer producto, los demás los crea autoincrementalmente
- Hay que validar si el producto existe o no
- Lo hago con el campo friendlySearch
- product.service.ts

~~~js
import { BadRequestException, ConflictException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { Repository, UpdateResult } from 'typeorm';

@Injectable()
export class ProductService {

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>
  ){}


  async create(createProductDto: CreateProductDto) {
    
    const product = this.searchFriendlyCreate(createProductDto)
    
    try {
    return await this.productRepository.save(createProductDto)  

    } catch (error) {
      if((error as any).code == 'ER_DUP_ENTRY' ){
        throw new BadRequestException('El producto ya existe')
      }
    }
    throw new InternalServerErrorException()
  }

  //Este método se puede incluir en un hook de TypeORM @BeforeInsert en product.entity
   async searchFriendlyCreate(createProductDto: CreateProductDto){
      createProductDto.friendlySearch = createProductDto.name.toLowerCase()
                                            .replaceAll(' ', '_')
                                            .replaceAll("'", "")

    const searchParameter = createProductDto.friendlySearch

    return createProductDto
  }

  async findAll() {
    return await this.productRepository.find({
      where: {deleted: false}
    })
  }

  async findOne(id: number) {
    const product= await  this.productRepository.findOne({
      where: {id}
    });

    if(!product) throw new BadRequestException('Product not found')
    
    return product
  }

  async update(id: number, updateProductDto: UpdateProductDto) {
    const product = await this.findOne(id)

    try{
      return await this.productRepository.save(product)
    }catch(error){
      throw new BadRequestException('Algo ha ido mal en la actualización')
    }

  }

  async remove(id: number) {
    const product = await this.findOne(id)

    if(product.deleted) throw new ConflictException('El producto ya está borrado')
  
    const rows: UpdateResult =  await this.productRepository.update(
        {id},
        {deleted: true}
      )

      return rows.affected == 1
  }
}
~~~

- Puedo hacer este metodo friendlySearch antes de la inserción en la entity con **@BeforeInsert** de TypeORM
- product.entity.ts

~~~js
@BeforeInsert()
@BeforeUpdate()
getSearchFriendly(){
    this.friendlySearch = this.name.toLowerCase().replaceAll(" ", "_").replaceAll("'", "")
}
~~~

- También hay otros como **@AfterRemove**, **@AfterInsert**, **@AfterUpdate**

- Para restaurar el prodcuto uso PATCH

~~~js
@Patch('restore-product/:id')
restoreProduct(@Param('id') id: string) {
    return this.productService.restoreProduct(+id);
}
~~~

- En el prodcut.service

~~~js
  async restoreProduct(id: number){
    const product = await this.findOne(id)

  
      if(!product.deleted){
        throw new ConflictException('El producto no está borrado') 
      }
    
      try {
        const rows: UpdateResult = await this.productRepository.update(
          {id},
          {deleted: false}
        )

        return rows.affected == 1
      
      } catch (error) {
        throw new BadRequestException('Algo ha ido mal restaurando el producto')
      }
    
  }
~~~

## Creando StockDto

- stock.dto

~~~js
import { IsNotEmpty, IsNumber, IsPositive, Max, Min } from "class-validator";

export class StockDto{
    @IsNotEmpty()
    @IsPositive()
    @IsNumber()
    id: number

    @IsNotEmpty()
    @Min(0)
    @Max(1000)
    @IsNumber()
    stock: number

}
~~~

## Actualizando stock de un producto

- En el product.controller

~~~js
@Patch('stock')
updateStock(@Body() stock: StockDto){
    return this.productService.updateStock(stock)
  }
~~~

- En el product.service

~~~js
async updateStock(s: StockDto){
const product = await this.findOne(s.id)
if(product.deleted) throw new BadRequestException('El producto ha sido borrado') 

const rows: UpdateResult= await this.productRepository.update(
    {id: s.id},
    {stock: s.stock}
)
}
~~~

## Documentar con Swagger

- product.controller.ts

~~~js
import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { StockDto } from './dto/stock.dto';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';


@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @ApiOperation({
    description: 'Crea un producto'
  })
  @ApiBody({
    description: "Crea un producto mediante CreateProductDto",
    type: CreateProductDto,
    examples:{
      ejemplo1:{
        value:{
          "id":2,
          "name": "Producto2",
          "stock": 10,
          "price": 230
        }
      },
      ejemplo2:{
        value:{
          "name": "Producto3",
          "stock": 12,
          "price": 145
        }
      }
    }
    
  })
  @ApiResponse({
    status:201,
    description: "Producto creado correctamente"
  })
  @ApiResponse({
    status:409,
    description: "El producto existe"
  })
  create(@Body() createProductDto: CreateProductDto) {
    return this.productService.create(createProductDto);
  }
{...code}
}
~~~

- Para documentar el DTO

~~~js
export class CreateProductDto {

    @ApiProperty({
    name: "id",
    required: false,
    description: "id del producto",
    type: Number
    })
    @IsOptional()
    @IsNumber()
    @IsPositive()
    id: number
}
~~~

## Módulo cliente

> nest g res client

- create-client.dto.td

~~~js
import { IsEmail, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from "class-validator"

export class CreateClientDto {
    @IsOptional()
    @IsPositive()
    @IsNumber()
    id: number

    @IsString()
    @IsNotEmpty()
    name: string

    @IsNotEmpty()
    @IsEmail()
    email: string
}
~~~

- Creo la entity con client.entity.ts

~~~js
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Client {

    @PrimaryGeneratedColumn()
    id: number

    @Column({
        type: String,
        nullable: false,
        length: 40
    })
    name: string
    
    @Column({
        type: String,
        nullable: false,
        unique: true,
        length: 40
    })
    email: string
}
~~~

- Debo añadir la entity en app.module

~~~js
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductModule } from './product/product.module';
import { Product } from './product/entities/product.entity';
import { ClientModule } from './client/client.module';
import { Client } from './client/entities/client.entity';
import { Address } from './client/entities/address.entity';
import { ConfigService, ConfigModule} from '@nestjs/config';
import * as Joi from 'joi'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        HOST_DB: Joi.string().required(),
        PORT_DB: Joi.number().default(3306).required(),
        USERNAME_DB: Joi.string().required(),
        PASSWORD_DB: Joi.string().required(),
        NAME_DB: Joi.string().required()
      }),
    }),
    TypeOrmModule.forRootAsync({
      inject:[ConfigService],
      useFactory: (config:ConfigService)=>{
        return{
      type: 'mysql',
      host: config.get<string>('HOST_DB'),
      port: config.get<number>('PORT_DB'),
      username: config.get<string>('USERNAME_DB'),
      password: config.get<string>('PASSWORD_DB'),
      database: config.get<string>('NAME_DB'),
      entities: [Product, Client, Address], 
      synchronize: true
        }
      }
    }),
    ProductModule,
    ClientModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}

~~~

- Genero una relación OneToOne con la entiddad de address
- AddressDto

~~~js
import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator"

export class AddressDto{
    
    @IsOptional()
    @IsNumber()
    id?: number

    @IsNotEmpty()
    @IsString()
    country: string

    @IsNotEmpty()
    @IsString()
    province: string

    @IsNotEmpty()
    @IsString()
    city: string

    @IsNotEmpty()
    @IsString()
    street: string
}
~~~

- Creo la entity address.entity.ts

~~~js
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Address{

    @PrimaryGeneratedColumn()
    id: number

    @Column({
        type: String,
        nullable: false,
        length: 30
    })
    country: string

     @Column({
        type: String,
        nullable: false,
        length: 50
    })
    province: string

     @Column({
        type: String,
        nullable: false,
        length: 40
    })
    city: string

     @Column({
        type: String,
        nullable: false,
        length: 60
    })
    street: string
}
~~~

- En client.module debo importar con .forFeature la entity de Client y Address

~~~js
import { Module } from '@nestjs/common';
import { ClientService } from './client.service';
import { ClientController } from './client.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Client } from './entities/client.entity';
import { Address } from './entities/address.entity';

@Module({
  imports:[
    TypeOrmModule.forFeature([Client, Address])
  ],
  controllers: [ClientController],
  providers: [ClientService],
})
export class ClientModule {}
~~~

- **Importo en app.module Address en entities**

- Creo la relación OneToOne en client.entity.ts
- El cascade con insert crea automáticamente la address en la tabla de Address cuando la introduzco en el body de la petición POST para crear el cliente
- Coloco el eager en true para poder visualizar la address en los resultados de búsqueda

~~~js
import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Address } from "./address.entity";

@Entity()
export class Client {

    @PrimaryGeneratedColumn()
    id: number

    @Column({
        type: String,
        nullable: false,
        length: 40
    })
    name: string
    
    @Column({
        type: String,
        nullable: false,
        unique: true,
        length: 40
    })
    email: string

    @OneToOne(()=>Address, {cascade: ['insert', 'update'], eager: true})
    @JoinColumn()
    address: Address
}
~~~

- Le añado la propiedad al dto!

~~~js
import { Type } from "class-transformer"
import { IsEmail, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from "class-validator"
import { Address } from "../entities/address.entity"

export class CreateClientDto {
    @IsOptional()
    @IsPositive()
    @IsNumber()
    id: number

    @IsString()
    @IsNotEmpty()
    name: string

    @IsNotEmpty()
    @IsEmail()
    email: string

    @Type(()=> Address) //Uso Type de class-transformer
    @IsNotEmpty()
    address: Address
}
~~~

- Este Type de class-transformer funciona porque en app.module tengo el **transform: true**
- Vamos con el createClient del client.service, inyecto los repositorios de client y address
- Para crear un cliente debo validar si existe o no, creo el método findClient
- También evalúo si la dirección existe por id, o por dirección completa

~~~js
import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Client } from './entities/client.entity';
import { Repository } from 'typeorm';
import { Address } from './entities/address.entity';

@Injectable()
export class ClientService {


  constructor(
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
    @InjectRepository(Address)
    private readonly addressRepository: Repository<Address>

  ){}

 async create(client: CreateClientDto) {
    const clientExists = await this.findClient(client)

    if(clientExists){
      if(clientExists.id){
        throw new BadRequestException("El cliente con este id ya existe")
      }else {
        throw new BadRequestException("El cliente con este mail ya existe")
      }
   }

     let addressExists: Address | null = null

     try {
      if(client.address.id){
        addressExists = await this.addressRepository.findOne({
          where: {
            id: client!.address.id
          }
        })
      }else{
        addressExists = await this.addressRepository.findOne({
          where:{
            country: client.address.country,
            province: client.address.province,
            city: client.address.city,
            street: client.address.street
          }
        })
      }

      if(addressExists) throw new ConflictException('Esta dirección ya está registrada')
     
        return this.clientRepository.save(client)
    
    } catch (error) {
      
      throw new Error(error)
     }
  }

  async findClient(client: CreateClientDto){
    return await this.clientRepository.findOne({
      where: [
        {id: client.id},
        {email: client.email}
      ]
    })
  }
{...code}
}
~~~

- Uso un objeto como este en el body de la petición POST

~~~json
{ 
   "name": "Migue",
   "email": "migue@gmail.com",
   "address":{
     "country": "Spain",
     "province":"BCN",
     "city": "Barcelona",
     "street":"Concili de Trento 56"
   }
   
}
~~~

## Obtener todos los clientes

- client.service.ts

~~~js
async findAll() {
    return await this.clientRepository.find({})
  }
~~~

## Obtener cliente por ID

- client.controller

~~~js
@Get(':id')
findOne(@Param('id') id: string) {
  return this.clientService.findOne(+id);
}
~~~

- En el client.service.ts

~~~js
async findOne(id: number) {
  const clientExists = await this.clientRepository.findOne({
  where: {id}
  })

  if(!clientExists) throw new BadRequestException("El cliente no existe")

  return clientExists
}
~~~

## Update

~~~js
async update(client: UpdateClientDto) {
  
    const clientWithEmail = await this.clientRepository.findOne({
    where: { email: client.email },
  });

  if (clientWithEmail && clientWithEmail.id !== client.id) {
    throw new ConflictException('El id no coincide con el cliente registrado');
  }

  
  const clientExists = await this.clientRepository.findOne({
    where: { id: client.id },
    relations: ['address'], // Asegúrate de cargar address si es necesario
  });

  if (!clientExists) {
    throw new BadRequestException('El cliente no existe');
  }

  let addressExists: Address | null = null;
  let deletedAddress= false

  if (client.address?.id) {
    addressExists = await this.addressRepository.findOne({
      where: { id: client.address.id },
    });
  } else {
    addressExists = await this.addressRepository.findOne({
      where: {
        country: client.address?.country,
        province: client.address?.province,
        city: client.address?.city,
        street: client.address?.street,
      },
    });
  }

  if (
    addressExists &&
    addressExists.id !== clientExists.address?.id // Compara solo si el cliente tiene dirección
  ) {
    throw new ConflictException('La dirección ya existe');
  }else{
    deletedAddress = true
  }

  // Si todo está bien, actualiza el cliente
  const updatedClient= await this.clientRepository.save({ ...clientExists, ...client });

  //si está en true borro la dirección referenciada
  if(deletedAddress){
    await this.addressRepository.delete({id: clientExists.address.id})
  }

  return updatedClient
}
~~~

## Eliminar un cliente

- En el client.service.ts

~~~js
async remove(id: number) {
  const clientExists = await this.clientRepository.findOne({
    where: {id}
  })

  if(!clientExists) throw new BadRequestException("El cliente no existe")

  const rows = await this.clientRepository.delete({id})

  if(rows.affected === 1){
    await this.addressRepository.delete({id: clientExists.address.id})
  }

  return
}
~~~
----

## Creando el módulo de Order

> nest g res order

- order.entity.ts

~~~js

~~~

- Con **@IsUUID** me aseguro de que sea un uuid
- Uso **@Type** para convertir a fecha
- create-order.dto

~~~js
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity()
export class Order {
    @PrimaryGeneratedColumn('uuid')
    id?: string

    @CreateDateColumn()
    createdAt: Date

    @UpdateDateColumn()
    updatedAt: Date

    @Column({
        type: Date,
        nullable: true
    })
    confirmAt: Date
}
~~~

- Debo usar TypeOrmModule.forFeature para indicar la entidad, también debo agregarla en **app.module**
- order.module.ts

~~~js
import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';

@Module({
  imports:[TypeOrmModule.forFeature([Order])],
  controllers: [OrderController],
  providers: [OrderService],
})
export class OrderModule {}
~~~

- En app.module

~~~js
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductModule } from './product/product.module';
import { Product } from './product/entities/product.entity';
import { ClientModule } from './client/client.module';
import { Client } from './client/entities/client.entity';
import { Address } from './client/entities/address.entity';
import { ConfigService, ConfigModule} from '@nestjs/config';
import { OrderModule } from './order/order.module';
import * as Joi from 'joi'
import { Order } from './order/entities/order.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        HOST_DB: Joi.string().required(),
        PORT_DB: Joi.number().default(3306).required(),
        USERNAME_DB: Joi.string().required(),
        PASSWORD_DB: Joi.string().required(),
        NAME_DB: Joi.string().required()
      }),
    }),
    TypeOrmModule.forRootAsync({
      inject:[ConfigService],
      useFactory: (config:ConfigService)=>{
        return{
      type: 'mysql',
      host: config.get<string>('HOST_DB'),
      port: config.get<number>('PORT_DB'),
      username: config.get<string>('USERNAME_DB'),
      password: config.get<string>('PASSWORD_DB'),
      database: config.get<string>('NAME_DB'),
      entities: [Product, Client, Address, Order], //<---- AQUI! 
      synchronize: true
        }
      }
    }),
    ProductModule,
    ClientModule,
    OrderModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
~~~

## Relación ManyToOne/OneToMany

- En Order sería @ManyToOne(()=> Client)
- En User sería @OneToMany(()=> Order)
- También usaré @ManyToMany(()=> Product)
- order.entity.ts

~~~js
import { Client } from "src/client/entities/client.entity";
import { Product } from "src/product/entities/product.entity";
import { Column, CreateDateColumn, Entity, JoinTable, ManyToMany, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity()
export class Order {
    @PrimaryGeneratedColumn('uuid')
    id?: string

    @CreateDateColumn()
    createdAt: Date

    @UpdateDateColumn()
    updatedAt: Date

    @Column({
        type: Date,
        nullable: true
    })
    confirmAt: Date

    @ManyToOne(()=> Client,
                client=> client.orders
                )
    client: Client

    @ManyToMany(()=> Product)
    @JoinTable({name: 'order_products'}) //le especifico el nombre del campo de la tabla
    products: Product[]               
}
~~~

- En client.entity.ts hago **@OneToMany** coloco el eager en true para ver las órdenes del cliente

~~~js
import { Client } from "src/client/entities/client.entity";
import { Product } from "src/product/entities/product.entity";
import { Column, CreateDateColumn, Entity, JoinTable, ManyToMany, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity()
export class Order {
    @PrimaryGeneratedColumn('uuid')
    id?: string

    @CreateDateColumn()
    createdAt: Date

    @UpdateDateColumn()
    updatedAt: Date

    @Column({
        type: Date,
        nullable: true
    })
    confirmAt: Date

    @ManyToOne(()=> Client,
                client=> client.orders, 
                {eager:true}
                )
    client: Client

    @ManyToMany(()=> Product, {eager:true})
    @JoinTable({name: 'order_products'}) //le especifico el nombre del campo de la tabla
    products: Product[]               
}
~~~

## CreateOrderDto

~~~js
import { Type } from "class-transformer";
import { ArrayNotEmpty, IsArray, IsDate, IsNotEmpty, IsOptional, IsUUID } from "class-validator";
import { CreateClientDto } from "src/client/dto/create-client.dto";
import { CreateProductDto } from "src/product/dto/create-product.dto";
import { Product } from "src/product/entities/product.entity";

export class CreateOrderDto {
    @IsUUID()
    @IsOptional()
    id?: string

    @IsOptional()
    @IsDate()
    @Type(()=> Date)
    createAt?: Date

    @IsOptional()
    @IsDate()
    @Type(()=> Date)
    updateAt?: Date

    @IsOptional()
    @IsDate()
    @Type(()=> Date)
    confirmAt?: Date

    @IsNotEmpty()
    @Type(()=>CreateClientDto)
    client!: CreateClientDto

    @IsNotEmpty()
    @IsArray()
    @ArrayNotEmpty()
    @Type(()=>CreateProductDto)
    products!: CreateProductDto[]
}
~~~

- Importo ClientModule y ProductModule en order.module.ts

~~~js
import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { ClientModule } from 'src/client/client.module';
import { ProductModule } from 'src/product/product.module';

@Module({
  imports:[TypeOrmModule.forFeature([Order]),
        ClientModule,
        ProductModule
      ],
  controllers: [OrderController],
  providers: [OrderService],
})
export class OrderModule {}
~~~

- Como lo que me interesa es el servicio es lo que exporto en ambos módulos

~~~js
import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';

@Module({
  imports:[
    TypeOrmModule.forFeature([Product])
  ],
  controllers: [ProductController],
  providers: [ProductService],
  exports:[ProductService]
})
export class ProductModule {}
~~~

- Hago lo mismo en client.module

~~~js
import { Module } from '@nestjs/common';
import { ClientService } from './client.service';
import { ClientController } from './client.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Client } from './entities/client.entity';
import { Address } from './entities/address.entity';

@Module({
  imports:[
    TypeOrmModule.forFeature([Client, Address])
  ],
  controllers: [ClientController],
  providers: [ClientService],
  exports: [ClientService]
})
export class ClientModule {}
~~~

## OrderService

- Inyecto el repositorio de Order y los servicios de Client y Products

~~~js
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { ClientService } from 'src/client/client.service';
import { ProductService } from 'src/product/product.service';

@Injectable()
export class OrderService {

  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private clientService: ClientService,
    private productService: ProductService
  ){}

  async create(order: CreateOrderDto) {
    const client = await this.clientService.findOne(order.client.id) 
    if(!client) throw new NotFoundException("Cliente no encontrado")
    
      for(let p of order.products){
        const product = await this.productService.findOne(p.id)
        if(!product){
          throw new NotFoundException("Producto no encontrado")
        } else if(product.deleted){
          throw new BadRequestException("Producto borrado")
        }
      }

      return this.orderRepository.save(order)
  }

  {...code}
}
~~~

- En el body de la peticion

~~~json
{
  "client": {
    "id": 1
  },
  "products":[
    {
      "id":1
    },
     {
      "id":1
     }
  ]
}
~~~

## Obtener orden por ID

~~~js
async getOrderById(id: string) {
    const order = await this.orderRepository.findOne({
      where: {id}
    })

    if(!order) throw new NotFoundException("No se encontró la orden")

    return order
  }
~~~

## Obtener órdenes pendientes

- En el order.controller

~~~js
@Get('pendig-orders')
getPendingOrders(){
  return this.orderService.getPendingOrders()
}
~~~

- En el order.service

~~~js
async getPendingOrders(){
    return await this.orderRepository.find({
      where:{
        confirmAt: IsNull()
      }
    })
  }
~~~

- Para las no pendientes es similar
- order.controller

~~~js
@Get('confirmed-orders')
getConfirmedgOrders(){
  return this.orderService.getConfirmedOrders()
}
~~~

- En el order.service

~~~js
async getConfirmedOrders(){
  return await this.orderRepository.find({
    where:{
      confirmAt: Not(IsNull())
    }
  })
}
~~~

## Filtrando órdenes confirmadas

- Filtarremos por la fecha de confirmAt
- En el controlador la sacaremos como query parameter 
- En el order.controller.ts

~~~js
@Get('confirmed-orders')
  getConfirmedgOrders(@Query('start') start: Date, @Query('end') end: Date){
    return this.orderService.getConfirmedOrders(start,end)
  }
~~~

- En el order.service

~~~js
async getConfirmedOrders(start: Date, end: Date){
   if(!isNaN(start.getTime()) || !isNaN(end.getTime())){
    const query = this.orderRepository.createQueryBuilder('order')
                  .leftJoinAndSelect("order.client", "client")
                  .leftJoinAndSelect("order.products", "product")
                  .orderBy("order.confirmAt")
    if(!isNaN(start.getTime())){
      query.andWhere({confirmAt: MoreThanOrEqual(start)})
    }

    if(!isNaN(end.getTime())){
      query.andWhere({confirmAt: LessThanOrEqual(end)})
    }
    return await query.getMany()
   }else{
    return await this.orderRepository.find({
      where: {
        confirmAt: Not(IsNull())
      },
      order:{
        confirmAt: 'DESC'
      }
    })
   }
  }
~~~

- Explicación del código:

### 🔍 **Propósito del método:**

Obtener órdenes confirmadas (`confirmAt`) dentro de un rango de fechas (`start` y `end`). Si las fechas no son válidas, devuelve todas las órdenes confirmadas sin filtrar por fecha.


### 🧠 Paso a paso:

```ts
async getConfirmedOrders(start: Date, end: Date) {
```

Este método es `async` y recibe dos fechas (`start` y `end`).


```ts
if (!isNaN(start.getTime()) || !isNaN(end.getTime())) {
```

Valida si al **menos una** de las fechas es válida. *(Esto puede ser problemático, como mencionamos antes: sería mejor usar `&&` para asegurarte de que ambas fechas sean válidas. Pero con `||`, el código se ejecuta incluso si una sola es válida.)*

---

```ts
const query = this.orderRepository.createQueryBuilder('order')
  .leftJoinAndSelect("order.client", "client")
  .leftJoinAndSelect("order.products", "product")
  .orderBy("order.confirmAt")
```

Se crea un query builder para consultar órdenes y:

* Trae también al cliente (`order.client`)
* Trae los productos de la orden (`order.products`)
* Ordena las órdenes por la fecha de confirmación (`confirmAt`)

```ts
if (!isNaN(start.getTime())) {
  query.andWhere({ confirmAt: MoreThanOrEqual(start) })
}
```

Si la fecha `start` es válida, se filtran las órdenes con `confirmAt >= start`.

```ts
if (!isNaN(end.getTime())) {
  query.andWhere({ confirmAt: LessThanOrEqual(end) })
}
```

Si la fecha `end` es válida, se filtran las órdenes con `confirmAt <= end`.


```ts
return await query.getMany()
```

Se ejecuta el query y se devuelven todas las órdenes que cumplan con los filtros.


### 🧵 En el caso contrario:

```ts
}else{
  return await this.orderRepository.find({
    where: {
      confirmAt: Not(IsNull())
    },
    order: {
      confirmAt: 'DESC'
    }
  })
}
```

Si **ninguna** de las fechas es válida (ambas son `NaN`), se devuelve una lista de todas las órdenes que **sí tienen una fecha de confirmación (`confirmAt` no es `null`)**, ordenadas en orden descendente.


### ✅ **Resumen funcional:**

* Si `start` y/o `end` son válidas:

  * Devuelve órdenes confirmadas filtradas por esas fechas.
* Si ninguna es válida:

  * Devuelve todas las órdenes confirmadas, sin filtrar por fecha.
* Siempre incluye cliente y productos relacionados.

## Confirmar órden

- order.controller.ts

~~~js
@Patch('confirm/:id')
  confirmOrder(@Param('id') id: string) {
    return this.orderService.confirmOrder(id);
  }
~~~

- order.service.ts

~~~js
async confirmOrder(id: string) {
    const orderExists = await this.getOrderById(id)

    if(!orderExists) throw new NotFoundException("La órden no existe")

    if(orderExists.confirmAt) throw new ConflictException("La órden ya ha sido confirmada")

    const rows: UpdateResult = await this.orderRepository.update(
      {id},
      {confirmAt: new Date()}
    )

    return rows.affected ==1
  }
~~~

## Obtener órdenes de un cliente

- En el controller

~~~js
@Get('orders-by-client')
getOrdersByClient(@Param('id', ParseIntPipe) clientId: number){
  return this.orderService.getOrdersByClient(clientId)
}
~~~

- En el service

~~~js
getOrdersByClient(clientId: number){
      return this.orderRepository.createQueryBuilder("order")
          .leftJoinAndSelect("order.client", "client")
          .leftJoinAndSelect("order.products", "product")
          .where("client.id = :clientId", {clientId})
          .orderBy("order.confirmAt")
          .getMany()
  }
~~~

- Explicación de este código

Claro, te explico detalladamente qué hace este método en tu servicio:



### 🧠 **Firma del método:**

```ts
getOrdersByClient(clientId: number)
```

Este método recibe un parámetro `clientId` de tipo `number` y devuelve todas las órdenes asociadas a ese cliente.


### 🔍 **Cuerpo del método:**

```ts
return this.orderRepository.createQueryBuilder("order")
```

* Se inicia una consulta usando el QueryBuilder de TypeORM sobre la entidad `order`.
* `"order"` es el alias que se usará para referirse a la tabla de órdenes.



```ts
.leftJoinAndSelect("order.client", "client")
```

* Se hace un **left join** con la tabla `client` relacionada con la orden.
* `AndSelect` significa que también se incluirán los datos del cliente en el resultado.

```ts
.leftJoinAndSelect("order.product", "product")
```

* Similar al anterior, se hace un join con la tabla `product`, que está relacionada con la orden.
* También se incluirán los productos en el resultado.


```ts
.where("client.id = :clientId", { clientId })
```

* Se aplica un filtro donde `client.id` sea igual al valor pasado como `clientId`.
* Se usa un parámetro de consulta (`:clientId`) para evitar inyecciones SQL.

```ts
.orderBy("order.confirmAt")
```

* Ordena los resultados por la fecha de confirmación de la orden (`confirmAt`), en orden ascendente por defecto.

```ts
.getMany()
```

* Ejecuta la consulta y devuelve un arreglo con todas las órdenes que cumplen la condición.

### ✅ **Resumen funcional:**

Este método:

* Busca todas las órdenes cuyo cliente tenga el ID indicado.
* Incluye los datos del cliente y los productos relacionados.
* Ordena las órdenes por fecha de confirmación (ascendente).
* Devuelve el resultado como un arreglo.


------





