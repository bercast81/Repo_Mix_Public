import { Module } from '@nestjs/common';
import { CronModule } from './cron/cron.module';

@Module({
  imports: [CronModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
