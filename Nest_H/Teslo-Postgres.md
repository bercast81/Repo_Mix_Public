# NEST HERRERA - TESLOSHOP

## Docker Postgres

- Creo el docker-compose.yaml

~~~yaml
services:
  db:
    image: postgres:14.3
    restart: always
    ports:
      - "5432:5432"
    environment:
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME}
    container_name: teslodb
    volumes:
      - ./postgres:/var/lib/postgresql/data
~~~

- El README.md

~~~md
# Teslo API

1. Configurar variables de entorno

~~~
DB_NAME=
DB_PASSWORD=
~~~

2. Levantar la db

> docker-compose up -d
~~~

## Conectar Postgres con Nest

- Instalo

> npm i @nestjs/typeorm typeorm pg

- Instalo 

> npm i @nestjs/config

- Configuro las variables de entorno con **ConfigModule.forRoot** en app.module

~~~js
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: +process.env.DB_PORT!,
      database: process.env.DB_NAME,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      autoLoadEntities: true,
      synchronize: true
    })

  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
~~~

- El .env queda así

~~~
DB_NAME=TesloDB
DB_PASSWORD=123456
DB_HOST=localhost
DB_USERNAME=postgres
DB_PORT=5432
~~~

## TypeORM Entity Product


- Creo la API de Products

> nest g res products --no-spec

- Primero crearemos la entidad sin relaciones
 
~~~js
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Product {
    
    @PrimaryGeneratedColumn('uuid')
    id: string
    
    @Column({
        type: 'text',
        unique: true
    })
    title: string

    @Column({
        type: 'float',
        default: 0
    })
    price: number

    @Column({
        type: 'text',
        nullable: true
    })
    description: string

    @Column({
        type: 'text',
        unique: true
    })
    slug: string

    @Column({
        type: 'int',
        default: 0
    })
    stock: number

    @Column({
        type: 'text',
        array: true
    })
    sizes: string[]

    @Column({
        type: 'text'
    })
    gender: string
}
~~~

- La añado al products.module

~~~js
import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';

@Module({
  imports:[
    TypeOrmModule.forFeature([Product])
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}
~~~

## setGlobalPrefix

- En el main

~~~js
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1')

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
~~~

## create-product.dto

- Instalo

> npm i class-validator class-transformer

- Añado el **useGlobalPipes** en el main

~~~js
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1')

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions:{
        enableImplicitConversion: true
      }
    })
  )

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
~~~

- En el create-product.dto

~~~js
import { IsArray, IsIn, IsNumber, IsOptional, IsString, MinLength } from "class-validator"

export class CreateProductDto {
    @IsString()
    @MinLength(1)
    title: string

    @IsNumber()
    @IsOptional()
    price?: number

    @IsString()
    @IsOptional()
    description?: string

    @IsString()
    @IsOptional()
    slug?: string

    @IsString()
    @IsOptional()
    stock?: number

    @IsString({each: true})
    @IsArray()
    sizes: string[]

    @IsIn(['men', 'women', 'kid', 'unisex'])
    gender: string
}
~~~

## Insertar usando TYpeORM

- Hago uso de **@InjectRepository**

~~~js
import { Injectable } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ProductsService {


  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>
  ){}

{...code}
}
~~~

- Hago la inserción dentro de un try catch
- products.service.ts

~~~js
async create(createProductDto: CreateProductDto) {
    try {
      const product = this.productRepository.create(createProductDto)
      await this.productRepository.save(product)
      return product
    } catch (error) {
      console.log(error)
      throw new InternalServerErrorException('No se ha podido crear el producto. Consultar logs')   
    }
  }
~~~

- En POSTMAN creo un objeto como este

~~~json
"title": "Migue's trousers",
"sizes": ["SM", "M", "L"],
"gender": "men",
"slug": "migues_trousers"
"price": 199.99
~~~

- Me devuelve

~~~json
{
  "id": "9e077035-8bcf-4556-9e48-383b60bc2bbb",
  "title": "Migue's trousers",
  "price": 199.99,
  "description": null,
  "slug": "migues_trousers",
  "stock": 0,
  "sizes": [
    "SM",
    "M",
    "L"
  ],
  "gender": "men"
}
~~~

## Manejo de errores (Logger)

- Usaré **el logger de @nestjs/common**
- products.service.ts

~~~js
@Injectable()
export class ProductsService {

  private readonly logger = new Logger('ProductsService')

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>
  ){}


  async create(createProductDto: CreateProductDto) {
    try {
      const product = this.productRepository.create(createProductDto)
      await this.productRepository.save(product)
      return product
    } catch (error) {
      
      this.logger.error(error) //Lo uso aquí
      throw new InternalServerErrorException('No se ha podido crear el producto. Consultar logs')   
    }
  }
}
~~~

- Si intento insertar con el mismo nombre obtengo un error 23505
- Puedo ser más específico en el catch
- products.service
~~~js
async create(createProductDto: CreateProductDto) {
    try {
      const product = this.productRepository.create(createProductDto)
      await this.productRepository.save(product)
      return product
    } catch (error) {
      if(error.code === '23505'){
        throw new BadRequestException(error.detail)
      }
      this.logger.error(error)
      throw new InternalServerErrorException('Unexpected error. Check server logs')   
    }
  }
~~~

## BeforeInsert y BeforeUpdate

- Si no mando el slug **me da error** porque es requerido ya que en la entity **no tiene el nullable** pero en el dto está como **opcional**
- Lo genero yo basado en el título
- products.service

~~~js


  async create(createProductDto: CreateProductDto) {
    try {

      if(!createProductDto.slug){
        createProductDto.slug = createProductDto.title.toLowerCase().replaceAll(' ','_').replaceAll("'", "")
      }else{
        createProductDto.slug = createProductDto.slug.toLowerCase().replaceAll(' ','_').replaceAll("'", "")
      }

      const product = this.productRepository.create(createProductDto)
      await this.productRepository.save(product)
      return product
      
    } catch (error) {
      if(error.code === '23505'){
        throw new BadRequestException(error.detail)
      }
      this.logger.error(error)
      throw new InternalServerErrorException('Unexpected error. Check server logs')   
    }
  }
~~~

- Puedo usar **@BeforeInsert** para hacer este procedimiento antes de la inserción en la entidad
- products.entity.ts

~~~js
import { BeforeInsert, Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Product {
    
    @PrimaryGeneratedColumn('uuid')
    id: string
    
    @Column({
        type: 'text',
        unique: true
    })
    title: string

    @Column({
        type: 'float',
        default: 0
    })
    price: number

    @Column({
        type: 'text',
        nullable: true
    })
    description: string

    @Column({
        type: 'text',
        unique: true
    })
    slug: string

    @Column({
        type: 'int',
        default: 0
    })
    stock: number

    @Column({
        type: 'text',
        array: true
    })
    sizes: string[]

    @Column({
        type: 'text'
    })
    gender: string
    
    @BeforeInsert()
    checkSlugInsert(){
        if(!this.slug){
            this.slug = this.title //si no viene el slug guardo el titulo en slug
        }

        this.slug = this.slug
        .toLowerCase()
        .replaceAll(" ", "_")
        .replaceAll("'", "")
    }
}
~~~

## Get y Delete 

- Uso **ParseUUIDPipe** en el controller en los métodos findOne y remove

~~~js
import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Get()
  findAll() {
    return this.productsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(+id, updateProductDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.remove(id);
  }
}
~~~

- Creo un método privado para los errores, lo uso en el catch de create
- products.service

~~~js
import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ProductsService {

  private readonly logger = new Logger('ProductsService')

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>
  ){}


  async create(createProductDto: CreateProductDto) {
    try {

      if(!createProductDto.slug){
        createProductDto.slug = createProductDto.title.toLowerCase().replaceAll(' ','_').replaceAll("'", "")
      }else{
        createProductDto.slug = createProductDto.slug.toLowerCase().replaceAll(' ','_').replaceAll("'", "")
      }

      const product = this.productRepository.create(createProductDto)
      await this.productRepository.save(product)
      return product

    } catch (error) {
       this.handleDBExceptions(error)
    }
  }

  findAll() {
    return `This action returns all products`;
  }

  async findOne(id: string) {
    const product = await this.productRepository.findOneBy({id})
    if(!product) throw new NotFoundException('Product not found')
    
    return product
  }

  update(id: number, updateProductDto: UpdateProductDto) {
    return `This action updates a #${id} product`;
  }

  async remove(id: string) {
    const product = await this.findOne(id)

    await this.productRepository.delete(id)
    
  }
  //creo un método para los errores
  private handleDBExceptions(error:any){
    if(error.code === '23505'){
        throw new BadRequestException(error.detail)
      }
      this.logger.error(error)
      throw new InternalServerErrorException('Unexpected error. Check server logs')  
  }
}
~~~

