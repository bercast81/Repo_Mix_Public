import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Item } from 'src/items/entities/item.entity';
import { ItemsService } from 'src/items/items.service';
import { User } from 'src/user/entities/user.entity';
import { UserService } from 'src/user/user.service';
import { Repository } from 'typeorm';
import { SEED_ITEMS, SEED_USERS } from './data/seed.data';

@Injectable()
export class SeedService {

    private isProd: boolean

    constructor(
        private readonly configService: ConfigService,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(Item)
        private readonly itemRepository: Repository<Item>,
        private readonly  userService: UserService,
        private readonly itemService: ItemsService
    ){
        this.isProd = configService.get('STATE') === 'prod'
    }

    async executeSeed(){
        if(this.isProd){
            throw new UnauthorizedException('We can not run SEED on Prod')
        }

        await this.deleteDB()
        const user= await this.loadUsers()
        await this.loadItems(user)

        return true
    }

    async deleteDB(){
        await this.itemRepository.createQueryBuilder('items')
            .delete()
            .where({})
            .execute()

        await this.userRepository.createQueryBuilder('users')
            .delete()
            .where({})
            .execute()
    }

    async loadUsers(): Promise<User>{
        const users: User[]= []
        for (const user of SEED_USERS){
             const createdUser = await this.userService.create(user)
            users.push(createdUser!)
        }

        return users[0]
    }

    async loadItems(user: User): Promise<void> {
    const itemsPromises: Promise<Item>[] = [];

    for (const item of SEED_ITEMS) {
    const cleanItem = {
        ...item,
        quantityUnits: item.quantityUnits ?? undefined, // convierte null → undefined
    };

    itemsPromises.push(this.itemService.create(cleanItem, user));
}
    await Promise.all(itemsPromises);
}
}
