# 03 NEST DURO DE ROER - CRON

> nest new cron

- Entro en cron con cd cron

> npm i

> nest g res cron

> npm i @nestjs/schedule

- Uso ScheduleModule.forRoot en CronModule

~~~js
import { Module } from '@nestjs/common';
import { CronService } from './cron.service';
import { CronController } from './cron.controller';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports:[
    ScheduleModule.forRoot()
  ],
  controllers: [CronController],
  providers: [CronService],
})
export class CronModule {}
~~~

- Inyecto el servicio en CronService
- Uso el decorador @Cron para los métodos que puedo llamar como quiera
- cron.service

~~~js
import { Injectable } from '@nestjs/common';
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

}
~~~

## Desactivar cron

- Para desactivar un cron puedo usar PUT o POST, elijo PUT (ya que modifico el estado)
- cron.controller.ts

~~~js
@Put('desactivar/:name')
  desactivarCron(@Param() name: string) {
    return this.cronService.desactivarCron(name);
}
~~~

- cron.service.ts

~~~js
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
~~~

- Para activar es lo mismo pero uso job.start

~~~js
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
~~~

## Devolver todos los nombres de los crons

- cron.controller.ts

~~~js
@Get()
obtenerNombresCrons(){
return this.cronService.obtenerNombresCrons()
}
~~~

- cron.service.ts

~~~js
obtenerNombresCrons(){
const names: string[] = []
for (const name of this.scheduleRegistry.getCronJobs().keys()){
    names.push(name)
}
return names
}
~~~

## Desactivando todos los crons a la vez

- Uso Put
- cron.controller.ts

~~~js
@Put('desactivar')
desactivarCrons() {
return this.cronService.desactivarCrons();
}
~~~

- cron.service.ts

~~~js
desactivarCrons(){
    const names = this.obtenerNombresCrons()
    for (const name of names){
    this.desactivarCron(name)
    }
    return true
}
~~~

## Activar todos los crons

- cron.controller.ts

~~~js
@Put('activar-crons')
  activarTodosCrons() {
    return this.cronService.activarCrons();
  }
~~~

- cron.service.ts

~~~js
activarCrons(){
    const names = this.obtenerNombresCrons()
    for (const name of names){
      this.activarCron(name)
    }
    return true
  }
~~~
------
