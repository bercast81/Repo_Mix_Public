import { BadRequestException, HttpStatus, Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaClient } from 'generated/prisma';
import { PaginationDto } from 'src/common/pagination.dto';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { NATS_SERVICE } from 'src/config/services';

@Injectable()
export class ProductsService extends PrismaClient implements OnModuleInit{

  private readonly logger = new Logger('ProductsService')

  constructor(
    @Inject(NATS_SERVICE) private readonly client: ClientProxy
  ){
    super();
  }

  onModuleInit() {
    this.$connect()
    this.logger.log('Database connected!!')
  }

  create(createProductDto: CreateProductDto) {
    return this.product.create({
      data: createProductDto
    })
  }

  async findAll(paginationDto: PaginationDto) {
    const {page, limit} = paginationDto

    const totalProducts = await this.product.count({where: {avaliable: true}})
    //divido el total de páginas (número de productos disponibles) por el limite
    //.ceil redondea al siguiente número positivo
    const lastPage = Math.ceil(totalProducts / limit!)

    return{
      data: await this.product.findMany({
        //skip = 0 * (limit = 10) 0 primera posición del arreglo, página tengo 1,2,3
        //si estoy en la página 2, (2-1 == 1) * limit == 10, skip 10 registros
        skip: (page!-1) * limit!,
        take: limit,
        where:{
          avaliable: true
        }
      }),
      //meta de metadata
      meta:{
        total: totalProducts,
        page: page,
        lastPage: lastPage
      }
    }
  }

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

  async update(updateProductDto: UpdateProductDto) {
   const {id, ...data} = updateProductDto
   
   await this.findOne(id)

   return await this.product.update({
    where: {id},
    data
   })
  }

  async remove(id: number) {
   const product = await this.product.update({
    where: {id},
    data:{
      avaliable: false
    }
   })   
   
   return product
  }

  async validateProducts(ids: number[]){
  ids = Array.from(new Set(ids));

  const products = await this.product.findMany({
    where: {
      id: { in: ids }
    }
  });

  if (products.length !== ids.length) {
    throw new RpcException({
      message: 'Some products were not found',
      status: HttpStatus.BAD_REQUEST
    });
  }

  return products; // ✅ ¡AGREGA ESTA LÍNEA!
}


}
