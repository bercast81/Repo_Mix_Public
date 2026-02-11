import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true,transform: true}))
  app.setGlobalPrefix('api/v1')

  const config = new DocumentBuilder()
    .setTitle('Authentication')
    .setDescription('API Authentication')
    .setVersion('1.0')
    .addTag('auth')
    .build()

    const document = SwaggerModule.createDocument(app,config)
    SwaggerModule.setup('swagger', app, document)

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
