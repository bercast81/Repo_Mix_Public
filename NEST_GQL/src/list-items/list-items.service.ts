import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateListItemInput } from './dto/create-list-item.input';
import { UpdateListItemInput } from './dto/update-list-item.input';
import { InjectRepository } from '@nestjs/typeorm';
import { ListItem } from './entities/list-item.entity';
import { Repository } from 'typeorm';
import { List } from 'src/lists/entities/list.entity';
import { PaginationArgs } from 'src/common/dto/pagination.args';
import { SearchArgs } from 'src/common/dto/search.args';

@Injectable()
export class ListItemsService {

  constructor(
    @InjectRepository(ListItem)
    private readonly listItemsRepository: Repository<ListItem>
  ){}

  async create(createListItemInput: CreateListItemInput): Promise<ListItem> {
    const {itemId, listId, ...rest} = createListItemInput
    const newListItem = await this.listItemsRepository.create({
      ...rest,
      item: {id: itemId},
      list: {id: listId}
    })

    await this.listItemsRepository.save(newListItem)

    return this.findOne(newListItem.id)
  }

  async findAll(list: List, paginationArgs: PaginationArgs, searchArgs: SearchArgs
  ) : Promise<ListItem[]> {
    const {limit, offset} = paginationArgs
    const {search} = searchArgs

    const queryBuilder = this.listItemsRepository.createQueryBuilder('listItem')
            .innerJoin('listItem.item', 'item')
            .take(limit)
            .skip(offset)
            .where(`"listId" = :listId`, {listId: list.id})
      if(search){
        queryBuilder.andWhere('LOWER(item.name) like :name', {name: `%${search.toLowerCase()}%`})
      }

      return await queryBuilder.getMany()
  }

  async countListItemsByList( list: List): Promise<number>{
    return this.listItemsRepository.count({
      where: {list: {id: list.id}}
    })
  }

  async findOne(id: string): Promise<ListItem> {
      const listItem = await this.listItemsRepository.findOneBy({id})
      if(!listItem) throw new NotFoundException(`Item with id ${id} not found`)
      return listItem
  }

 async update(id: string, updateListItemInput: UpdateListItemInput): Promise<ListItem> {
  const { listId, itemId, id: _, ...rest } = updateListItemInput;

  // Construimos un objeto con los campos a actualizar
  const updateData: any = { ...rest };

  if (listId) updateData.list = { id: listId };
  if (itemId) updateData.item = { id: itemId };

  await this.listItemsRepository
    .createQueryBuilder()
    .update()
    .set(updateData)
    .where('"id" = :id', { id })
    .execute();

  return this.findOne(id);
}

}