## Paginación en TypeORM

- Creo el módulo common
- Dentro el pagination.dto.ts

~~~js
import { Type } from "class-transformer"
import { IsOptional, IsPositive, Min } from "class-validator"

export class PaginationDto{

    @IsOptional()
    @IsPositive() //con IsPositive no hace falta el IsNumber
    @Type(()=> Number)
    limit?: number
    
    @IsOptional()
    @Min(0)
    @Type(()=> Number)
    offset?: number
}
~~~

- Hago uso del dto en el controller

~~~js
@Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.productsService.findAll();
  }
~~~

- Hago la paginación en el servicio

~~~js
async findAll(paginationDto: PaginationDto) {
    const {limit=10, offset=0} = paginationDto
    const products = await this.productRepository.find({
      take: limit,
      skip: offset
    })
  }
~~~

## Buscar por slug, título o UUID

- Instalo uuid y los types @types/uuid
- Importo validate de uuid y lo renombro a isUUID en products.service

~~~js
import { validate as isUUID } from 'uuid';
~~~

- Cambio id por term que es más adecuado
- products.service.ts

~~~js
async findOne(term: string) {

  let product: Product | null = null;

  if(isUUID(term)){
    product = await this.productRepository.findOneBy({id: term})
  }else{
    product = await this.productRepository.findOneBy({slug: term})
  }
  
  if(!product) throw new NotFoundException('Product not found')
  return product
}
~~~

## QueryBuilder

- Quito el ParseUUIDPipe del controller
- Los : significa que son **parámetros**
- Solo me interesa uno de los dos, por eso uso **getOne**
- QueryBuilder es case sensitive, para evitarlo puedo usar UPPER y luego pasar todo a mayúsculas

~~~js
async findOne(term: string) {

  let product: Product | null = null;

  if(isUUID(term)){
    product = await this.productRepository.findOneBy({id: term})
  }else{
    const queryBuilder = this.productRepository.createQueryBuilder('product')

    product = await queryBuilder.where(`UPPER(product.title) = :title or product.slug = :slug`, {
      title: term.toUpperCase(),
      slug: term.toLowerCase()
    }).getOne()
  }
  
  if(!product) throw new NotFoundException('Product not found')
  return product
}

{...code}
~~~

## Update

- Cuando solo hay una tabla implicada el update es sencillo
- products.controller.ts

~~~js
@Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(id, updateProductDto);
  }
~~~

- products.service.ts

~~~js
async update(id: string, updateProductDto: UpdateProductDto) {
    if(isUUID(id)){
      const product = await this.productRepository.preload({
        id,
        ...updateProductDto
      })
      if(!product) throw new NotFoundException('Product not found')
      try {
        await this.productRepository.save(product)
        return product
        
      } catch (error) {
        this.handleDBExceptions(error)
      }  
    }
  }
~~~

- Si le paso un título que ya existe me va a devolver un InternalServerError
- Los slugs los tengo que validar, deben cumplir las condiciones que establecí
- Para ello usaré **@BeforeUpdate**
- product.entity.ts

~~~js
@BeforeUpdate()
    checkSlugUpdate(){
        this.slug= this.slug
        .toLowerCase()
        .replaceAll(" ", "_")
        .replaceAll(" ", "")
    }
~~~

## Tags

- Puedo usar tags para mejorar las búsquedas
- Como tengo el synchronize en true puedo añadirlo directamente en la entity
- product.entity.ts

~~~js
@Column({
  type: 'text',
  array: true,
  default: []
  })
  tags: string[]
~~~

- En el dto lo pongo como opcional (como por defecto le pongo un arreglo vacío puedo)

~~~js
@IsString({each: true})
@IsOptional()
@IsArray()
tags?: string[]
~~~

## Relaciones TypeORM

- Creo product-image.entity

~~~js
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class ProductImage{
    @PrimaryGeneratedColumn()
    id: number

    @Column('text')
    url: string
}
~~~

- Indico que existe esta entidad en products.module

~~~js
import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { ProductImage } from './entities/product-image.entity';

@Module({
  imports:[
    TypeOrmModule.forFeature([Product, ProductImage])
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}
~~~

## OneToMany y ManyToOne

- Un producto puede tener varias imágenes, por eso OneToMany
- product.entity.ts

~~~js
@OneToMany(
  ()=> ProductImage,
  productImage=> productImage.product, //todavía no he creado el campo product
  {cascade: true} //si hago una eliminación, elimina las imágenes asociadas al producto
    )
  images?: ProductImage[]
~~~

- Muchas imágenes pueden tener un único producto, por eso es ManyToOne
- product-image.entity.ts

~~~js
@ManyToOne(
    ()=>Product,
    product=> product.images
)
product: Product
~~~

- Salta un error: Types of property images are incompatible, Type 'string[] is not assignable to type 'DeepPartialProductImage'
- Por ello añado en el create y el update un arreglo vacío de imágenes
- Para crear las imágenes voy a necesitar inyectar el repositorio. Hago un .map que devuelve un arreglo
- products.service.ts

~~~js
@Injectable()
export class ProductsService {

  private readonly logger = new Logger('ProductsService')

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductImage)
    private readonly productImageRepository: Repository<ProductImage>
  ){}


  async create(createProductDto: CreateProductDto) {
    try {
      const {images=[], ...productDetails}= createProductDto
      const product = this.productRepository.create({
        ...productDetails,
        images: images.map(image=> this.productImageRepository.create({url:image}))
      })

      await this.productRepository.save(product)
      return product

    } catch (error) {
       this.handleDBExceptions(error)
    }
  }

 async update(id: string, updateProductDto: UpdateProductDto) {
    if(isUUID(id)){
      const product = await this.productRepository.preload({
        id,
        ...updateProductDto,
        images: []
      })
      if(!product) throw new NotFoundException('Product not found')
      try {
        await this.productRepository.save(product)
        return product
        
      } catch (error) {
        this.handleDBExceptions(error)
      }  
    }
  }


}

~~~

- Añado images al dto!
- create-product.dto.ts

~~~js
@IsOptional()
@IsString({each: true})
@IsArray()
images?: string[]
~~~

- Hago un POST con las imagenes con este body (borro los registros anteriores)

~~~json
{
"title": "Migue's trousers",
"sizes": ["SM", "M", "L"],
"gender": "men",
"slug": "migues_trousers",
"price": 199.99,
"images": [
  "http://image1.jpg",
  "http://image2.jpg"
  ]
}
~~~

- Esto inserta las imagenes con el id de producto en la tabla product_image
- en la tabla products no vemos las imágenes, porque están relacionadas con la tabla product_image

## Aplanar las imágenes

- Para que me muestre las imágenes en el método findAll establezco la relación con **relations**
- products.service.ts

~~~js
async findAll(paginationDto: PaginationDto) {
    const {limit=10, offset=0} = paginationDto
    const products = await this.productRepository.find({
      take: limit,
      skip: offset,
      relations:{
        images: true
      }
    })

    return products.map(({images, ...rest})=>({
      ...rest,
      images: images.map(img=>img.url)
    }))
  }
~~~

- Debo poner el **eager** en true para que funcione relations
- Cuando se usa el QueryBuilder, eager no está disponible, se usa **leftJoinAndSelect**
- product.entity.ts

~~~js
@OneToMany(
    ()=> ProductImage,
    productImage=> productImage.product,
    {cascade: true, eager: true}
)
images: ProductImage[]
~~~

- Ahora si busco por id con el find me aparecen las imágenes pero por slug no porque uso un QueryBuilder
- Uso leftJoinAndSelect, le pongo el alias prodImages

