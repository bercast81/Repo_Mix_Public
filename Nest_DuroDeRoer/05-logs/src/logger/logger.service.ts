import { Injectable} from '@nestjs/common';
import {Logger, format, transport, transports, createLogger} from 'winston'
import * as path from 'path';
import 'winston-daily-rotate-file'


const logDir = path.resolve(__dirname, '../../log');

@Injectable()
export class LoggerService {

  private loggerInfo: Logger
  private loggerError: Logger
  private loggerWarn: Logger
  private loggerDebug: Logger
  private loggerVerbose: Logger
  private loggerAll: Logger

  constructor(){
    this.createLogger()
  }

  createLogger(){
    const textFormat = format.printf((log)=>{
      return `${log.timestamp}- ${log.level.toUpperCase().charAt(0)}-${log.message}`
    })

    const dateFormat = format.timestamp({
      format: 'YYYY-MM-DD HH:MM:SS'
    })

    this.loggerInfo = createLogger({
      level: 'info',
      format: format.combine(
        dateFormat,
        textFormat
      ),
      transports:[
        new transports.DailyRotateFile({
          filename:  path.join(logDir, 'info/info.log'),
          datePattern: 'YYYY-MM-DD',
          maxFiles: '7d',
          zippedArchive: true
        })
      ]
    })
    
    this.loggerAll = createLogger({
      format: format.combine(
        dateFormat,
        textFormat
      ),
      transports:[
        new transports.DailyRotateFile({
          filename:  path.join(logDir, 'all/all.log'),
          datePattern: 'YYYY-MM-DD',
          maxFiles: '7d',
          zippedArchive: true
        })
      ]
    })
    this.loggerError = createLogger({
      level: 'error',
      format: format.combine(
        dateFormat,
        textFormat
      ),
      transports:[
        new transports.DailyRotateFile({
          filename:  path.join(logDir, 'error/error.log'),
          datePattern: 'YYYY-MM-DD',
          maxFiles: '7d',
          zippedArchive: true
        })
      ]
    })
    this.loggerWarn = createLogger({
      level: 'warn',
      format: format.combine(
        dateFormat,
        textFormat
      ),
      transports:[
        new transports.DailyRotateFile({
          filename:  path.join(logDir, 'warn/warn.log'),
          datePattern: 'YYYY-MM-DD',
          maxFiles: '7d',
          zippedArchive: true
        })
      ]
    })
    this.loggerDebug = createLogger({
      level: 'debug',
      format: format.combine(
        dateFormat,
        textFormat
      ),
      transports:[
        new transports.DailyRotateFile({
          filename:  path.join(logDir, 'debug/debug.log'),
          datePattern: 'YYYY-MM-DD',
          maxFiles: '7d',
          zippedArchive: true
        })
      ]
    })
    this.loggerVerbose = createLogger({
      level: 'verbose',
      format: format.combine(
        dateFormat,
        textFormat
      ),
      transports:[
        new transports.DailyRotateFile({
          filename:  path.join(logDir, 'verbose/verbose.log'),
          datePattern: 'YYYY-MM-DD',
          maxFiles: '7d',
          zippedArchive: true
        })
      ]
    })
    
  }

  log(message: string){
    this.loggerInfo.info(message)
    this.loggerAll.info(message)
  }
  error(message: string){
    this.loggerError.error(message)
    this.loggerAll.error(message)
  }
  warn(message: string){
    this.loggerWarn.warn(message)
    this.loggerAll.warn(message)
  }
    debug(message: string) {
    this.loggerDebug.debug(message);
    this.loggerAll.debug(message)

  }

  verbose(message: string) {
    this.loggerVerbose.verbose(message);
    this.loggerAll.verbose(message)

  }

}
