import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { envs } from './config/envs';


@Module({
  imports: [AuthModule,
      ConfigModule.forRoot({
      isGlobal: true, 
    }),
    JwtModule.register({
      global: true,
      secret: envs.secretJwt,
      signOptions: {expiresIn: '3d'}
    })
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
