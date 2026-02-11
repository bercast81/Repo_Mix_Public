import { ObjectType, Field, Int, ID } from '@nestjs/graphql';
import { ListItem } from 'src/list-items/entities/list-item.entity';
import { User } from 'src/user/entities/user.entity';
import { Column, Entity, Index, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@ObjectType()
@Entity({name: 'lists'})
export class List {

  @PrimaryGeneratedColumn('uuid')
  @Field(()=> ID)
  id: string

  @Column()
  @Field(()=> String)
  name: string

  @ManyToOne(()=> User, (user)=> user.lists, {nullable: false, lazy: true})
  @Index('userId-list-index')
  @Field(()=> User)
  user: User

  @OneToMany(()=> ListItem, (listItem)=> listItem.list, {lazy: true})
  //@Field(()=> [ListItem])
  listItem: ListItem[]
}
