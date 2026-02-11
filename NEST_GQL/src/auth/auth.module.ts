import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthResolver } from './auth.resolver';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { UserModule } from 'src/user/user.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports:[ ConfigModule,
            PassportModule.register({defaultStrategy: 'jwt'}),

      JwtModule.registerAsync({
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService)=>({
          secret: configService.get('JWT_SECRET'),
          signOptions:{
            expiresIn: '4h'
          }
        })
      }), 
      UserModule],
  providers: [AuthResolver, AuthService, JwtStrategy],
  exports: [JwtModule]
})
export class AuthModule {}
