import { BadRequestException, Controller, Get, Param, Post, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileService } from './file.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { fileFilter } from './helpers/fileFilter.helper';
import { diskStorage } from 'multer';
import { fileNamer } from './helpers/fileNamer.helper';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';


@Controller('files')
export class FileController {
  constructor(private readonly fileService: FileService,
    private readonly configService: ConfigService
  ) {}

  @Post('product')
  @UseInterceptors(FileInterceptor('file', {
    fileFilter: fileFilter,
    limits: {fileSize: 100000000},
    storage: diskStorage({
      destination: 'static/products',
      filename: fileNamer
    })
  }))
  uploadProductFile(@UploadedFile() file: Express.Multer.File) {
   if(!file) throw new BadRequestException('Make sure that the file is an image')

    const secureURL= `${this.configService.get('HOST_API')}/files/product/${file.filename}`
    return{
      secureURL
    }
  }

  @Get('product/:imageName')
  findProductImage(@Res() res: Response, @Param('imageName') imageName: string){
    const path = this.fileService.getStaticProductImage(imageName)
    res.sendFile(path)
  }
}