~~~js
async findOne(term: string) {

  let product: Product | null = null;

  if(isUUID(term)){
    product = await this.productRepository.findOneBy({id: term})
  }else{
    const queryBuilder = this.productRepository.createQueryBuilder('product')

    product = await queryBuilder.where(`UPPER(product.title) = :title or product.slug = :slug`, {
      title: term.toUpperCase(),
      slug: term.toLowerCase()
    })
    .leftJoinAndSelect('product.images', 'prodImages')
    .getOne()
  }
}
~~~

- No lo voy a manejar así porque me interesa devolver una instancia de mi entidad y no algo que luzca como tal
- Creo un método para aplanarlo

~~~js
async findOnePlane(term:string){
    const {images=[], ...product} = await this.findOne(term)
    return{
      ...product,
      images: images.map(img=> img.url)
    }
  }
~~~

## QueryRunner

- Si actualizo un producto y no le paso las imágenes aparece el arreglo vacío y pierdo la referencia
- Esto sucede por el cascade en true
- También porque al hacer el update indico que es un arreglo vacío
- Borro todas las imágenes de la db
- Quiero que las imágenes que añado en el body sean las nuevas imágenes
- Entonces son dos cosas: borrar las anteriores e insertar las nuevas
- Si una de las dos falla quiero revertir el proceso. Para ello usaré QueryRunner
- El QueryRunner tiene que conocer la cadena de conexión que estoy usando
- Para ello usaré inyección de dependencies con el DataSource (de TypeORM)
- products.service.ts

~~~js
 async update(id: string, updateProductDto: UpdateProductDto) {
    const {images, ...toUpdate} = updateProductDto

    const product = await this.productRepository.preload({id, ...toUpdate})

    if(!product) throw new NotFoundException(`Product with id ${id} not found`)

      const queryRunner = this.dataSource.createQueryRunner()
      await queryRunner.connect()
      await queryRunner.startTransaction()

      try {
        if(images){
          await queryRunner.manager.delete(ProductImage, {product: {id}})
          product.images = images?.map(image=>this.productImageRepository.create({url: image}))
        }

        await queryRunner.manager.save(product)
        await queryRunner.commitTransaction()
        await queryRunner.release()

        return this.findOnePlane(id)
          
      } catch (error) {
        await queryRunner.rollbackTransaction()
        await queryRunner.release()

        this.handleDBExceptions(error)
      }

  }
~~~

## Eliminación en cascada

- Si quiero borrar un producto que tiene una imagen me da error
- Dice que borrar de la tabla producto viola la foreign key de la tabla product_image
- Se puede resolver de varias formas: una es crear una transacción donde borrar primero las imágenes y luego el producto
- También puedo decirle que al borrar un producto se borren las imágenes relacionadas (eliminación en cascada)
- product-image.entity.ts

~~~js
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Product } from "./product.entity";

@Entity()
export class ProductImage{
    @PrimaryGeneratedColumn()
    id: number

    @Column('text')
    url: string

    @ManyToOne(
        ()=>Product,
        product=> product.images,
        {onDelete: 'CASCADE'}
    )
    product: Product
}
~~~

- Creo un método en el servicio para borrar todos los productos
- products.service.ts

~~~js
async deleteAllProducts(){
  const query = this.productRepository.createQueryBuilder('product')

  try{
    return await query
      .delete()
      .where({})
      .execute()

  } catch(error){
    this.handleDBExceptions(error)
  }
}
~~~

## Product Seed

- Copio el gist de Herrera

> https://gist.github.com/Klerith/1fb1b9f758bb0c5b2253dfc94f09e1b6

- Tengo estas interfaces

~~~js
interface SeedProduct {
    description: string;
    images: string[];
    stock: number;
    price: number;
    sizes: ValidSizes[];
    slug: string;
    tags: string[];
    title: string;
    type: ValidTypes;
    gender: 'men'|'women'|'kid'|'unisex'
}

type ValidSizes = 'XS'|'S'|'M'|'L'|'XL'|'XXL'|'XXXL';
type ValidTypes = 'shirts'|'pants'|'hoodies'|'hats';


interface SeedData {
    products: SeedProduct[];
}
~~~

- La data luce como un arreglo con objetos como este

~~~js
  {
    description: "Introducing the Tesla Chill Collection. The Men’s Chill Crew Neck Sweatshirt has a premium, heavyweight exterior and soft fleece interior for comfort in any season. The sweatshirt features a subtle thermoplastic polyurethane T logo on the chest and a Tesla wordmark below the back collar. Made from 60% cotton and 40% recycled polyester.",
    images: [
        '1740176-00-A_0_2000.jpg',
        '1740176-00-A_1.jpg',
    ],
    stock: 7,
    price: 75,
    sizes: ['XS','S','M','L','XL','XXL'],
    slug: "mens_chill_crew_neck_sweatshirt",
    type: 'shirts',
    tags: ['sweatshirt'],
    title: "Men’s Chill Crew Neck Sweatshirt",
    gender: 'men'
   },
~~~

- Genero el módulo de SEED

> nest g res seed

- Borro dtos, entitys, dejo solo el GET en el controller

~~~js
import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { SeedService } from './seed.service';

@Controller('seed')
export class SeedController {
  constructor(private readonly seedService: SeedService) {}


  @Get()
  executeSeed(){
    return this.seedService.runSeed();
  }

}
~~~

- En el servicio

~~~js
import { Injectable } from '@nestjs/common';

@Injectable()
export class SeedService {

  runSeed(){

    return 'SEED EXECUTED'
  }
}
~~~

- Necesito acceder al servicio para usar el método para borrar todos los productos
- Lo exporto del ProductsModule

~~~js
import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { ProductImage } from './entities/product-image.entity';
import { TypeORMError } from 'typeorm';

@Module({
  imports:[
    TypeOrmModule.forFeature([Product, ProductImage])
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService, TypeOrmModule]
})
export class ProductsModule {}
~~~

- Importo el ProductsModule

~~~js
import { Module } from '@nestjs/common';
import { SeedService } from './seed.service';
import { SeedController } from './seed.controller';
import { ProductsModule } from 'src/products/products.module';

@Module({
  controllers: [SeedController],
  providers: [SeedService],
  imports: [ProductsModule]
})
export class SeedModule {}
~~~

- Lo inyecto en el servicio

~~~js
import { Injectable } from '@nestjs/common';
import { ProductsService } from 'src/products/products.service';
import { initialData } from './data/data';

@Injectable()
export class SeedService {

  constructor(
    private readonly productsService: ProductsService
  ){}

  async runSeed(){
    
    this.insertNewProducts()

    const products = initialData.products

  const insertPromises = products.map(product => this.productsService.create(product));

    await Promise.all(insertPromises)
    return 'SEED EXECUTED'
  }

  private async insertNewProducts(){
    await this.productsService.deleteAllProducts()
  }
}
~~~

- Creo el README.md

~~~md
# Teslo API


1. Clonar proyecto

> npm i 

2. Configurar variables de entorno

~~~env
DB_NAME=TesloDB
DB_PASSWORD=123456
DB_HOST=localhost
DB_USERNAME=postgres
DB_PORT=5432
~~~

3. Levantar la db

> docker-compose up -d

4. Ejecutar SEED

~~~
localhost:3000/api/seed
~~~

5. Levantar con **npm run start:dev**
~~~
~~~

## Renombrar tablas

- Las tablas deberían llamarse products y product_images y no product y product_image
- Puedo usar el decorado **@Entity para renombrarlas**
- product.entity.ts

~~~js
@Entity({name: 'products'})
export class Product {
    
    @PrimaryGeneratedColumn('uuid')
    id: string

{...code}
}
~~~

- product-images.entity.ts

~~~js
@Entity({name: 'product_images'})
export class ProductImage{
    @PrimaryGeneratedColumn()
    id: number

{...code}
}
~~~
-----

## Carga de archivos

- A través de un POST con el UUID de la imagen en la url voy a mostrar la fotografía
- Instalo

> npm i @types/multer

- Creo el módulo file

> nest g res file --no-spec

- Solo un endpoint POST, sin dtos ni entities

~~~js
import { Controller, Post } from '@nestjs/common';
import { FileService } from './file.service';


@Controller('files')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Post('product')
  uploadProductFile(file: Express.Multer.File) {
    return this.fileService.create(file);
  }
}
~~~

