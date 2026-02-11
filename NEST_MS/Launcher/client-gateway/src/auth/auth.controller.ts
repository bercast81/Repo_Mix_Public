import { Body, Controller, Get, Inject, Post, Req, Request, UseGuards } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { NATS_SERVICE } from 'src/config';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { catchError } from 'rxjs';
import { AuthGuard } from './guards/auth.guard';
import { User } from './guards/decorators/user.decorator';
import { CurrentUser } from './guards/interfaces/user.interface';
import { Token } from './guards/decorators/token.decorator';


@Controller('auth')
export class AuthController {
  constructor( @Inject(NATS_SERVICE)
      private readonly client: ClientProxy  ) {}

  @Post('register')
  registerUser(@Body() registerUserDto: RegisterUserDto){
    return this.client.send('auth.register.user', registerUserDto)
    .pipe(
      catchError(error=> {
        throw new RpcException(error)
      })
    )
  }

  @Post('login')
  loginUser(@Body() loginUserDto: LoginUserDto){
    return this.client.send('auth.login.user', loginUserDto)
      .pipe(
        catchError(error=>{
          throw new RpcException(error)
        })
      )
  }
  
  @UseGuards(AuthGuard)
  @Get('verify')
  verifyToken(@User() user: CurrentUser, @Token() token: any){
   return {user,token}
  }
}
