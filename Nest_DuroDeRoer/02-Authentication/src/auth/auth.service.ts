import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { AuthCredentialsDto } from './dto/create-auth.dto';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt'
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { JwtService } from '@nestjs/jwt';


@Injectable()
export class AuthService {

  constructor(
    private readonly usersService: UsersService,
    private jwtService: JwtService
  ){}

async validateUser(credentials: AuthCredentialsDto){
  const user = await this.usersService.findUserByEmail(credentials.email)
  
  if(!user) throw new NotFoundException("No se encuentra el usuario")
  
  const passwordOk = await bcrypt.compare(credentials.password, user.password)
  
  if(passwordOk){
    return user
  }

  return null
}

async login(authCredentials: AuthCredentialsDto){
   const user = await this.validateUser(authCredentials)

   if(!user){
    throw new UnauthorizedException("Credenciales inválidas")
   }

   const payload: JwtPayload = {
    email: user.email
   }

   return {
    acessToken: this.jwtService.sign(payload)
   }
}

}
