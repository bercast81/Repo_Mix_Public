import { Inject, Injectable, Logger } from '@nestjs/common';
import { envs } from 'src/config/envs';
import Stripe from 'stripe';
import { PaymentSessionDto } from './dto/payment-session.dto';
import {Request, Response} from 'express'
import { ClientProxy } from '@nestjs/microservices';
import { NATS_SERVICE } from 'src/config/services';


@Injectable()
export class PaymentsService {

  private readonly stripe = new Stripe(envs.stripeSecret);
  private readonly logger = new Logger('PaymentsService');

  constructor(
    @Inject(NATS_SERVICE) private readonly client: ClientProxy
  ){}


 async createPaymentSession(paymentSessionDto: PaymentSessionDto){
  const {currency, items, orderId} = paymentSessionDto

  const lineItems = items.map(({name, price, quantity})=>{
    return{
      price_data:{
        currency,
        product_data:{
          name
        },
        unit_amount: Math.round(price*100)
      },
      quantity
    }
  })

    const session = await this.stripe.checkout.sessions.create({
      //colocar aquí el id de mi order
      payment_intent_data:{
        metadata:{
          orderId: orderId
        }
      },

      //aqui van los items que la gente está comprando
      line_items:lineItems,
      mode: 'payment',
      success_url: 'http://localhost:3003/payments/success',
      cancel_url: 'http://localhost:3003/payments/cancel'
    }) 

    return {
    cancelUrl: session.cancel_url,
    successUrl: session.success_url,
    url: session.url                
    }
  }

  success(){
      return `Order completed!`
  }

  cancel(){
    return `Order canceled!`
  }

  async stripeWebhook(req: Request, res: Response) {
    const sig = req.headers['stripe-signature']!;

    let event: Stripe.Event;

    
    const endpointSecret = envs.endpointSecret

    try {
      event = this.stripe.webhooks.constructEvent(
        req['rawBody'],
        sig,
        endpointSecret,
      );
    } catch (err) {
      res.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }
    
    //console.log({event})
    switch( event.type ) {
      case 'charge.succeeded': 
        const chargeSucceeded = event.data.object;
        const payload = {
          stripePaymentId: chargeSucceeded.id,
          orderId: chargeSucceeded.metadata.orderId,
          receiptUrl: chargeSucceeded.receipt_url,
        }

        this.client.emit('payment.succeeded', payload)

      break;

      
      default:
        console.log(`Event ${ event.type } not handled`);
    }

    return res.status(200).json({ sig });
  }
}
