import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserResolver } from './user.resolver';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { ItemsModule } from 'src/items/items.module';

@Module({
  imports:[TypeOrmModule.forFeature([User]), ItemsModule],
  providers: [UserResolver, UserService],
  exports:[UserService, TypeOrmModule]
})
export class UserModule {}
