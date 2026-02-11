import { Injectable } from '@nestjs/common';
import { ProductsService } from 'src/products/products.service';
import { initialData } from './data/data';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/auth/entities/user.entity';
import { Repository } from 'typeorm';
import { Product } from 'src/products/entities/product.entity';

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
