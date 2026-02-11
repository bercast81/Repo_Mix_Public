import { Injectable, NotFoundException } from '@nestjs/common';
import { Cron, SchedulerRegistry } from '@nestjs/schedule';
import { LoggerService } from 'src/logger/logger.service';

@Injectable()
export class CronService {

  constructor(
    private readonly scheduleRegistry: SchedulerRegistry,
    private readonly loggerService: LoggerService
  ){}

  @Cron('*/10 * * * * *',{
    name: 'cron1'
  })
  cron1(){
    this.loggerService.log("cron1: Acción cada 10 segundos")
  }

  @Cron('*/30 * * * * *',{
    name: 'cron2'
  })
  cron2(){
    this.loggerService.error("cron1: Acción cada 30 segundos")
  }

  @Cron('* * * * * *',{
    name: 'cron3'
  })
  cron3(){
    this.loggerService.warn("cron1: Acción cada minuto")
  }

  desactivarCron(name: string){
    const job = this.scheduleRegistry.getCronJob(name)

    if(!job){
      throw new NotFoundException("Cron no encontrado")
    }else{
      job.stop()
      console.log(`El cron con nombre ${name} está desactivado`)
      return true
    }
  }
  
  activarCron(name: string){
    const job = this.scheduleRegistry.getCronJob(name)

    if(!job){
      throw new NotFoundException("Cron no encontrado")
    }else{
      job.start()
      console.log(`El cron con nombre ${name} está activado`)
      return true
    }
  }

  obtenerNombresCrons(){
    const names: string[] = []
    for (const name of this.scheduleRegistry.getCronJobs().keys()){
      names.push(name)
    }
    return names
  }

  desactivarCrons(){
    const names = this.obtenerNombresCrons()
    for (const name of names){
      this.desactivarCron(name)
    }
    return true
  }
  activarCrons(){
    const names = this.obtenerNombresCrons()
    for (const name of names){
      this.activarCron(name)
    }
    return true
  }

}