- En POSTMAN, en Body, de tipo form-data, de key le pongo file y al lado puedes elegir el file a subir
- Para poder ver el archivo necesito el decorador **@UploadFile**
- Necesito saber el nombre de la llave para usar el **interceptor**
- Los interceptores interceptan las solicitudes y también pueden interceptar y mutar las respuestas
- Dentro de @UseInterceptors uso FileInterceptor de @nestjs/plattform-express
- Debo indicarle el nombre de la key que haya puesto

~~~js
import { Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileService } from './file.service';
import { FileInterceptor } from '@nestjs/platform-express';


@Controller('files')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Post('product')
  @UseInterceptors(FileInterceptor('file'))
  uploadProductFile(@UploadedFile() file: Express.Multer.File) {
    return this.fileService.create(file);
  }
}
~~~

- Por defecto Nest sube el archivo a una carpeta temporal
- No se recomienda guardar el archivo en el filesystem
- Se recomienda un servicio de terceros como **Cloudinary**

## Validar archivos

- Usaré un filter, creo la carpeta file/**helpers**/fileFilter.helper.ts
- Para poder usarlo en el FileInterceptor debe cumplir unos requisitos: req, file y callback

~~~js
export const fileFilter = (req: Express.Request, file: Express.Multer.File, callback: Function)=>{
    if(!file) return callback(new Error('File is empty'), false)

    const fileExtension = file.mimetype.split('/')[1]
    const validExtensions= ['jpg','jpeg', 'png', 'gif']

    if(validExtensions.includes(fileExtension)){
        return callback(null, true)
    }

    callback(null, false)

}
~~~

- En el controller

~~~js
import { BadRequestException, Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileService } from './file.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { fileFilter } from './helpers/fileFilter.helper';
import { diskStorage } from 'multer';


@Controller('files')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Post('product')
  @UseInterceptors(FileInterceptor('file', {
    fileFilter: fileFilter,
    limits: {fileSize: 100000},
    storage: diskStorage({
      destination: 'static/products'
    })
  }))
  uploadProductFile(@UploadedFile() file: Express.Multer.File) {
   if(!file) throw new BadRequestException('Make sure that the file is an image')

    return{
      fileName: file.originalname
    }
  }
}
~~~

- Esto devuelve

~~~json
{
    "fileName": "FLA2.jpeg"
}
~~~

- Ahora tengo en la raíz la carpeta .static/products y un archivo con nombre como adbb966fd108dfa519eb4d2d0da2d024

## Renombrar el archivo subido

- Copio fileFilter y lo renombro a fileNamer
- Instalo uuid

> npm i uuid @types/uuid

- fileNamer.helper.ts

~~~js
import {v4 as uuid} from 'uuid'

export const fileNamer = (req: Express.Request, file: Express.Multer.File, callback: Function)=>{
    if(!file) return callback(new Error('File is empty'), false)

    const fileExtension = file.mimetype.split('/')[1]
    const fileName =  `${uuid()}.${fileExtension}`   

    callback(null, fileName)

}
~~~

- Lo uso en el controller

~~~js
@Controller('files')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Post('product')
  @UseInterceptors(FileInterceptor('file', {
    fileFilter: fileFilter,
    limits: {fileSize: 100000000},
    storage: diskStorage({
      destination: 'static/products',
      filename: fileNamer
    })
  }))
  uploadProductFile(@UploadedFile() file: Express.Multer.File) {
   if(!file) throw new BadRequestException('Make sure that the file is an image')

    return{
      fileName: file.originalname
    }
  }
}
~~~

## Subir archivos de manera controlada

- No puedo usar el filename para servir el archivo porque no lo sé. Solo estoy grabando el archivo en el filesystem
- Creo la constante secureURL, inyecto el ConfigService
- HOST_API=http://localhost:3000/api/v1
- file.controller.ts

~~~js
import { BadRequestException, Controller, Get, Param, Post, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileService } from './file.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { fileFilter } from './helpers/fileFilter.helper';
import { diskStorage } from 'multer';
import { fileNamer } from './helpers/fileNamer.helper';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';


@Controller('files')
export class FileController {
  constructor(private readonly fileService: FileService,
    private readonly configService: ConfigService
  ) {}

  @Post('product')
  @UseInterceptors(FileInterceptor('file', {
    fileFilter: fileFilter,
    limits: {fileSize: 100000000},
    storage: diskStorage({
      destination: 'static/products',
      filename: fileNamer
    })
  }))
  uploadProductFile(@UploadedFile() file: Express.Multer.File) {
   if(!file) throw new BadRequestException('Make sure that the file is an image')

    const secureURL= `${this.configService.get('HOST_API')}/files/product/${file.filename}`
    return{
      secureURL
    }
  }
}
~~~

- Debo importar el módulo ConfigModule

~~~js
import { Module } from '@nestjs/common';
import { FileService } from './file.service';
import { FileController } from './file.controller';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports:[ConfigModule],
  controllers: [FileController],
  providers: [FileService],
})
export class FileModule {}
~~~

- Creo un método GET en el file.controller
- Hay que ir con cuidado con usar Res porque se salta ciertos interceptores y restricciones

~~~js
@Get(':imageName')
  findProductImage(@Res() res: Response, @Param('imageName') imageName: string){
    const path = this.fileService.getStaticProductImage(imageName)
    res.sendFile(path)
  }
~~~

- En el file.service

~~~js
import { BadRequestException, Injectable } from '@nestjs/common';
import { existsSync } from 'fs';
import { join } from 'path';


@Injectable()
export class FileService {

    getStaticProductImage(imageName: string){
        const path = join(__dirname, '../../static/products', imageName)
        if(!existsSync) throw new BadRequestException(`No product found with image ${imageName}`)
        
        return path
    }   
}
~~~

- Ahora si hago un post a http://localhost:3000/api/v1/files/product subiendo una imagen me retorna la sevureURL
- La secureURL es algo asi: 

~~~json
{
    "secureURL": "http://localhost:3000/api/v1/files/product/3903855a-7b65-4be9-89df-b771db388230.jpeg"
}
~~~

- Si apunto con un GET a esta URL me devuelve la imagen

## Otras formas de servir archivos

- Usando ServeStaticModule en app.module

~~~js
ServeStaticModule.forRoot([
  rootPath: join(__dirname, '..', 'public')
])
~~~

- Conviene crear un index.html en la carpeta public
- En el endpoint localhost:3000/assets/nombre_del_archivo puedo acceder a las imágenes
- De esta manera no puedo controlar quien accede a las imágenes
- Son recursos públicos, estáticos, que no van a cambiar
- **Copio los archivos descargados en la carpeta static/products**
-------

# Autenticación

- Crearemos decoradores personalizados
- Las rutas GET serán publicas, el resto requerirán autenticación
- Haremos modificaciones en el SEED para crear usuarios automáticamente

## Entidad de usuarios

- Creo el módulo de auth con **nest g res --no-spec**
- users.entity.ts

~~~js
import { IsEmail, IsString } from "class-validator";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class User {

    @PrimaryGeneratedColumn('uuid')
    id: string


    @Column({
        type: 'text'
    })
    fullName: string

    @Column('text',{
    select: false //para que no me lo devuelva en la peticion
    })
    password: string

    @Column({
        type: 'text',
        unique: true
    })
    email: string

    @Column({
        type: 'bool',
        default: true
    })
    isActive: boolean

    @Column({
        type: 'text',
        array: true,
        default: ['user']
    })
    roles: string[]
}
~~~

- Declaro la entity en AuthModule con **TypeOrmModule.forFeature([])**

~~~js
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeORMError } from 'typeorm';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [TypeOrmModule]
})
export class AuthModule {}
~~~

## Crear Usuario

- Para crear usuario usaré el endpoint register

> http://localhost:3000/api/v1/auth/register

- auth.controller.ts

~~~js
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  create(@Body() createUserDto: CreateUserDto) {
    return this.authService.create(createUserDto);
  }
  {...code}
}
~~~

- CreateUserDto

~~~js
import { IsEmail, IsString, Matches, MaxLength, MinLength } from "class-validator"

export class CreateUserDto {

    @IsEmail()
    email: string

