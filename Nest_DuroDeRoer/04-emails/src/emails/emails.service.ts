import { Inject, Injectable } from '@nestjs/common';
import { CreateEmailDto } from './dto/create-email.dto';
import { EmailConfig } from 'src/config/email.config';
import * as nodemailer from 'nodemailer'
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailsService {
  
  private transporter

  constructor(
    @Inject('CONFIG_OPTIONS')
    private options: EmailConfig,
  
  ){
     this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.options.from,
        pass: this.options.password,
      },
       tls: {
        rejectUnauthorized: false, // 👈 Esto evita el error del certificado autofirmado
      },
    });
  }

    async sendEmail(message: CreateEmailDto) {

    const to = message.receivers.map(e=> e.email)

    await this.transporter.sendMail({
      from: this.options.from,
      to,
      subject: message.subject,
      html: message.body ,
    });
  }


}
