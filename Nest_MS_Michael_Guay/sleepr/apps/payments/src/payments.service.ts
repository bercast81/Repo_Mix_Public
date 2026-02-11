import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { CreateChargeDto } from '../../../libs/common/src/dto/create-charge.dto';
import { NOTIFICATIONS_SERVICE } from '@app/common/constants/services';
import { ClientProxy } from '@nestjs/microservices';
import { PaymentsCreateChargeDto } from '../dto/payments-create-charge.dto';

@Injectable()
export class PaymentsService {
  private readonly stripe = new Stripe(this.configService.get('STRIPE_SECRET_KEY'),{
    apiVersion: "2024-11-20.acacia"
  })

  constructor(
    private readonly configService: ConfigService,
    @Inject(NOTIFICATIONS_SERVICE) private readonly notificationsService: ClientProxy
  ){}

  async createCharge({card, amount, email}: PaymentsCreateChargeDto){
    const paymentMethod = await this.stripe.paymentMethods.create({
      type: 'card',
      card 
    })

    console.log(email)
    const paymentIntent= await this.stripe.paymentIntents.create({
      payment_method: paymentMethod.id,
      amount: amount*100, //El valor más pequeño son 100 cents
      confirm: true, //
      payment_method_types: ['card'],
      currency: 'eur'
    })

    this.notificationsService.emit('notify-email', {email,text: `Your payment of $ ${amount * 100} has completed succesfully`})

    return paymentIntent
  }
}
