import { Resolver, Query, Mutation, Args, Int, ID, ResolveField, Parent } from '@nestjs/graphql';
import { UserService } from './user.service';
import { User } from './entities/user.entity';
import { ValidRolesArgs } from './dto/args/valid-roles.args';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { ValidRoles } from 'src/auth/enums/valid-roles.enum';
import { ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { UpdateUserInput } from './dto/update-user.input';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { AuthGuard } from '@nestjs/passport';
import { ItemsService } from 'src/items/items.service';
import { Item } from 'src/items/entities/item.entity';
import { PaginationArgs } from 'src/common/dto/pagination.args';
import { SearchArgs } from 'src/common/dto/search.args';

@Resolver(() => User)
@UseGuards(JwtAuthGuard)
export class UserResolver {
  constructor(private readonly userService: UserService,
              private readonly itemService: ItemsService
  ) {}

  @Query(() => [User], { name: 'users' })
  async findAll(
    @Args() validRoles: ValidRolesArgs, //al ser un array validRoles no va dentro del paréntesis de @Args
    @CurrentUser([ValidRoles.admin, ValidRoles.superUser, ValidRoles.user]) user: User): Promise<User[]> {
    
      return this.userService.findAll(validRoles.roles);
  }

  @Query(() => User, { name: 'user' })
  findOne(@Args('id', { type: () => ID}, ParseUUIDPipe) id: string): Promise<User> {
    return this.userService.findOneById(id);
  }

  @Mutation(()=> User, {name: 'updateUser'})
  async updateUser(
    @Args('updateUserInput') UpdateUserInput: UpdateUserInput,
    @CurrentUser([ValidRoles.admin]) user: User): Promise<User | undefined>{
      return this.userService.update(UpdateUserInput.id, UpdateUserInput, user)
    }

  @Mutation(()=> User)
  blockUser(
    @Args('id', {type: ()=> ID}, ParseUUIDPipe) id: string,
    @CurrentUser([ValidRoles.admin]) user: User): Promise<User>{
    return this.userService.blockUser(id, user)
  }

  @ResolveField(()=> [Item], {name: 'items'})
  async getItemsByUser(
    @CurrentUser([ValidRoles.admin]) adminUser: User,
    @Parent() user: User,
    @Args() paginationArgs: PaginationArgs,
    @Args() searchArgs: SearchArgs
  ){
    return this.itemService.findAll(user, paginationArgs, searchArgs)
  }

  @ResolveField(()=> Int, {name: 'itemCount'})
  async itemCount(
    @CurrentUser([ValidRoles.admin]) adminUser: User,
    @Parent() user: User
  ): Promise<number>{
    return this.itemService.itemCountByUser(user)
  }

}
