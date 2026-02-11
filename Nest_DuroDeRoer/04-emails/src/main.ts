import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.setGlobalPrefix('api/v1')
  
  app.useGlobalPipes(new ValidationPipe({whitelist: true, transform: true}))

    const config = new DocumentBuilder()
    .setTitle('Emails')
    .setDescription('API Emails')
    .setVersion('1.0')
    .addTag('emails')
    .build()

    const document = SwaggerModule.createDocument(app,config)
    SwaggerModule.setup('swagger', app, document)

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
