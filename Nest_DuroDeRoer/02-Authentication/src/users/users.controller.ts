import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { AuthGuard } from '@nestjs/passport';


@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  createUser(@Body() createUserDto: CreateUserDto) {
    return this.usersService.createUser(createUserDto);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  getUsers() {
    return this.usersService.getUsers();
  }

  @Get(':email')
  findUserByEmail(@Body('email') email: string) {
    return this.usersService.findUserByEmail(email);
  }

  @Post('populate')
  populateUsers(){
    return this.usersService.populateUsers()
  }

  @Get('data-user')
  dataUser(@Request() req){
    console.log(req)
    return req.user
  }
}
