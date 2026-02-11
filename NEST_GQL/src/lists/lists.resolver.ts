import { Resolver, Query, Mutation, Args, Int, ResolveField, Parent, ID } from '@nestjs/graphql';
import { ListsService } from './lists.service';
import { List } from './entities/list.entity';
import { CreateListInput } from './dto/create-list.input';
import { UpdateListInput } from './dto/update-list.input';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { User } from 'src/user/entities/user.entity';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { PaginationArgs } from 'src/common/dto/pagination.args';
import { SearchArgs } from 'src/common/dto/search.args';
import { ListItemsService } from 'src/list-items/list-items.service';
import { ListItem } from 'src/list-items/entities/list-item.entity';

@Resolver(() => List)
@UseGuards(JwtAuthGuard)
export class ListsResolver {
  constructor
  (private readonly listsService: ListsService,
   private readonly listItemsService: ListItemsService
  ) {}

  @Mutation(() => List)
  createList(
  @Args('createListInput') createListInput: CreateListInput,
  @CurrentUser() user: User
  ): Promise<List> {
    return this.listsService.create(createListInput, user);
  }

  @Query(() => [List], { name: 'lists' })
  findAll(
    @CurrentUser() user: User,
    @Args() paginationArgs: PaginationArgs,
    @Args() searchArgs: SearchArgs
  ): Promise<List[]> {
    return this.listsService.findAll(user, paginationArgs, searchArgs);
  }

  @Query(() => List, { name: 'list' })
  findOne(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: User
  ): Promise<List> {
    return this.listsService.findOne(id, user);
  }

  @Mutation(() => List)
  updateList(
    @Args('updateListInput') updateListInput: UpdateListInput,
    @CurrentUser() user: User
  ): Promise<List> {
    return this.listsService.update(updateListInput.id, updateListInput, user);
  }

  @Mutation(() => List)
  removeList(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: User
) {
    return this.listsService.remove(id, user);
  }

  @ResolveField(()=> [ListItem], {name: 'items'})
  async getListItems(
    @Parent() list : List,
    @Args() paginationArgs: PaginationArgs,
    @Args() searchArgs: SearchArgs
  ): Promise<ListItem[]>{
    return this.listItemsService.findAll(list, paginationArgs, searchArgs)
  }

  @ResolveField(()=> Number, {name: 'totalItems'})
  async countListItemsByList(
    @Parent() list: List
  ): Promise<number>{
    return this.listItemsService.countListItemsByList(list)
  }
}
