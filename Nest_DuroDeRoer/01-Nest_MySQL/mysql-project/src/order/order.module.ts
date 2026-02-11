import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { ClientModule } from 'src/client/client.module';
import { ProductModule } from 'src/product/product.module';

@Module({
  imports:[TypeOrmModule.forFeature([Order]),
        ClientModule,
        ProductModule
      ],
  controllers: [OrderController],
  providers: [OrderService],
})
export class OrderModule {}
