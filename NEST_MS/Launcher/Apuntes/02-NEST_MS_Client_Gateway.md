# 02 NEST_MS - Client Gateway

- Creo el Cliente con nest new gateway (fuera de la carpeta products-ms)
- Instalo dotenv joi @nestjs/microservices
- Configuro las variables de entorno
- config/envs.ts

~~~js
import 'dotenv/config'
import * as joi from 'joi'


interface EnvVars{
    PRODUCTS_MICROSERVICE_HOST: string
    PRODUCTS_MICROSERVICE_PORT: number
}

const envsSchema = joi.object({
    PRODUCTS_MICROSERVICE_HOST: joi.string().required(),
    PRODUCTS_MICROSERVICE_PORT: joi.number().required()    
})
.unknown(true) //hay muchas variables más del entorno como el path de node, etc


const {error, value}= envsSchema.validate(process.env)

if(error){
    throw new Error(`Config validation error: ${error.message}`)
}

const envVars: EnvVars = value


export const envs={
    productsMicroserviceHost: envVars.PRODUCTS_MICROSERVICE_HOST,
    productsMicroservicePort: envVars.PRODUCTS_MICROSERVICE_PORT
}
~~~

- En .env

~~~
PRODUCTS_MICROSERVICE_HOST=localhost
PRODUCTS_MICROSERVICE_PORT=3001
~~~

- Creo las rutas dentro del gateway

> nest g res products

- Si es una RESTFUL API
- No voy a necesitar el servicio
- Creo la conexión en products.module con el microservicio
- gateway/products/products.module

~~~js
import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { envs } from 'src/config/envs';
import { PRODUCTS_SERVICE } from 'src/config/services';

@Module({
  imports:[
    ClientsModule.register([
      {
        name: PRODUCTS_SERVICE, //injection token
        transport: Transport.TCP,
        options:{
          host: envs.productsMicroserviceHost,
          port: envs.productsMicroservicePort
        }
      }
    ])
  ],
  controllers: [ProductsController],
  providers: [],
})
export class ProductsModule {}
~~~

- El injection token del config/services.ts

~~~js
export const PRODUCTS_SERVICE= 'PRODUCTS_SERVICE'
~~~

- Este injection token es lo que vamos a usar para inyectar el microservicio en el controller
- Puedo crear un archivo de barril en config/index.ts

~~~js
export * from './envs'
export * from './services'
~~~

## Obtener todos los productos

- Si estuviera trabajando las variables de entorno con ConfigModule debería usar registerAsync en gateway/products/products.module, inyectar el ConfigService...
- Para conectar con findProducts inyectamos el microservicio de products en el controller
- gateway/products/products.controller

~~~js
import { Controller, Get, Post, Body, Patch, Param, Delete, Inject } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PRODUCTS_SERVICE } from 'src/config';
import { ClientProxy } from '@nestjs/microservices';

@Controller('products')
export class ProductsController {
  constructor(
    @Inject(PRODUCTS_SERVICE)
    private readonly productsClient: ClientProxy
  ) {}

  @Get()
  findAll() {
    return this.productsClient.send({cmd: 'find_all_products'}, {});
  }
 
}
~~~

- Llamo al productsClient para conectar con el microservicio
- Si espero una respuesta uso .send
- Si no espero una respuesta uso .emit
- Le paso exactamente lo mismo que le puse en el cmd del @MessagePattern
- En este caso de segundo argumento le paso un objeto vacío (está esperando el payload, que en este caso es el PaginationDTo)
- Para usar el PaginationDto uso @Query
- Debo instalar class-validator y class-transformer y hacer la configuración en el main con .useGlobalPipes
- gateway/main.ts

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

- gateway/products/products.controller

~~~js
@Get()
findAll(@Query() paginationDto: PaginationDto) {
    return this.productsClient.send({cmd: 'find_all_products'}, paginationDto);
}
~~~

## Manejo de excepciones

- Vamos con el finOne, al cual le tengo que pasar un id
- El .send devuelve un Observable. No es más que un flujo de información
- Para escuchar los Observable necesito el .subscribe, mandarle la respuesta y retomarla

~~~js
.subscribe(res=>{
    //return res
})
~~~

- Es como se trabajan comunmente los Observable
- Estoy lanzando un NotFoundException desde el servicio de products-ms, pero **los errores son atrapados por RpcException** cuando usamos .send
- Vamos a crear un ExceptionFilter para atrapar todos los RpcException
- Primero solucionémoslo de forma empírica
- Lo meto en un try catch y **uso el firstValueFrom de rxjs que me permite trabajar como una promesa el Observable**
- Le estoy diciendo **"espera el primer valor que este Observable va a emitir"**
- **Puedo usar .pipe con catchError** o puedo capturarlo en el catch
- gateway/products/products.controller

~~~js
@Get(':id')
async findOne(@Param('id') id: string) {
    try {
        const product = await firstValueFrom(
        this.productsClient.send({cmd:'find_one_product'}, {id})
        )
        return product      
    } catch (error) {
        throw new BadRequestException()
    }
}
~~~

- **Pero así no estoy atrapando la RpcException!**

