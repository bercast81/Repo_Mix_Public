import { Controller, Get, Post, UseInterceptors, UploadedFile, Body, Response } from '@nestjs/common';
import { UploadFileService } from './upload-file.service';

import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller('upload-file')
export class UploadFileController {
  constructor(private readonly uploadFileService: UploadFileService) {}

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

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  uploadFiles(@UploadedFile() files: Express.Multer.File[]) {
    return this.uploadFileService.uploadFiles(files);
  }

  @Get()
  downloadFile(@Response() res, @Body() body: any){
    return this.uploadFileService.downloadFile(res, body.filename)
  }
}