    @IsString()
    @MinLength(6)
    @MaxLength(50)
    @Matches(
        /(?:(?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
            message: 'The password must have a uppercase. lowercase letter and a number'
        }
    )
    password: string

    @IsString()
    @MinLength(1)
    fullName: string

}
~~~

- Para encriptar la contraseña uso

> npm i bcrypt @types/bcrypt

- Para que no retorne el password lo seteo a null
- auth.service.ts

~~~js
import * as bcrypt from 'bcrypt'

@Injectable()
export class AuthService {

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
  ){}

  async create(createUserDto: CreateUserDto) {

    try {
      const {password, ...userData} = createUserDto
    
    const user = this.userRepository.create({
      ...userData,
      password: bcrypt.hashSync(password, 12)
    })
    
    await this.userRepository.save(user)

     return {
      ...user,
      password: null
    }

    } catch (error) {
      this.handleDbError(error)  
    }
  }

    handleDbError(error: any): void{
    if(error.code === '23505'){
      throw new BadRequestException(error.detail)
    }

    console.log(error)
    throw new InternalServerErrorException('Check logs')
  }
}
~~~


## Login

- Creo el dto login-user.dto

~~~js
import { IsEmail, IsString, Matches, MaxLength, MinLength } from "class-validator"

export class LoginUserDto{

    @IsEmail()
    email: string

    @IsString()
    @MinLength(6)
    @MaxLength(50)
    @Matches(
        /(?:(?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
            message: 'The password must have a uppercase. lowercase letter and a number'
        }
    )
    password: string

}
~~~

- El endpoint en el controller
- auth.controller.ts

~~~js
@Post('login')
loginUser(@Body() loginUserDto: LoginUserDto){
  return this.authService.loginUser(loginUserDto)
}
~~~

- En el findOneBy({email}) no me devuelve el password porque le puse el **select: false en la entidad**
- Pero lo necesito para validar el password del login, uso el **where** con **findOne**
- auth.service.ts

~~~js
import { BadRequestException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt'
import { LoginUserDto } from './dto/login-user.dto';

@Injectable()
export class AuthService {

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
  ){}

  async create(createUserDto: CreateUserDto) {

    try {
      const {password, ...userData} = createUserDto
    
    const user = this.userRepository.create({
      ...userData,
      password: bcrypt.hashSync(password, 12)
    })
    
    await this.userRepository.save(user)

    return {
      ...user,
      password: null //elimino el password en el retorno
    }
      
    
    } catch (error) {
      this.handleDbError(error)  
    }
  }

  async loginUser(loginUserDto: LoginUserDto){
        const {email, password} = loginUserDto

        const user = await this.userRepository.findOne({
          where: {email},
          select: {email: true, password: true}
        })

        if(!user){
          throw new UnauthorizedException('Credentials are invalid')
        }

        if(!bcrypt.compareSync(password, user.password)){
          throw new UnauthorizedException('Password is not valid')
        }

        return {
          ...user,
          password: null
        }
  }

  {...code}
}
~~~

## Passport

- Instalo

> npm i @nestjs/passport passport @nestjs/jwt passport-jwt
> npm i -D @types/passport-jwt

- Uso **PassportModule** en **AuthModule**

~~~js
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeORMError } from 'typeorm';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    PassportModule.register({defaultStrategy: 'jwt'}),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions:{
        expiresIn: '2h'
      }
    })
],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [TypeOrmModule]
})
export class AuthModule {}
~~~

- Sería mejor usar el módulo asíncrono para asegurarnos de que la variable de entorno esté cargada
- Para ello haré uso de **useFactory**
- auth.module.ts

~~~js
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeORMError } from 'typeorm';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    PassportModule.register({defaultStrategy: 'jwt'}),
    JwtModule.registerAsync({
    imports:[ConfigModule],
    inject: [ConfigService],
    useFactory: (configService: ConfigService)=>{
      return{
          secret: process.env.JWT_SECRET,
          signOptions:{
          expiresIn: '2h'
      }
    }
    } 
  })
],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [TypeOrmModule]
})
export class AuthModule {}
~~~

## JWTStrategy

- Es recomendable guardar en el jwt algún campo indexado, añadir también en que momento fue creado y fecha de expiración
- Solo guardaré el correo en el jwt
- Todas las estrategias son providers, le coloco el decorador @Injectable y lo indico en el auth.module.ts
- Me pide el método validate que ejecutará automáticamente al definir jwt como strategy
- jwt.strategy.ts

~~~js
import { PassportStrategy } from "@nestjs/passport";
import { InjectRepository } from "@nestjs/typeorm";
import { ExtractJwt, Strategy } from "passport-jwt";
import { Repository } from "typeorm";
import { User } from "../entities/user.entity";
import { ConfigService } from "@nestjs/config";
import { JwtPayloadInterface } from "../interfaces/jwt-payload.interface";
import { Injectable, UnauthorizedException } from "@nestjs/common";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy){

    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly configService: ConfigService
    ){
        
    super({
        secretOrKey: configService.get('JWT_SECRET')!,
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken()
    })
    }

    async validate(payload: JwtPayloadInterface): Promise<User>{
        const {email} = payload

        const user = await this.userRepository.findOneBy({email})

        if(!user) throw new UnauthorizedException('Token not valid')
        if(!user.isActive) throw new UnauthorizedException('User is not active')

        return user
    }
} 
~~~

- auth.module

~~~js
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeORMError } from 'typeorm';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([User]),
    PassportModule.register({defaultStrategy: 'jwt'}),
    JwtModule.registerAsync({
    imports:[ConfigModule],
    inject: [ConfigService],
    useFactory: (configService: ConfigService)=>{
      return{
          secret: process.env.JWT_SECRET,
          signOptions:{
          expiresIn: '2h'
      }
    }
    } 
  })
],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [TypeOrmModule, JwtStrategy, PassportModule, JwtModule] //exporto!
})
export class AuthModule {}
~~~

- La interfaz, luego cambiaremos el email por el id

~~~js
export interface JwtPayloadInterface{
    email: string
}
~~~

## Generar Jwt

- Para generar el token necesito del **servicio de jwt de Nest del JwtModule**
- Uso .sign para crear el token
- auth.service.ts

~~~js
import { BadRequestException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt'
import { LoginUserDto } from './dto/login-user.dto';
import { JwtService } from '@nestjs/jwt';
import { JwtPayloadInterface } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService
  ){}

  async create(createUserDto: CreateUserDto) {

    try {
      const {password, ...userData} = createUserDto
    
    const user = this.userRepository.create({
      ...userData,
      password: bcrypt.hashSync(password, 12)
    })
    
    await this.userRepository.save(user)

    return{
      ...user,
      password: null,
      token: this.getJwt({email: user.email}) //creo el token
    }
      
    
    } catch (error) {
      this.handleDbError(error)  
    }
  }

  async loginUser(loginUserDto: LoginUserDto){
        const {email, password} = loginUserDto

        const user = await this.userRepository.findOne({
          where: {email},
          select: {email: true, password: true}
        })

        if(!user){
          throw new UnauthorizedException('Credentials are invalid')
        }

        if(!bcrypt.compareSync(password, user.password)){
          throw new UnauthorizedException('Password is not valid')
        }

        return {
          ...user,
          password: null,
          token: this.getJwt({email: user.email}) //creo el token
        }
  }

  handleDbError(error: any): void{
    if(error.code === '23505'){
      throw new BadRequestException(error.detail)
    }

    console.log(error)
    throw new InternalServerErrorException('Check logs')
  }

  private getJwt(payload: JwtPayloadInterface){
    const token = this.jwtService.sign(payload) //uso sign para crear el token
    return token
  }
}
~~~

- Quiero guardar todo en minúsculas, lo hago usando **@BeforeInsert**  y **@BeforeUpdate** (es el mismo código) en la entidad
- user.entity.ts

~~~js
@BeforeInsert()
    checkFieldsBeforeInsert(){
        this.email = this.email.toLowerCase().trim()
    }

@BeforeUpdate()
checkFieldsBeforeUpdate(){
    this.checkFieldsBeforeInsert()
}
~~~

- Apuntando a auth/register mando un objeto como este en el body

~~~json
{
  "email": "migue@gmail.com",
  "password":"1Migue",
  "fullName":"Miguel Pernas"
}
~~~

- Recibo esto de respuesta

