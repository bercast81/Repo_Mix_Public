import { BadRequestException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt'
import { LoginUserDto } from './dto/login-user.dto';
import { JwtService } from '@nestjs/jwt';
import { JwtPayloadInterface } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService
  ){}

  async create(createUserDto: CreateUserDto) {

    try {
      const {password, ...userData} = createUserDto
    
    const user = this.userRepository.create({
      ...userData,
      password: bcrypt.hashSync(password, 12)
    })
    
    await this.userRepository.save(user)

    return{
      ...user,
      password: null,
      token: this.getJwt({id: user.id})
    }
      
    
    } catch (error) {
      this.handleDbError(error)  
    }
  }

  async loginUser(loginUserDto: LoginUserDto){
        const {email, password} = loginUserDto

        const user = await this.userRepository.findOne({
          where: {email},
          select: {email: true, password: true, id: true}
        })

        if(!user){
          throw new UnauthorizedException('Credentials are invalid')
        }

        if(!bcrypt.compareSync(password, user.password)){
          throw new UnauthorizedException('Password is not valid')
        }

        return {
          ...user,
          password: null,
          token: this.getJwt({id: user.id})
        }
  }

  findAll() {
    return `This action returns all auth`;
  }

  findOne(id: number) {
    return `This action returns a #${id} auth`;
  }

  update(id: number, updateAuthDto: UpdateAuthDto) {
    return `This action updates a #${id} auth`;
  }

  remove(id: number) {
    return `This action removes a #${id} auth`;
  }

  handleDbError(error: any): void{
    if(error.code === '23505'){
      throw new BadRequestException(error.detail)
    }

    console.log(error)
    throw new InternalServerErrorException('Check logs')
  }

  private getJwt(payload: JwtPayloadInterface){
    const token = this.jwtService.sign(payload)
    return token
  }

  async checkAuthStatus(user: User){
    return {
      ...user,
      token: this.getJwt({id: user.id})
    }
  }
}




