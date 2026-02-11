import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductModule } from './product/product.module';
import { Product } from './product/entities/product.entity';
import { ClientModule } from './client/client.module';
import { Client } from './client/entities/client.entity';
import { Address } from './client/entities/address.entity';
import { ConfigService, ConfigModule} from '@nestjs/config';
import { OrderModule } from './order/order.module';
import * as Joi from 'joi'
import { Order } from './order/entities/order.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        HOST_DB: Joi.string().required(),
        PORT_DB: Joi.number().default(3306).required(),
        USERNAME_DB: Joi.string().required(),
        PASSWORD_DB: Joi.string().required(),
        NAME_DB: Joi.string().required()
      }),
    }),
    TypeOrmModule.forRootAsync({
      inject:[ConfigService],
      useFactory: (config:ConfigService)=>{
        return{
      type: 'mysql',
      host: config.get<string>('HOST_DB'),
      port: config.get<number>('PORT_DB'),
      username: config.get<string>('USERNAME_DB'),
      password: config.get<string>('PASSWORD_DB'),
      database: config.get<string>('NAME_DB'),
      entities: [Product, Client, Address, Order], 
      synchronize: true
        }
      }
    }),
    ProductModule,
    ClientModule,
    OrderModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
