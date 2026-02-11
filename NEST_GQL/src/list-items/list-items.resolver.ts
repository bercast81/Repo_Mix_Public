import { Resolver, Query, Mutation, Args, Int, ID } from '@nestjs/graphql';
import { ListItemsService } from './list-items.service';
import { ListItem } from './entities/list-item.entity';
import { CreateListItemInput } from './dto/create-list-item.input';
import { UpdateListItemInput } from './dto/update-list-item.input';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Resolver(() => ListItem)
@UseGuards(JwtAuthGuard)
export class ListItemsResolver {
  constructor(private readonly listItemsService: ListItemsService) {}

  @Mutation(() => ListItem)
  createListItem(
    @Args('createListItemInput') createListItemInput: CreateListItemInput): Promise<ListItem> {
    return this.listItemsService.create(createListItemInput);
  }



  @Query(() => ListItem, { name: 'listItem' })
  findOne(@Args('id', { type: () => ID }) id: string): Promise<ListItem> {
    return this.listItemsService.findOne(id);
  }

  @Mutation(() => ListItem)
  updateListItem(
    @Args('updateListItemInput') updateListItemInput: UpdateListItemInput): Promise<ListItem> {
    return this.listItemsService.update(updateListItemInput.id, updateListItemInput);
  }

}
