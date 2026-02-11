# 06 NEST DURO DE ROER - SUBIR ARCHIVOS

- Creo el proyecto con **nest new upload-files**
- Instalo @nestjs/swagger y swagger-ui-express class-validator class-transformer

~~~js
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
   
  app.useGlobalPipes(new ValidationPipe({ whitelist: true,transform: true}))
  app.setGlobalPrefix('api/v1')

  const config = new DocumentBuilder()
    .setTitle('Subir Archivos')
    .setDescription('Subir archivos al servidor')
    .setVersion('1.0')
    .addTag('uploadFiles')
    .build()

    const document = SwaggerModule.createDocument(app,config)
    SwaggerModule.setup('swagger', app, document)
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
~~~

- Instalo los tipos de multer (que viene nativo en Nest)

> npm i @types/multer

- Creo el modulo nest g res upload-file

~~~js
import { Module } from '@nestjs/common';
import { UploadFileService } from './upload-file.service';
import { UploadFileController } from './upload-file.controller';
import { MulterModule } from '@nestjs/platform-express';

@Module({
  imports: [MulterModule.register({
    dest: './upload'
  })],
  controllers: [UploadFileController],
  providers: [UploadFileService],
})
export class UploadFileModule {}
~~~

- En el upload-file.controller.ts

~~~js
 @Post()
@UseInterceptors(FileInterceptor('file'))
uploadFile(@UploadedFile() file: Express.Multer.File) {
  return this.uploadFileService.uploadFile(file);
}
~~~

- En el upload-file.service.ts

~~~js
import { Injectable } from '@nestjs/common';
import { CreateUploadFileDto } from './dto/create-upload-file.dto';
import { UpdateUploadFileDto } from './dto/update-upload-file.dto';

@Injectable()
export class UploadFileService {

  uploadFile(file: Express.Multer.File) {
    
    if(file){
      const response = {
        originalName: file.originalname,
        filename: file.filename
      }
      return response
    }
    return null
  }
}
~~~

## Subir varios archivos /Limitar el tamaño / Cambiar nombre del fichero

- El controller

~~~js
@Post()
@UseInterceptors(FileInterceptor('file'))
uploadFiles(@UploadedFile() files: Express.Multer.File[]) {
  return this.uploadFileService.uploadFiles(files);
}
~~~

- En el service

~~~js
uploadFiles(files: Express.Multer.File[]){
  const responses: { originalName: string, filename: string }[] = []

  for(const file of files){
    const fileUpload = this.uploadFile(file)
    if(fileUpload){
      responses.push(fileUpload)
    }
  }
  return responses
}
~~~

- Para limitar el tamaño y cambiar el nombre del fichero voy al FileUploadModule

~~~js
import { ConflictException, Module } from '@nestjs/common';
import { UploadFileService } from './upload-file.service';
import { UploadFileController } from './upload-file.controller';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';

@Module({
  imports: [MulterModule.register({
    limits:{
      fileSize: 2 * 1024 * 1024
    },
    fileFilter: function(req,file,cb){
      if(!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)){
        return cb(new ConflictException("Solo imágenes"), false)
      }
      cb(null, true) //necesario para aceptar el archivo
    },
    storage: diskStorage({
      destination: function(req,file,cb){
        cb(null, './upload')
      },
      filename: function(req,file,cb){
        let fileNameParts = file.originalname.split('.')
        fileNameParts = fileNameParts.slice(0, fileNameParts.length -1)
        const filename= fileNameParts.join('.')

        if(file.mimetype){
          let ext= file.mimetype.split('/')[1]
          cb(null, filename+'-'+Date.now()+ '.'+ ext)
        }else{
          cb(null, filename+'-'+Date.now())
        }
      }
    })
    
  
  })],
  controllers: [UploadFileController],
  providers: [UploadFileService],
})
export class UploadFileModule {}
~~~

## Descargar un archivo

- Uso un GET en el upload-file.controller

~~~js
@Get()
downloadFile(@Response() res, @Body() body: any){
  return this.uploadFileService.downloadFile(res, body.filename)
}
~~~

- En el upload-file.service

~~~js
downloadFile(res, filename: string){

    if(existsSync('./upload/'+filename)){
      return res.download('./upload/'+ filename)
    }
    return new NotFoundException('El fichero no existe')
  }
~~~

## Documentando endpoints

- En el controller

~~~js
@Post()
@ApiOperation({
  description: 'Sube un fichero'
})
@ApiResponse({
  status: 201,
  description: 'El archivo se ha subido correctamente'
})
@ApiConsumes('multipart/form-data')
@ApiBody({
  schema: {
    type: 'object',
    properties:{
      file: {
        type: 'string',
        format: 'binary'
      }
    }
  }
})
@UseInterceptors(FileInterceptor('file'))
uploadFile(@UploadedFile() file: Express.Multer.File) {
  return this.uploadFileService.uploadFile(file);
}
~~~

----