import { Controller, Get, Post, Body, Patch, Param, Delete, Inject, Query, BadRequestException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { NATS_SERVICE} from 'src/config';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { PaginationDto } from 'src/common/pagination.dto';
import { catchError} from 'rxjs';


@Controller('products')
export class ProductsController {
  constructor(
    @Inject(NATS_SERVICE)
    private readonly client: ClientProxy    
  ) {}

  @Post()
  create(@Body() createProductDto: CreateProductDto) {
    return this.client.send({cmd:'create_product'}, createProductDto)
    
  }

  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.client.send({cmd:'find_all_products'}, paginationDto);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
     
    return  this.client.send({cmd:'find_one_product'}, {id}).pipe(
      catchError((err)=>{
        throw new RpcException(err)
      })
     )  
  }
 

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.client.send({cmd:'update_product'},{
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
    return this.client.send({cmd:'delete_product'}, {id})
      .pipe(
        catchError((err)=>{
          throw new RpcException(err)
        })
      )
  }
}