~~~json
{
  "id": "f16a2c17-dc8e-4077-a33c-dc0571d93b25",
  "fullName": "Miguel Pernas",
  "password": null,
  "email": "migue@gmail.com",
  "isActive": true,
  "roles": [
    "user"
  ],
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6Im1pZ3VlQGdtYWlsLmNvbSIsImlhdCI6MTc0ODYyODcwNCwiZXhwIjoxNzQ4NjM1OTA0fQ.Ap-0iQk7xHhkKvDhBG32x6Rrem4P7LW6HmrgOy5X3FI"
}
~~~

## Private Route - General

- Creo mi primera ruta privada que su único objetivo es asegurar de que hay un jwt, que el usuario esté activo y que el token n haya expirado

~~~js
@Get('private')
@UseGuards(AuthGuard())
  testingPrivateRoute(){
    return {
      ok: true
    }
  }
~~~

- Los **Guards** son usados para **permitir o prevenir el acceso a una ruta**
- **Es donde se debe autorizar una solicitud**
- Autenticación y autorización no son lo mismo
  - Autenticado es cuando el usuario está validado y autorizado es que tiene permiso para acceder
- Se usa **@UseGuards**, mças adelante haremos un usario especializado
- Uso AuthGuard de @nestjs/passport que usa la estrategia que yo definí por defecto
- Para probarlo en POSTMAN debo añadir el token proporcionado en el login en Auth/Bearer

## Cambiar el email por el id en el payload

- Primero cambiamos la interfaz

~~~js
export interface JwtPayloadInterface{
    id: string
}
~~~

- En el auth.service

~~~js
@Injectable()
export class AuthService {

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService
  ){}

  async create(createUserDto: CreateUserDto) {

    try {
      const {password, ...userData} = createUserDto
    
    const user = this.userRepository.create({
      ...userData,
      password: bcrypt.hashSync(password, 12)
    })
    
    await this.userRepository.save(user)

    return{
      ...user,
      password: null,
      token: this.getJwt({id: user.id})
    }
      
    
    } catch (error) {
      this.handleDbError(error)  
    }
  }

  async loginUser(loginUserDto: LoginUserDto){
        const {email, password} = loginUserDto

        const user = await this.userRepository.findOne({
          where: {email},
          select: {email: true, password: true, id: true}
        })

        if(!user){
          throw new UnauthorizedException('Credentials are invalid')
        }

        if(!bcrypt.compareSync(password, user.password)){
          throw new UnauthorizedException('Password is not valid')
        }

        return {
          ...user,
          password: null,
          token: this.getJwt({id: user.id})
        }
  }
  {...code}
} 
~~~

- Debo cambiarlo también la estrategia!

~~~js
import { PassportStrategy } from "@nestjs/passport";
import { InjectRepository } from "@nestjs/typeorm";
import { ExtractJwt, Strategy } from "passport-jwt";
import { Repository } from "typeorm";
import { User } from "../entities/user.entity";
import { ConfigService } from "@nestjs/config";
import { JwtPayloadInterface } from "../interfaces/jwt-payload.interface";
import { Injectable, UnauthorizedException } from "@nestjs/common";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy){

    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly configService: ConfigService
    ){
        
    super({
        secretOrKey: configService.get('JWT_SECRET')!,
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken()
    })
    }

  //la estrategia ejecuta este método automáticamente 
    async validate(payload: JwtPayloadInterface): Promise<User>{
        const {id} = payload //aquí!

        const user = await this.userRepository.findOneBy({id}) //aqui!

        if(!user) throw new UnauthorizedException('Token not valid')
        if(!user.isActive) throw new UnauthorizedException('User is not active')

        return user
    }
} 
~~~

- Si ahora vuelvo a apuntar a /auth/register con el token del login debería dejarme ver el ok: true

## Custom Property Decorator - GetUser

- Puedo extraer el usuario del Guard
- Si se me olvidara que tengo implementado el Guard y quisiera extraer el usuario  debería lanzar un error propio

> nest g d getUser

- Este decorador funciona de manera global, por clase y controlador, no por propiedad
- Para extraer el usuario usaré **@Request** de @nestjs/common

~~~js
@Get('private')
  @UseGuards(AuthGuard())
  testingPrivateRoute(@Request() request: Express.Request){
    return {
      ok: true
    }
  }
~~~

- **request.user** me devuelve el usuario
- No es muy bonito y necesitaría algunas validaciones
- Usaremos el auth/decorators/get-user.decorator.ts
- Notar que la data y el ctx están dentro de un callback

~~~js
import { createParamDecorator, ExecutionContext, InternalServerErrorException } from '@nestjs/common';


export const GetUser = createParamDecorator((data, ctx: ExecutionContext)=>{
    const req = ctx.switchToHttp().getRequest()

    const user = req.user

    if(!user) throw new InternalServerErrorException('User not found')

    return user
})
~~~

- Quiero usar dos veces el @GetUser en el mismo endpoint
- Una sin pasarle ningún argumento que me devuelva el user completo
- Otra pasándole solo el email como parámetro a @GetUser
- Podría usar los Pipes para validar/transformar la data, pero no es el caso

~~~js
@Get('private')
@UseGuards(AuthGuard())
testingPrivateRoute(
  @GetUser() user: User,
  @GetUser('email') email:string
){
  return {
    ok: true
  }
}
~~~

- En el decorador uso un ternario para devolver si no hay data el user y si no el user.propiedad.computada

~~~js
import { createParamDecorator, ExecutionContext, InternalServerErrorException } from '@nestjs/common';


export const GetUser = createParamDecorator((data, ctx: ExecutionContext)=>{
    const req = ctx.switchToHttp().getRequest()

    const user = req.user

    if(!user) throw new InternalServerErrorException('User not found')


    return (!data)? user: user[data]
})
~~~

- Creo un decorador que me devuelva **lo que yo quiera de @Request**, por ejemplo los headers
- getRawHeaders.decorator.ts

~~~js
import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export const GetRawHeaders = createParamDecorator((data, ctx: ExecutionContext)=>{
    const req = ctx.switchToHttp().getRequest()

    return req.rawHeaders
})
~~~

- En el auth.controller

~~~js
@Get('private')
  @UseGuards(AuthGuard())
  testingPrivateRoute(
    @GetUser() user: User,
    @GetUser('email') email:string,
    @GetRawHeaders() rawHeaders: string[]
  ){
    return {
      ok: true,
      user,
      email,
      rawHeaders
    }
  }
~~~

## Custom Guard y Custom Decorator

- Si quisiera validar el rol podría hacerlo en el controlador con user.roles.includes('admin')
- Pero voy a crear un Guard y un Custom Decorator para esta tarea
- Para ello creo un nuevo endpoint GET en el controller

~~~js
@Get('private2')
@UseGuards(AuthGuard())
testingPrivateRoute2(@GetUser() user: User)
  {
  return {
    ok: true,
    user    
  }
}
~~~

- Este GET necesita ciertos roles podría usar **@SetMetadata** para validarlos
- **Pero con esto no es suficiente debo crear un GUard para que los evalúe**
- Ejemplo @SetMetadata insuficiente

~~~js
@Get('private2')
@UseGuards(AuthGuard())
@SetMetadata('roles', ['admin'])
testingPrivateRoute2(
  @GetUser() user: User)
  {
  return {
    ok: true,
    user    
  }
}
~~~

- Creo el Guard

> nest g gu auth/guards/userRole --no-spec+

- Los Guards son async por defecto
- En este caso no lleva el paréntesis en el controlador porque AuthGuard ya devuelve la instancia
  - Los Guards personalizados no llevan paréntesis para usar la misma instancia
- Los Guards están dentro de la Exception Zone de Nest
- Para verificar los roles debo extraer la data del decorador @SetMetadata
- **Inyecto Reflector en el constructor**
- Lo uso para guardar en la variable .get('roles') lo que pone en @SetMetadata, el target es context.getHandler()
- El UserRoleGuard

~~~js
import { BadRequestException, CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { User } from 'src/auth/entities/user.entity';

@Injectable()
export class UserRoleGuard implements CanActivate {

  constructor(
    private readonly reflector: Reflector
  ){}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    
    const validRoles: string[]= this.reflector.get('roles', context.getHandler())

    if(!ValidRoles) return true //que pase en el caso de que no haya roles
    if(validRoles.length===0) return true //lo mismo

    const req = context.switchToHttp().getRequest()
    const user = req.user as User

    if(!user) throw new BadRequestException('User not found')
    
    for(const role of user.roles){
      if(validRoles.includes(role)){
        return true
      }
    }

    throw new ForbiddenException(`User ${user.fullName} needs a valid role`)
  }
}
~~~

