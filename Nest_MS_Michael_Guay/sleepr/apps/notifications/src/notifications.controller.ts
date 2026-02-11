import { Controller, UsePipes, ValidationPipe} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { EventPattern, Payload } from '@nestjs/microservices';
import { NotifyEmailDto } from './dtos/notify-email.dto';

@Controller()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @EventPattern('notify-email')
  @UsePipes(new ValidationPipe())
  async notifyEmail(@Payload() data: NotifyEmailDto){
    return this.notificationsService.notifyEmail(data)
  }
}
