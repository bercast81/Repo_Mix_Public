import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import configurationMongo from './configuration/configuration-mongo'
import configurationAuth from './configuration/configuration-auth';



@Module({
  imports: [
  ConfigModule.forRoot({
  load: [configurationMongo, configurationAuth],
  envFilePath: `.env.${process.env.NODE_ENV || 'development'}`, 
  isGlobal: true
}),
  UsersModule,
  AuthModule, 
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
