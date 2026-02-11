import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, LessThanOrEqual, MoreThanOrEqual, Not, Repository, UpdateResult } from 'typeorm';
import { Order } from './entities/order.entity';
import { ClientService } from 'src/client/client.service';
import { ProductService } from 'src/product/product.service';

@Injectable()
export class OrderService {

  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private clientService: ClientService,
    private productService: ProductService
  ){}

  async create(order: CreateOrderDto) {
    const client = await this.clientService.findOne(order.client.id) 
    if(!client) throw new NotFoundException("Cliente no encontrado")
    
      for(let p of order.products){
        const product = await this.productService.findOne(p.id)
        if(!product){
          throw new NotFoundException("Producto no encontrado")
        } else if(product.deleted){
          throw new BadRequestException("Producto borrado")
        }
      }

      return this.orderRepository.save(order)
  }

  findAll() {
    return `This action returns all order`;
  }
async getOrderById(id: string) {
    const order = await this.orderRepository.findOne({
      where: {id}
    })

    if(!order) throw new NotFoundException("No se encontró la orden")

    return order
  }

  async getPendingOrders(){
    return await this.orderRepository.find({
      where:{
        confirmAt: IsNull()
      }
    })
  }

  async getConfirmedOrders(start: Date, end: Date){
   if(!isNaN(start.getTime()) || !isNaN(end.getTime())){
    const query = this.orderRepository.createQueryBuilder('order')
                  .leftJoinAndSelect("order.client", "client")
                  .leftJoinAndSelect("order.products", "product")
                  .orderBy("order.confirmAt")
    if(!isNaN(start.getTime())){
      query.andWhere({confirmAt: MoreThanOrEqual(start)})
    }

    if(!isNaN(end.getTime())){
      query.andWhere({confirmAt: LessThanOrEqual(end)})
    }
    return await query.getMany()
   }else{
    return await this.orderRepository.find({
      where: {
        confirmAt: Not(IsNull())
      },
      order:{
        confirmAt: 'DESC'
      }
    })
   }
  }

  async confirmOrder(id: string) {
    const orderExists = await this.getOrderById(id)

    if(!orderExists) throw new NotFoundException("La órden no existe")

    if(orderExists.confirmAt) throw new ConflictException("La órden ya ha sido confirmada")

    const rows: UpdateResult = await this.orderRepository.update(
      {id},
      {confirmAt: new Date()}
    )

    return rows.affected ==1
  }

  getOrdersByClient(clientId: number){
      return this.orderRepository.createQueryBuilder("order")
          .leftJoinAndSelect("order.client", "client")
          .leftJoinAndSelect("order.products", "product")
          .where("client.id = :clientId", {clientId})
          .orderBy("order.confirmAt")
          .getMany()
  }

  remove(id: number) {
    return `This action removes a #${id} order`;
  }
}
