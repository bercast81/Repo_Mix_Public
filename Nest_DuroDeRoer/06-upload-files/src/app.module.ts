import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { UploadFileModule } from './upload-file/upload-file.module';


@Module({
  controllers: [],
  providers: [],
  imports: [UploadFileModule],
})
export class AppModule {}
