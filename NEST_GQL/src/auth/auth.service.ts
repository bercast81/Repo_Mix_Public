import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { LoginInput } from './dto/login.input';
import { SignupInput } from './dto/signup.input';
import { InjectRepository } from '@nestjs/typeorm';
import { UserService } from 'src/user/user.service';
import { JwtService } from '@nestjs/jwt';
import { AuthResponse } from './types/auth-response';
import * as bcrypt from 'bcrypt'
import { User } from 'src/user/entities/user.entity';



@Injectable()
export class AuthService {

  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService
  ){}


  private getJwtToken(userId: string){
    return this.jwtService.sign({id: userId})
  }

  async signup(signupInput: SignupInput): Promise<AuthResponse>{
    const user= await this.userService.create(signupInput)
    if(!user) throw new BadRequestException("No se ha podido crear el usuario")
    const token = this.getJwtToken(user.id)
    return {token, user}
  }

  async login(loginInput: LoginInput){
    const {email, password} = loginInput
    const user = await this.userService.findOneByEmail(email)

    if(!user) throw new NotFoundException('User not found')

    if(!bcrypt.compareSync(password, user.password!)){
      throw new BadRequestException("Password don't match")
    }

    const token = this.getJwtToken(user.id)
    return {token, user}
  }

  async validateUser(id: string){
    const user = await this.userService.findOneById(id)
    if(!user.isActive) throw new UnauthorizedException('User is inactive') 

    const {password, ...rest} = user //elimino el password del retorno

    return rest
  }

  revalidateToken(user: User):AuthResponse{
    const token = this.getJwtToken(user.id)
    return {token, user}
  }
}
