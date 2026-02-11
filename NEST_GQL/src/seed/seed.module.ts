import { Module } from '@nestjs/common';
import { SeedService } from './seed.service';
import { SeedResolver } from './seed.resolver';
import { ItemsModule } from 'src/items/items.module';
import { UserModule } from 'src/user/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports:[ConfigModule,ItemsModule, UserModule],
  providers: [SeedResolver, SeedService],
})
export class SeedModule {}
