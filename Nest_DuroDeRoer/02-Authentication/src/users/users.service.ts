import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Model } from 'mongoose';
import { IUser } from './interfaces/user.interface';

@Injectable()
export class UsersService {

  constructor(
    @Inject('USER_MODEL')
    private userModel: Model<IUser>
  ){}


  async createUser(createUserDto: CreateUserDto) {
    const userExists = await this.userModel.findOne({email: createUserDto.email})
    if(userExists) throw new ConflictException("El usuario ya existe")

    const user = new this.userModel(createUserDto)

    await user.save()

    user.password = ""
    
    return user
  }

  getUsers() {
    return this.userModel.find({}, {password: 0});
  }

  async findUserByEmail(email: string) {
   return await this.userModel.findOne({email: email.toLowerCase()}) 
  }

  async populateUsers(){

    await this.userModel.deleteMany()

    const users: CreateUserDto[]=[
      {
        email: "laura@gmail.com",
        password: "123456"
      },
      {
        email: "pedro@gmail.com",
        password: "123456"
      },
      {
        email: "maria@gmail.com",
        password: "123456"
      },
      {
        email: "jose@gmail.com",
        password: "123456"
      },

    ]

    for (const user of users){
      const userExists = await this.findUserByEmail(user.email)
      if(userExists) throw new ConflictException("El usuario ya existe")
      await this.createUser(user)
    }

    return 'Populate users OK'
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
