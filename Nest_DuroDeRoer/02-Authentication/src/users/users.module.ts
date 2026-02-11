import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { MongoConnectionModule } from 'src/modules/mongo-connection/mongo-connection.module';
import { MongoConnectionService } from 'src/modules/mongo-connection/mongo-connection.service';
import { IUser } from './interfaces/user.interface';
import { userSchema } from './schema/user.schema';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports:[PassportModule.register({defaultStrategy: "jwt"}),
    MongoConnectionModule],
  controllers: [UsersController],
  providers: [UsersService, 
    {
      provide: 'USER_MODEL',
      useFactory: (db:MongoConnectionService)=> db.getConnection().model<IUser>('user', userSchema, 'users'),
      inject: [MongoConnectionService]
    }
  ],
  exports: [UsersService]
})
export class UsersModule {}
