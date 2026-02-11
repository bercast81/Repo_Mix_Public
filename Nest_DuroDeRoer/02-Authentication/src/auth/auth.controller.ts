import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthCredentialsDto } from './dto/create-auth.dto';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({
    description: "Nos loguea en la app"
  })
  @ApiBody({
    description: "Nos logueamos usando las credenciales",
    type: AuthCredentialsDto,
    examples:{
      ejemplo:{
        value:{
          email: "pedro@gmail.com",
          password: "123456"
        }
      }
    }
  })
  @ApiBearerAuth('jwt')
  @ApiResponse({
    status: 401,
    description: 'credenciales inválidas'
  })
  @ApiResponse({
    status: 201,
    description: 'Login correcto'
  })
  login(@Body() authCredentialsDto: AuthCredentialsDto) {
    return this.authService.login(authCredentialsDto);
  }
}
