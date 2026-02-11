import { BadRequestException, ConflictException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { Repository, UpdateResult } from 'typeorm';
import { StockDto } from './dto/stock.dto';

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
      console.log(error)
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

  async updateStock(s: StockDto){
    const product = await this.findOne(s.id)
    if(product.deleted) throw new BadRequestException('El producto ha sido borrado') 
    
    const rows: UpdateResult= await this.productRepository.update(
      {id: s.id},
      {stock: s.stock}
    )
  }

  
}
