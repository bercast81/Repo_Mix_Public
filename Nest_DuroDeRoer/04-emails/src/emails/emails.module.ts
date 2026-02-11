import { DynamicModule, Module } from '@nestjs/common';
import { EmailsService } from './emails.service';
import { EmailsController } from './emails.controller';
import { EmailConfig } from 'src/config/email.config';

@Module({
  controllers: [EmailsController],
  providers: [EmailsService],
})
export class EmailsModule {
  static register(options: EmailConfig): DynamicModule{
    return{
      module: EmailsModule,
      controllers:[EmailsController],
      providers:[
        {
          provide: 'CONFIG_OPTIONS',
          useValue: options
        }
      ]
    }
  }
}