- En el auth.controller

~~~js
@Get('private2')
@UseGuards(AuthGuard(), UserRoleGuard)
@SetMetadata('roles', ['admin'])
testingPrivateRoute2(
  @GetUser() user: User)
  {
  return {
    ok: true,
    user    
  }
}
~~~

- Para implementar esta lógica debo usar el @SetMetadata
- Si se me olvidara, al extraer los validRoles de mi app reventaría. debería validarlo
- El arreglo de roles es muy volátil, me puedo equivocar
- **El @SetMetadata es poco común como decorador directamente**
- Mejor crear un **Custom Decorator**

## Custom Decorator Role Protected

- Si no son decoradores de propiedades, perfectamente puedo usar el CLI
- Cómo me va a servir para establecer los roles que el usario debe de tener para acceder a la ruta el decorador está ligado al módulo de auth

> nest g d auth/decorators/RoleProtected --no-spec

- auth/decorators/role-protected.decorator.ts

~~~js
import { SetMetadata } from '@nestjs/common';
import { ValidRoles } from '../interfaces/valid-roles.enum';

export const META_ROLES = 'roles'


export const RoleProtected = (...args: ValidRoles[]) => {
    return SetMetadata(META_ROLES, args)
};
~~~

- auth/interfaces/valid-roles.enum.ts

~~~js
export enum ValidRoles{
    admin='admin',
    superUser = 'super-user',
    user='user'
}
~~~

- Uso @RoleProtected en el auth.controller

~~~js
@Get('private2')
@UseGuards(AuthGuard(), UserRoleGuard)
@RoleProtected(ValidRoles.admin)
testingPrivateRoute2(
  @GetUser() user: User)
  {
  return {
    ok: true,
    user    
  }
}
~~~

- Puedo pasarle valores separados por comas
- Es fácil que me olvide de implementar el AuthGuard, el RoleProtected
- **Crearemos un único decorador para hacer todo esto**

## Composición de decoradores

- Se usa **applyDecorators** de @nestjs/common para hacer composición de decoradores
- Creo el auth.decorator.ts

~~~js
import { applyDecorators, UseGuards } from "@nestjs/common";
import { ValidRoles } from "../interfaces/valid-roles.enum";
import { RoleProtected } from "./role-protected.decorator";
import { AuthGuard } from "@nestjs/passport";
import { UserRoleGuard } from "../guards/user-role.guard";



export function Auth(...roles: ValidRoles[]){
    return applyDecorators(
        RoleProtected(...roles),
        UseGuards(AuthGuard('jwt'), UserRoleGuard)
    )
}
~~~

- Lo uso en el auth.controller
- Recuerda que en el UserRoleGuard hay dos lineas que permiten pasar sin ValidRoles, por lo que puedo pasarle un rol o no para la autorización

~~~js
@Get('private2')
@Auth(ValidRoles.admin)
testingPrivateRoute2(
  @GetUser() user: User)
  {
  return {
    ok: true,
    user    
  }
}
~~~

## Auth en otros módulos

- Quiero usar el decorador @Auth en mi seed.controller.ts
- @Auth está usando @AuthGuard que **está asociado a Passport** y **Passort es un módulo**
- Auth **pide el defaultStrategy**, por lo que **en el módulo de Auth exporto JwtStrategy y PassportModule**

~~~js
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeORMError } from 'typeorm';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([User]),
    PassportModule.register({defaultStrategy: 'jwt'}),
    JwtModule.registerAsync({
    imports:[ConfigModule],
    inject: [ConfigService],
    useFactory: (configService: ConfigService)=>{
      return{
          secret: process.env.JWT_SECRET,
          signOptions:{
          expiresIn: '2h'
      }
    }
    } 
  })
],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [TypeOrmModule, JwtStrategy, PassportModule, JwtModule]
})
export class AuthModule {}
~~~

- Importo AuthModule en el seed.module

~~~js
@Module({
  controllers: [SeedController],
  providers: [SeedService],
  imports: [ProductsModule, AuthModule]
})
export class SeedModule {}
~~~

- Ahora puedo usar el decorador en el seed.controller

~~~js
@Controller('seed')
export class SeedController {
  constructor(private readonly seedService: SeedService) {}

  @Get()
  @Auth(ValidRoles.admin)
  executeSeed(){
    return this.seedService.runSeed();
  }
}
~~~

- Si quiero que todos los endpoints necesiten autorización puedo colocar el **@Auth a nivel de controlador**

## Usuario que creó el producto

- Sería útil saber que usuario creó el producto
- Un usuario puede crear varios productos (**@OneTo Many**)
- Muchos productos pueden ser de un usuario (**@ManyToOne**)
- El OneToMany no va a crear ninguna nueva columna en user, pero en product si
- user.entity

~~~js
@OneToMany(
    ()=> Product,
    (product)=> product.user
)
product: Product
~~~

- product.entity

~~~js
@ManyToOne(
      ()=> User,
      (user)=> user.product,
      {eager: true} //para que lo muestre en las búsquedas
  )
user: User
~~~

## Insertar userId en los productos

- En el **products.module** debo importar **auth.module**
- Solo los admin van a poder crear productos
- Uso el decorador **@GetUser** para obtener el usuario
- Hago lo mismo en el update
- products.controller.ts

~~~js
@Post()
@Auth(ValidRoles.admin)
create(@Body() createProductDto: CreateProductDto,
        @GetUser() user: User) {
  return this.productsService.create(createProductDto, user);
}

@Patch(':id')
@Auth(ValidRoles.admin)
update(@Param('id', ParseUUIDPipe) id: string, 
        @Body() updateProductDto: UpdateProductDto,
        @GetUser() user: User) {
  return this.productsService.update(id, updateProductDto, user);
}
~~~

- En el products.service.ts

~~~js
async create(createProductDto: CreateProductDto, user: User) {
  try {
    const {images=[], ...productDetails}= createProductDto
    const product = this.productRepository.create({
      ...productDetails,
      images: images.map(image=> this.productImageRepository.create({url:image})), 
      user
    })

    await this.productRepository.save(product)
    return product

  } catch (error) {
      this.handleDBExceptions(error)
  }
}

async update(id: string, updateProductDto: UpdateProductDto, user: User) {
  const {images, ...toUpdate} = updateProductDto

  const product = await this.productRepository.preload({id, ...toUpdate})

  if(!product) throw new NotFoundException(`Product with id ${id} not found`)

    const queryRunner = this.dataSource.createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction()

    try {

      if(images){
        await queryRunner.manager.delete(ProductImage, {product: {id}})
        product.images = images?.map(image=>this.productImageRepository.create({url: image}))
        
      }

      product.user = user

      await queryRunner.manager.save(product)
      await queryRunner.commitTransaction()
      await queryRunner.release()

      return this.findOnePlane(id)
        
    } catch (error) {
      await queryRunner.rollbackTransaction()
      await queryRunner.release()

      this.handleDBExceptions(error)
    }

}
~~~

- Muteo estas dos lineas del SEED que me da error porque no le paso el user para poder crear un producto
- seed.service.ts

~~~js
import { Injectable } from '@nestjs/common';
import { ProductsService } from 'src/products/products.service';
import { initialData } from './data/data';

@Injectable()
export class SeedService {

  constructor(
    private readonly productsService: ProductsService
  ){}

  async runSeed(){
    
    this.insertNewProducts()

    const products = initialData.products

  //const insertPromises = products.map(product => this.productsService.create(product));

  //await Promise.all(insertPromises)
    return 'SEED EXECUTED'
  }

  private async insertNewProducts(){
    await this.productsService.deleteAllProducts()
  }
  
}
~~~

- Como tengo el eager en true, en la respuesta me carga el usuario
- Falta arreglar lo del user en el SEED
- **NOTA**: si al crear el producto aparece un error Cannot read properties of undefined (reading 'challenge') es porque en la composición del decorador @AuthGuard **falta pasarle el 'jwt'**

## SEED de usuarios, productos e imágenes

