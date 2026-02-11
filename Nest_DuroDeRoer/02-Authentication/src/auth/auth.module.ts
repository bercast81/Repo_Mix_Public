import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategyService } from './strategy/jwt-strategy.service';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports:[
    PassportModule.register({defaultStrategy: "jwt"}),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService:ConfigService)=>{
        return{
          secret: configService.get('auth.secretKey'),
          signOptions: {expiresIn: '2h'}
        }
      },
      inject: [ConfigService]
    }),
    UsersModule

  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategyService],
})
export class AuthModule {
  
}
