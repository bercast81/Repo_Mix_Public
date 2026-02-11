import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateItemInput } from './dto/create-item.input';
import { UpdateItemInput } from './dto/update-item.input';
import { InjectRepository } from '@nestjs/typeorm';
import { Item } from './entities/item.entity';
import { Like, Repository } from 'typeorm';
import { User } from 'src/user/entities/user.entity';
import { PaginationArgs } from 'src/common/dto/pagination.args';
import { SearchArgs } from 'src/common/dto/search.args';

@Injectable()
export class ItemsService {

  constructor(
    @InjectRepository(Item)
    private readonly itemRepository: Repository<Item>
  ){}


 async create(createItemInput: CreateItemInput, user: User): Promise<Item> {
    const newItem = this.itemRepository.create({...createItemInput, user})
    return await this.itemRepository.save(newItem)
  }

  async findAll(user: User, paginationArgs: PaginationArgs, searchArgs: SearchArgs): Promise<Item[]> {
    
    const {limit, offset}= paginationArgs
    const {search} = searchArgs

    const queryBuilder = this.itemRepository.createQueryBuilder()
                          .take(limit)
                          .skip(offset)
                          .where('"userId" = :userId', {userId: user.id})

    if(search){
      queryBuilder.andWhere('LOWER(name) like :name', {name: `%${search.toLowerCase()}%`})
    }
    
    return queryBuilder.getMany()

    // return this.itemRepository.find({
    //   take: limit,
    //   skip: offset,
    //   where:{
    //     user:{
    //       id: user.id
    //     },
    //     name: Like(`%${search?.toLowerCase()}%`)
    //   }
    // })

  }

  async findOne(id: string, user: User): Promise<Item> {
                            //de esta manera tienen que cumplirse las dos condiciones
    const item = await this.itemRepository.findOneBy({id, user:{id: user.id}})
    if(!item) throw new NotFoundException(`El item con id ${id} no se encuentra`)
    return item
  }

  async update(id: string, updateItemInput: UpdateItemInput, user: User): Promise<Item> {
    //si no usara el lazy en true podría hacerlo así con el preload
    //const item = await this.itemRepository.preload({...updateItemInput, user})

    await this.findOne(id, user)//si el flujo continua es que tengo el item
    const item = await this.itemRepository.preload(updateItemInput)
    if(!item) throw new NotFoundException(`El item con id ${id} no se encuentra`)
    return await this.itemRepository.save(item)
  }

  async remove(id: string, user: User): Promise<Item> {
    const item = await this.findOne(id, user)
    await this.itemRepository.remove(item)
    return {...item, id}
  }

  itemCountByUser(user: User){
    return this.itemRepository.count({
      where:{
        user:{
          id: user.id
        }
      }
    })
  }
}