- Creo un método para purgar las tablas
- Si intento borrar primero los usuarios, estos están siendo utilizados por los productos
- Borro todos los productos con el servicio de productos
- Para los usuarios debo inyectar el servicio de usuarios
- Estoy exportando TypeORM dónde venía el usuario, **por eso no da error**
- Creo la interfaz seed-data.ts
- Añado los users
- seed-data.ts

~~~js
import * as bcrypt form 'bcrypt'

interface SeedProduct {
    description: string;
    images: string[];
    stock: number;
    price: number;
    sizes: ValidSizes[];
    slug: string;
    tags: string[];
    title: string;
    type: ValidTypes;
    gender: 'men'|'women'|'kid'|'unisex'
}

export interface SeedUser{
    email: string,
    fullName: string,
    password: string,
    roles: string[]
}

type ValidSizes = 'XS'|'S'|'M'|'L'|'XL'|'XXL'|'XXXL';
type ValidTypes = 'shirts'|'pants'|'hoodies'|'hats';


interface SeedData {
    users: SeedUser[],
    products: SeedProduct[];
}


export const initialData: SeedData = {

    users:[
        {
            email: "test1@google.com",
            fullName: "Migue Sensei",
            password: bcrypt.hashSync("Abc123456", 10),
            roles: ['admin']
        },
        {
            email: "test2@google.com",
            fullName: "Anna Kunoichi",
            password: bcrypt.hashSync("Abc123456", 10),
            roles: ['user', 'super']
        }
    ],
    products:[...code]
}
~~~

- Ahora puedo usar los usuarios para insertarlos en el servicio
- Este firstUser que me retorna se lo paso a insertNewProducts y se lo paso al forEach, para que lo inserte en cada producto
- seed.service.ts

~~~js
@Injectable()
export class SeedService {

  constructor(
    private readonly productsService: ProductsService,
    @InjectRepository(User)
    private readonly userRepository : Repository<User>
  ){}

  private async insertUsers(){
    const seedUsers = initialData.users
    const users: User[] = []

    seedUsers.forEach(user=>{
      users.push(this.userRepository.create(user))
    })

    const dbUsers = await this.userRepository.save(seedUsers)

    return dbUsers[0]
  }

  async runSeed(){

    this.deleteTables()
    const firstUser = await this.insertUsers()
    
    this.insertNewProducts(firstUser)

    const products = initialData.products
    return 'SEED EXECUTED'
  }

  private async deleteTables(){
    await this.productsService.deleteAllProducts()

    const queryBuilder = this.userRepository.createQueryBuilder()

    await queryBuilder
    .delete()
    .where({})
    .execute()
  }


private async insertNewProducts(user: User){
  await this.productsService.deleteAllProducts();
  const products = initialData.products;
  const insertPromises: Promise<Product | undefined>[] = [];
  
  products.forEach(product => {
    insertPromises.push(this.productsService.create(product, user));
  });

  await Promise.all(insertPromises);

    return 'SEED EXECUTED'
  }
}
~~~

## CheckAuthStatus

- Falta poder revalidar el token. Usar el token suministrado y generar un nuevo token basado en el anterior
- Si no hago esto, si el usuario refresca el navegador perderá la autenticación
- auth.controller.ts

~~~js
@Get('check-auth')
  @Auth()
  checkAuthStatus(
    @GetUser() user: User
  ){
    return this.authService.checkAuthStatus(user)
  }
~~~

- En el auth.service

~~~js
async checkAuthStatus(user: User){
  return {
    ...user,
    token: this.getJwt({id: user.id})
  }
}
~~~

- En la respuesta regreso un nuevo JWT y la info de name, fullName, por si le sirve al frontend
- El usuario tiene que estar activo

## Documentación

> npm i --save @nestjs/swagger

- main.ts

~~~js
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1')

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions:{
        enableImplicitConversion: true
      }
    })
  )

  //SWAGGER
  const config = new DocumentBuilder()
  .setTitle('Teslo REST API')
  .setDescription('Teslo Shop')
  .setVersion('1.0')
  .build()

  const document = SwaggerModule.createDocument(app,config)
  SwaggerModule.setup('api', app, document)

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
~~~

## Tags, ApiProperty, ApiResponse

- En el products.controller.ts

~~~js
@ApiTags('Products')
@Controller('products')
export class ProductsController {
  {...code}
}
~~~

- Para indicar en el POST que tipo de data está esperando, si es obligatorio o no y que tipo de respuestas

~~~js
@Post()
@ApiResponse({status: 201, description: 'Product was created', type: Product})
@ApiResponse({status: 400, description: 'Bad Request'})
@ApiResponse({status: 403, description: 'Forbidden. Token related'})
@Auth(ValidRoles.admin)
create(@Body() createProductDto: CreateProductDto,
        @GetUser() user: User) {
  return this.productsService.create(createProductDto, user);
}
~~~

- Debo ir a la entity y añadir **@ApiProperty**
- product.entity.ts

~~~js
import { BeforeInsert, BeforeUpdate, Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { ProductImage } from "./product-image.entity";
import { User } from "src/auth/entities/user.entity";
import { ApiProperty } from "@nestjs/swagger";

@Entity({name: 'products'})
export class Product {
    
    @ApiProperty()
    @PrimaryGeneratedColumn('uuid')
    id: string
    
    @ApiProperty()
    @Column({
        type: 'text',
        unique: true
    })
    title: string

    @ApiProperty()
    @Column({
        type: 'float',
        default: 0
    })
    price: number

    @ApiProperty()
    @Column({
        type: 'text',
        nullable: true
    })
    description: string

    @ApiProperty()
    @Column({
        type: 'text',
        unique: true
    })
    slug: string

    @ApiProperty()
    @Column({
        type: 'int',
        default: 0
    })
    stock: number

    @ApiProperty()
    @Column({
        type: 'text',
        array: true
    })
    sizes: string[]

    @ApiProperty()
    @Column({
        type: 'text'
    })
    gender: string

    @ApiProperty()
    @Column({
        type: 'text',
        array: true,
        default: []
    })
    tags: string[]

    @ApiProperty()
    @OneToMany(
        ()=> ProductImage,
        productImage=> productImage.product,
        {cascade: true, eager: true}
    )
    images: ProductImage[]

    @ApiProperty()
    @ManyToOne(
        ()=> User,
        (user)=> user.product
    )
    user: User
    
    @BeforeInsert()
    checkSlugInsert(){
        if(!this.slug){
            this.slug = this.title //si no viene el slug guardo el titulo en slug
        }

        this.slug = this.slug
        .toLowerCase()
        .replaceAll(" ", "_")
        .replaceAll("'", "")
    }

    @BeforeUpdate()
    checkSlugUpdate(){
        this.slug= this.slug
        .toLowerCase()
        .replaceAll(" ", "_")
        .replaceAll(" ", "")
    }
}
~~~

## Expandir ApiProperty

- product.entity.ts

~~~js
@ApiProperty({
      example: '9a87a878s98-323ad4m4-3j3j3--Sa86ghs6rs', //uuid
      description: 'Product ID',
      uniqueItems: true
    })
    @PrimaryGeneratedColumn('uuid')
    id: string

@ApiProperty({
      example: 'T-Shirt Teslo',
      description: 'Product title',
      uniqueItems: true
    })
    @Column({
        type: 'text',
        unique: true
    })
    title: string
~~~

- También puedo añadir un **default en NULL o en 0, o con un arreglo vacío dentro de @ApiProperty**

## Documentar DTOS

- Si los DTOS no fueran clases perderíamos la oportunidad de decorar las propiedades
- pagination.dto.ts

~~~js
import { ApiProperty } from "@nestjs/swagger"
import { Type } from "class-transformer"
import { IsOptional, IsPositive, Min } from "class-validator"

export class PaginationDto{

    @ApiProperty({
        default: 10,
        description: 'How many rows do you need?'
    })
    @IsOptional()
    @IsPositive()
    @Type(()=> Number)
    limit?: number
    
    @ApiProperty({
        default: 0,
        description: 'How many rows do you want to skeep?'
    })
    @IsOptional()
    @Min(0)
    @Type(()=> Number)
    offset?: number
}
~~~

- Para tipar el create-product.dto sigo usando @ApiProperty
- Para tipar el update-prodcut dto **en lugar de importar PartialType de @nestjs/mapped-types lo importo de @nestjs/swagger**
-------
