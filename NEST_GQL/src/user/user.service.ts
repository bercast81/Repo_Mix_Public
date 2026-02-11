import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { SignupInput } from 'src/auth/dto/signup.input';
import * as bcrypt from 'bcrypt'
import { UpdateUserInput } from './dto/update-user.input';
import { ValidRoles } from 'src/auth/enums/valid-roles.enum';

@Injectable()
export class UserService {

  private logger = new Logger('UsersService')

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
  ){}

  async create(signupInput: SignupInput): Promise<User | undefined>{

    try {
      const newUser = this.userRepository.create({
        ...signupInput,
        password: bcrypt.hashSync(signupInput.password, 10)
      })

      return await this.userRepository.save(newUser)
    } catch (error) {
      this.handleDbErrors(error)
    }
  }

  async findAll(roles: ValidRoles[]) {
    if (roles.length === 0){
      return this.userRepository.find({
        relations:{
          lastUpdateBy: true
        }
      })
    }

    return this.userRepository.createQueryBuilder('user')
      .andWhere('user.roles && ARRAY[:...roles]', { roles })
      .setParameter('roles', roles)
      .getMany()
  }

  async findOneByEmail(email: string): Promise<User| undefined>{
    try {
      return await this.userRepository.findOneByOrFail({email})
    } catch (error) {
       throw new NotFoundException(`El cliente con id ${email} no se encuentra`)
    }
  }

  async findOneById(id: string): Promise<User> {
    try {
      return await this.userRepository.findOneByOrFail({id})
      
    } catch (error) {
      throw new NotFoundException(`El cliente con id ${id} no se encuentra`)
    }
  }

  async update(id: string, updateUserInput: UpdateUserInput, updateBy: User): Promise<User | undefined>{
    try {
      const user = await this.userRepository.preload({
        ...updateUserInput,
        id
      })

      if(!user) throw new NotFoundException("User not found")

      user.lastUpdateBy = updateBy  //relación ManyToOne en user.entity
      return await this.userRepository.save(user)

    } catch (error) {
      this.handleDbErrors(error)
    }
  }

  async blockUser(id: string, adminUser: User): Promise<User>{
    const userToBlock = await this.findOneById(id)
    userToBlock.isActive = false
    userToBlock.lastUpdateBy = adminUser
    return await this.userRepository.save(userToBlock)
  }

  handleDbErrors(error: any){
    if(error.code === '23505'){
      throw new BadRequestException(error.detail.replace('Key', ''))
    }
    if(error.code === 'error-001'){
      throw new BadRequestException(error.detail.replace('Key', ''))
    }
    this.logger.error(error)
    throw new InternalServerErrorException('Check server logs')
  }


}
