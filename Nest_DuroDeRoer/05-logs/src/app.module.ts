import { Module } from '@nestjs/common';
import { CronModule } from './cron/cron.module';
import { LoggerModule } from './logger/logger.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [CronModule, LoggerModule, ScheduleModule.forRoot()],
  controllers: [],
  providers: [],
})
export class AppModule {}
