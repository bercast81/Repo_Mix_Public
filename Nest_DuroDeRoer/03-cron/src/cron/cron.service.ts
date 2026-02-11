import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCronDto } from './dto/create-cron.dto';
import { UpdateCronDto } from './dto/update-cron.dto';
import { Cron, SchedulerRegistry } from '@nestjs/schedule';

@Injectable()
export class CronService {

  constructor(
    private readonly scheduleRegistry: SchedulerRegistry
  ){}

  @Cron('*/10 * * * * *',{
    name: 'cron1'
  })
  cron1(){
    console.log('Cron1 cada 10 segundos')
  }

  @Cron('*/30 * * * * *',{
    name: 'cron2'
  })
  cron2(){
    console.log('Cron2 cada 30 segundos')
  }

  @Cron('* * * * * *',{
    name: 'cron3'
  })
  cron3(){
    console.log('Cron3 cada minuto')
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
