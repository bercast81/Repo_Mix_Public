# 05 NEST DURO DE ROER - LOGS

- Creo el proyecto con nest new logs-app
- reutilizaremos el proyecto de cron, borro la carpeta src y pongo la de cron
- necesito instalar @nestjs/schedule y los types de cron
- Instalo Winston

> npm i winston

- Crearemos una instancia de logger por cada tipo de transport que queramos hacer, aunque transports sea un array
- **No es como sale en la documentación**
- Uso ScheduleModule para que se ejecute cron

~~~js
import { Module } from '@nestjs/common';
import { CronModule } from './cron/cron.module';
import { LoggerModule } from './logger/logger.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [CronModule, LoggerModule, ScheduleModule.forRoot()],
  controllers: [],
  providers: [],
})
export class AppModule {}
~~~

## Creando módulo de Logger de forma global

- No necesito endpoints

> nest g res logger

- Digo que el módulo es global con el decorador @Global en LoggerModule

~~~js
import { Global, Module } from '@nestjs/common';
import { LoggerService } from './logger.service';
import { LoggerController } from './logger.controller';

@Global()
@Module({
  controllers: [LoggerController],
  providers: [LoggerService],
})
export class LoggerModule {}
~~~

- En logger.service

~~~js
import { Injectable} from '@nestjs/common';
import {Logger, format} from 'winston'


@Injectable()
export class LoggerService {

  private loggerInfo: Logger
  private loggerError: Logger
  private loggerWarn: Logger
  private loggerAll: Logger

  constructor(){}

  createLogger(){
    const textFormat = format.printf((log)=>{
      return `${log.timestamp}- ${log.level.toUpperCase().charAt(0)}-${log.message}`
    })
  }
}
~~~

- Formateo la fecha

~~~js
import { Injectable} from '@nestjs/common';
import {Logger, format, transport, transports, createLogger} from 'winston'


@Injectable()
export class LoggerService {

  private loggerInfo: Logger
  private loggerError: Logger
  private loggerWarn: Logger
  private loggerAll: Logger

  constructor(){}

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
        new transports.File({
          filename: 'log/info/info.log'
        })
      ]
    })
  }
}
~~~

- El resto de loggers sería igual, solo cambia la ruta

~~~js
this.loggerAll = createLogger({
      format: format.combine(
        dateFormat,
        textFormat
      ),
      transports:[
        new transports.File({
          filename: 'log/all/all.log'
        })
      ]
    })
~~~

- El service queda así

~~~js
import { Injectable} from '@nestjs/common';
import {Logger, format, transport, transports, createLogger} from 'winston'


@Injectable()
export class LoggerService {

  private loggerInfo: Logger
  private loggerError: Logger
  private loggerWarn: Logger
  private loggerAll: Logger

  constructor(){}

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
        new transports.File({
          filename: 'log/info/info.log'
        })
      ]
    })
    
    this.loggerAll = createLogger({
      format: format.combine(
        dateFormat,
        textFormat
      ),
      transports:[
        new transports.File({
          filename: 'log/all/all.log'
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
        new transports.File({
          filename: 'log/error/error.log'
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
        new transports.File({
          filename: 'log/warn/warn.log'
        })
      ]
    })
  }
}
~~~

## Arrancando nuestro logger

- Hay que crear una instancia en el main.ts

~~~js
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { LoggerService } from './logger/logger.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule,{
    logger: new LoggerService()
  });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
~~~

- Esto da error porque debo crear estos métodos en el logger.service

~~~js
  log(message: string){
    
  }
  error(message: string){

  }
  warn(message: string){

  }
  debug(message: string){

  }
  verbose(message: string){
  }
~~~

- Uso los loggers que he creado en el  logger.service
- logger.service.ts

~~~js
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
~~~

- Debo llamar al método createLogger en el constructor del servicio

~~~js
import { Injectable} from '@nestjs/common';
import {Logger, format, transport, transports, createLogger} from 'winston'


@Injectable()
export class LoggerService {

  private loggerInfo: Logger
  private loggerError: Logger
  private loggerWarn: Logger
  private loggerAll: Logger

  constructor(){
    this.createLogger()
  }

  {...code}
}
~~~

## Usando LoggerService

- Al estar como global no debo importar el módulo en cron

~~~js
import { Injectable} from '@nestjs/common';
import {Logger, format, transport, transports, createLogger} from 'winston'


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
        new transports.File({
          filename: 'log/info/info.log'
        })
      ]
    })
    
    this.loggerAll = createLogger({
      format: format.combine(
        dateFormat,
        textFormat
      ),
      transports:[
        new transports.File({
          filename: 'log/all/all.log'
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
        new transports.File({
          filename: 'log/error/error.log'
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
        new transports.File({
          filename: 'log/warn/warn.log'
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
        new transports.File({
          filename: 'log/debug/debug.log'
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
        new transports.File({
          filename: 'log/verbose/verbose.log'
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
~~~

- Esto escribe los ficheros con los logs

## Winston rotate

- Esta dependencia separará los logs por días

> npm i winston-daily-rotate-file

- Se importa distinto
- logger.service.ts

~~~js
import 'winston-daily-rotate-file'
~~~

- Le indico a cada logger el datePattern

~~~js
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
~~~

-------

