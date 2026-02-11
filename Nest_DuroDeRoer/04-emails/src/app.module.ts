import { Module } from '@nestjs/common';
import { EmailsModule } from './emails/emails.module';
import { SERVICES } from './config/email.config';
import { ConfigModule } from '@nestjs/config';


@Module({
  imports: [
    EmailsModule.register({
    from: "meikakuservices@gmail.com",
    password: "dvik zvoc rdio rxjw",
    service: SERVICES.GMAIL
  })],
  controllers: [],
  providers: [],
})
export class AppModule {}
