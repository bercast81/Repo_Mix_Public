import { Module } from '@nestjs/common';
import { ListItemsService } from './list-items.service';
import { ListItemsResolver } from './list-items.resolver';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ListItem } from './entities/list-item.entity';

@Module({
  imports:[TypeOrmModule.forFeature([ListItem])],
  providers: [ListItemsResolver, ListItemsService],
  exports:[TypeOrmModule,ListItemsService]
})
export class ListItemsModule {}
