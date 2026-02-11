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

  @Get()
  findAll() {
    return this.productService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productService.update(+id, updateProductDto);
  }

   @Patch('restore-product/:id')
  restoreProduct(@Param('id') id: string) {
    return this.productService.restoreProduct(+id);
  }

  @Patch('stock')
  updateStock(@Body() stock: StockDto){
    return this.productService.updateStock(stock)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productService.remove(+id);
  }
}
