import { ObjectType, Field, ID, Float } from '@nestjs/graphql';
import { ListItem } from 'src/list-items/entities/list-item.entity';
import { User } from 'src/user/entities/user.entity';
import { Column, Entity, Index, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@ObjectType()
@Entity()
export class Item {
  @PrimaryGeneratedColumn('uuid')
  @Field(() => ID)
  id: string

  @Column()
  @Field(()=> String)
  name: string

  @Column()
  @Field(()=> String)
  category: string

  @Column({nullable: true})
  @Field(()=> String, {nullable: true})
  quantityUnits?: string

  @ManyToOne( () => User, (user) => user.items, { nullable: false, lazy: true })
  @Index('userId-index')
  @Field( () => User )
  user: User;

  @OneToMany(() => ListItem, (listItem) => listItem.item, { lazy: true })
  @Field( () => [ListItem] )
  listItem: ListItem[] 
}
