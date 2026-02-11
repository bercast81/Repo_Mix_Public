import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseIntPipe } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PaginationDto } from 'src/common/pagination.dto';
import { Ctx, MessagePattern, NatsContext, Payload } from '@nestjs/microservices';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @MessagePattern({cmd: 'create_product'})
  create(@Payload() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @MessagePattern({cmd:'find_all_products'})
  findAll(@Payload() paginationDto:PaginationDto) {
    return this.productsService.findAll(paginationDto);
  }

  @MessagePattern({cmd:'find_one_product'})
  findOne(@Payload('id', ParseIntPipe) id: string) {
    return this.productsService.findOne(+id);
  }

  @MessagePattern({cmd:'update_product'})
  update(@Payload() updateProductDto: UpdateProductDto) {
    return this.productsService.update(updateProductDto);
  }

  @MessagePattern({cmd:'delete_product'})
  remove(@Payload('id', ParseIntPipe) id: number) {
    return this.productsService.remove(+id);
  }

  @MessagePattern({cmd:'validate_products'})
  validateProduct(@Payload() ids: number[]){
    return this.productsService.validateProducts(ids)
  }

  @MessagePattern('time.*') //escuchará cualquier mensaje que venga de time
  getDate(@Payload() data: number[], @Ctx() context: NatsContext){
    console.log(`Subject: ${context.getSubject()}`)
    return new Date().toLocaleString()
  }
}
