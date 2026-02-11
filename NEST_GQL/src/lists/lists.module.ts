import { Module } from '@nestjs/common';
import { ListsService } from './lists.service';
import { ListsResolver } from './lists.resolver';
import { ListItemsModule } from 'src/list-items/list-items.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { List } from './entities/list.entity';

@Module({
  imports: [
  TypeOrmModule.forFeature([List]), 
  ListItemsModule],
  providers: [ListsResolver, ListsService],
  exports:[TypeOrmModule, ListsService]
})
export class ListsModule {}
