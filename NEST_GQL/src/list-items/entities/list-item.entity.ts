import { ObjectType, Field, Int, ID } from '@nestjs/graphql';
import { Item } from 'src/items/entities/item.entity';
import { List } from 'src/lists/entities/list.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';

@ObjectType()
@Entity({name: 'listItems'})
//los constrainghts son reglas de validación para la DB, primero se añade la entidad y luego el decorador 
@Unique('listItem-item', ['list', 'item'])
export class ListItem {
  @PrimaryGeneratedColumn('uuid')
  @Field(()=> ID)
  id: string

  @Column({type: 'numeric'})
  @Field(()=> Number)
  quantity: number


  @Column({type: 'boolean'})
  @Field(()=> Boolean)
  completed: boolean

  @ManyToOne(()=> List, (list)=> list.listItem, {lazy: true})
  @Field(()=> List) 
  list: List
  
  @ManyToOne(()=> Item, (item)=> item.listItem, {lazy: true} )
  @Field(()=>Item)
  item: Item
}
