import { Controller,Get,Param, Put } from '@nestjs/common';
import { CronService } from './cron.service';


@Controller('cron')
export class CronController {
  constructor(private readonly cronService: CronService) {}

  @Put('desactivar/:name')
  desactivarCron(@Param() name: string) {
    return this.cronService.desactivarCron(name);
  }

  @Get()
  obtenerNombresCrons(){
    return this.cronService.obtenerNombresCrons()
  }

  @Put('desactivar-crons')
  desactivarTodosCrons() {
    return this.cronService.desactivarCrons();
  
  }
  @Put('activar-crons')
  activarTodosCrons() {
    return this.cronService.activarCrons();
  }



}