## ExceptionFilter

- Las excepciones van a estar continuamente manejadas con RpcException, a veces puede que manden un string y no un objeto
- Vamos a hacer que las excepciones siempre sean manejadas como objetos
- Uso el decorador **@Catch** y le paso el RpcException de @nestjs/microservices
- Implemento la clase ExceptionFilter, le paso la RpcException y el host
- Creo el context, obtengo la response
- Guardo el error usando la RpcException que le pasé en el catch con .getError
- Si el error es un objeto y contiene status y message me aseguro de que el status es un número y si no lo casteo
- retorno la response que obtuve del context y envio el error con .json
- Si no pasa las validaciones genero yo la respuesta con un objeto pasándole el status y el message
- **El globalExceptionFilter no esta disponible en aplicaciones híbridas**
- El ExceptionFilter está fuera del Exception Zone de Nest
- gateway/src/common/expceptions/rpc-custom-exception.filter.ts

~~~js
import { ArgumentsHost, Catch, ExceptionFilter } from "@nestjs/common";
import { RpcException } from "@nestjs/microservices";

@Catch(RpcException)
export class RpcCustomExceptionFilter implements ExceptionFilter{

    catch(exception: RpcException, host: ArgumentsHost) {
        const ctx = host.switchToHttp()
        const response = ctx.getResponse()

        const rpcError= exception.getError()

        if(
            typeof rpcError === 'object' &&
            'status' in rpcError &&
            'message' in rpcError
        ){                              //uso any porque typescript no sabe si viene el objeto como tal
            const status = isNaN((+rpcError as any).status) ? 400: +rpcError
            return response.status(status).json(rpcError)
        }

        response.status(400).json({
            status: 400,
            message: rpcError
        })
    }
}
~~~

- Podría usar un método para no usar any

~~~js
function isRpcError(obj: any): obj is { status: number; message: string } {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'status' in obj &&
    'message' in obj
  );
}
~~~

- Y pasárselo en el if

~~~js
@Catch(RpcException)
export class RpcCustomExceptionFilter implements ExceptionFilter {
  catch(exception: RpcException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const rpcError = exception.getError();

    if (isRpcError(rpcError)) {
      const status = isNaN(+rpcError.status) ? 400 : +rpcError.status;
      return response.status(status).json(rpcError);
    }

    response.status(400).json({
      status: 400,
      message: rpcError,
    });
  }
}
~~~

- Lo coloco en el main para aplicarlo
- gateway/src/main.ts

~~~js
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { RpcCustomExceptionFilter } from './common/exceptions/rpc-custom-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true
  }))

  app.useGlobalFilters( new RpcCustomExceptionFilter())

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
~~~

- Lo uso en el gateway/products/products.controller

~~~js
@Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const product = await firstValueFrom(
        this.productsClient.send({cmd:'find_one_product'}, {id})
      )
      return product      
    } catch (error) {
      throw new RpcException(error)
    }
  }
~~~

- En el products-ms/products.service lanzo la RpcException

~~~js
async findOne(id: number) {
    const product = await this.product.findFirst({
      where:{id, avaliable: true}
    })

    if(!product){
      throw new RpcException({
        message: `Product with id ${id} not found`,
        status: HttpStatus.BAD_REQUEST
      })
    }

    return product
  }
~~~

- En el cliente puedo usar .pipe con CatchError para atrapar la RpcException que ha pasado por el ExceptionFilter
- .pipe viene en los Observable, catchError de rxjs
- gateway/products/products.controller

~~~js
 @Get(':id')
  async findOne(@Param('id') id: string) {
     
    return  this.productsClient.send({cmd:'find_one_product'}, {id}).pipe(
      catchError((err)=>{
        throw new RpcException(err)
      })
     )  
  }
~~~

## Implementar métodos faltantes

- Creación, borrado y actualización desde gateway/products/products.controller

~~~js
import { Controller, Get, Post, Body, Patch, Param, Delete, Inject, Query, BadRequestException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PRODUCTS_SERVICE } from 'src/config';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { PaginationDto } from 'src/common/pagination.dto';
import { catchError, firstValueFrom } from 'rxjs';
import { RpcCustomExceptionFilter } from 'src/common/exceptions/rpc-custom-exception.filter';

@Controller('products')
export class ProductsController {
  constructor(
    @Inject(PRODUCTS_SERVICE)
    private readonly productsClient: ClientProxy
  ) {}

  @Post()
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsClient.send({cmd:'create_product'}, createProductDto)
    
  }

  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.productsClient.send({cmd: 'find_all_products'}, paginationDto);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
     
    return  this.productsClient.send({cmd:'find_one_product'}, {id}).pipe(
      catchError((err)=>{
        throw new RpcException(err)
      })
     )  
  }
 

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsClient.send({cmd: 'update_product'},{
      id,
      ...updateProductDto
    })
    .pipe(
      catchError((err)=>{
        throw new RpcException(err)
      })
    )
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productsClient.send({cmd:'delete_product'}, {id})
      .pipe(
        catchError((err)=>{
          throw new RpcException(err)
        })
      )
  }
}
~~~
