import { Resolver, Mutation, Args, Query} from '@nestjs/graphql';
import { AuthService } from './auth.service';

import { AuthResponse } from './types/auth-response';
import { SignupInput } from './dto/signup.input';
import { LoginInput } from './dto/login.input';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { User } from 'src/user/entities/user.entity';
import { CurrentUser } from './decorators/current-user.decorator';
import { ValidRoles } from './enums/valid-roles.enum';



@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

 @Mutation(()=> AuthResponse, {name: 'signup'})
 async signup(@Args('signupInput') signupInput: SignupInput):Promise<AuthResponse>{
  return this.authService.signup(signupInput)
 }

 @Mutation(()=> AuthResponse, {name: 'login'})
 async login(@Args('loginInput')loginInput: LoginInput)/*: Promise<AuthResponse>*/{
  return this.authService.login(loginInput)
 }

  @Query(()=> AuthResponse, {name: 'revalidate'})
  @UseGuards(JwtAuthGuard)
  revalidateToken(@CurrentUser([ValidRoles.user])user: User): AuthResponse{
   return this.authService.revalidateToken(user)
  }
}
