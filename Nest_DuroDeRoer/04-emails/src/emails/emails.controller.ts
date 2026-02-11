import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { EmailsService } from './emails.service';
import { CreateEmailDto } from './dto/create-email.dto';
import { UpdateEmailDto } from './dto/update-email.dto';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller('emails')
export class EmailsController {
  constructor(private readonly emailsService: EmailsService) {}

  @Post()
  @ApiOperation({
    description: 'Envía un email'
  })
  @ApiBody({
    description: 'envía un email usando createEmailDto',
    type: CreateEmailDto,
    examples:{
      ejemplo1:{
        value: {
        subject: "Test correo",
        body: "<h1>Hola mundo!</h1>",
        receivers:[
    {email: "meikakuservices@gmail.com"}
      ]
    }
   }
  }})
  @ApiResponse({
    status: 201,
    description: 'Correo enviado correctamente'
  })
  createEmail(@Body() createEmailDto: CreateEmailDto) {
    return this.emailsService.sendEmail(createEmailDto);
  }

}
