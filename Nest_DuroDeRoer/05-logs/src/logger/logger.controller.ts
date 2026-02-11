import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { LoggerService } from './logger.service';
import { CreateLoggerDto } from './dto/create-logger.dto';
import { UpdateLoggerDto } from './dto/update-logger.dto';

@Controller('logger')
export class LoggerController {
  constructor(private readonly loggerService: LoggerService) {}

}
