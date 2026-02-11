import { HttpStatus, Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ChangeOrderStatusDto } from './dto/change-order.dto';
import { OrderPaginationDto } from './dto/order-pagination.dto';
import { PrismaClient } from '@prisma/client';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { CreateOrderDto } from './dto/create-order.dto';
import { NATS_SERVICE } from 'src/config/services';
import { firstValueFrom } from 'rxjs';
import { OrderWithProducts } from 'src/interfaces/order.interface';
import { PaidOrderDto } from './dto/paid-order.dto';

@Injectable()
export class OrdersService extends PrismaClient implements OnModuleInit{

  private readonly logger = new Logger("OrdersService")

  constructor(
    @Inject(NATS_SERVICE)
    private readonly client: ClientProxy
  ){
    super()
  }

  async onModuleInit() {
    await this.$connect()
    this.logger.log("Database connected!!")
  }


  async create(createOrderDto: CreateOrderDto) {
    try {
      //1.Confirmar los ids de los productos
      const productsIds = createOrderDto.items.map((item)=> item.productId) //extraigo los ids en un arreglo

      //llamo al microservicio para validar que existen los productos
      const products: any[]= await firstValueFrom(
        this.client.send({cmd:'validate_products'}, productsIds)
      )

      //2.Calculo de los valores          //en OrderItem tengo el precio
      const totalAmount = createOrderDto.items.reduce((acc, orderItem)=>{
        //necesito encontrar orderItem en el arreglo de productos
        //no quiero confiar en el precio del dto, uso el de los productos a través del id

        const price = products.find((product)=>product.id === orderItem.productId).price
        //Multiplica el precio del producto por la cantidad pedida y súmalo al acumulador (acc) que lleva el total hasta ahora
        return price * orderItem.quantity + acc
      }, 0)

      const totalItems = createOrderDto.items.reduce((acc, orderItem)=>{
        return acc + orderItem.quantity //Si tengo x cantidad necesito contarlo por cada uno de los elementos del arreglo
      }, 0) //En el acc voy guardando la suma de las iteraciones

      //3. Crear una transacción en la db

      const order = await this.order.create({
        data:{
          totalAmount: totalAmount,
          totalItems: totalItems,
          OrderItem:{
            createMany:{
              data: createOrderDto.items.map((orderItem)=>({
                price: products.find( //no puedo usar directamente el orderItem.price porque no lo hemos validado
                  (product)=> product.id === orderItem.productId //uso los precios del arreglo de products que viene de la tabla
                ).price,
                productId: orderItem.productId,
                quantity: orderItem.quantity
              }))
            }
          }
        },
        //que incluya el OrderItem. Si pongo solo OrderItem: true me devuelve todo
        include:{
          OrderItem:{
            select:{
              price: true,
              quantity: true,
              productId: true
            }
          }
        }
      })

      return {
        ...order, //me quedo con todo lo de order menos OrderItem
        orderItem: order.OrderItem.map((orderItem)=>({
        ...orderItem,
        //buscando el nombre del producto real basado en el productId del orderItem para agregarlo al objeto orderItem retornado
        //el .name retorna el nombre del producto encontrado
        name: products.find((product)=> product.id === orderItem.productId).name   
        }))
      }
      
    } catch (error) {
      throw new RpcException({ 
        message: error.message,
        status: HttpStatus.BAD_REQUEST
    })
    }
  }

  async findAll(orderPaginationDto: OrderPaginationDto) {
    const totalPages = await  this.order.count({
      where: {
        status: orderPaginationDto.status 
      }
    }) 

    const currentPage = +orderPaginationDto.page
    const perPage = +orderPaginationDto.limit

    return {
      data: await this.order.findMany({
        skip: (currentPage - 1) * perPage,
        take: perPage,
        where:{
          status: orderPaginationDto.status
        }
      }),
      meta: {
        total: totalPages,
        page: currentPage,
        lastPage: Math.ceil(totalPages/perPage)
      }
    }
  }

  async findOne(id: string) {
    const order = await this.order.findFirst({
      where: {id},
      include:{
        OrderItem:{
          select:{
            price: true, 
            quantity: true,
            productId: true
          }
        }
      }
    })

    if(!order){
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Order with id ${id} not found`
      })
    }

    const productIds = order.OrderItem.map((orderItem)=> orderItem.productId)

    //valido comunicándome con el products-ms que los productos existan

    const products: any[]= await firstValueFrom(
      this.client.send({cmd: 'validate_products'},productIds)
    )

    return {
      ...order,
      orderItem: order.OrderItem.map((orderItem)=>({
        ...orderItem,
        name: products.find((product)=> product.id=== orderItem.productId).name
      }))
    }
  }

  async changeOrderStatus(changeOrderStatusDto: ChangeOrderStatusDto){
      const {id, status} = changeOrderStatusDto

      const order = await this.findOne(id)
      if(order.status === status){
        return order
      }

      return await this.order.update({
        where: {id},
        data: {status}
      })
  }

  async createPaymentSession(order: OrderWithProducts) {
  
    const paymentSession = await firstValueFrom(
      this.client.send('create.payment.session', {
        orderId: order.id,
        currency: 'usd',
        items: order.orderItem.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
        }))
      })
    );
    
    return paymentSession
}

async paidOrder(paidOrderDto:PaidOrderDto){

    const order = await this.order.update({
      where: {id: paidOrderDto.orderId}, //el id tiene que hacer match
      data:{
        status: 'PAID',
        paid: true,
        paidAt: new Date(),
        stripeChargeId: paidOrderDto.stripePaymentId,

        OrderReceipt:{
          create:{
            receiptUrl: paidOrderDto.receiptUrl
          }
        }
      }
    })

    return order
}


}
