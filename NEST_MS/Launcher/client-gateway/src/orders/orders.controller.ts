import { Controller, Get, Post, Body, Patch, Param, Inject, Query, ParseUUIDPipe } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { NATS_SERVICE} from 'src/config';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { PaginationDto } from 'src/common/pagination.dto';
import { firstValueFrom } from 'rxjs';
import { StatusDto } from 'src/common/status.dto';
import { OrderPaginationDto } from './dto/order-pagination.dto';

@Controller('orders')
export class OrdersController {
  constructor(
    @Inject(NATS_SERVICE)
    private readonly client: ClientProxy
  ) {}

  @Post()
  create(@Body() createOrderDto: CreateOrderDto) {
   return this.client.send('createOrder', createOrderDto)
  }

  @Get()
  findAll( @Query() orderPaginationDto: OrderPaginationDto) {

    try {
      const orders = this.client.send('findAllOrders', orderPaginationDto)
      return orders
      
    } catch (error) {
      throw new RpcException(error)
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const order= await firstValueFrom(
        this.client.send('findOneOrder', {id})
      )

      return order
      
    } catch (error) {
      throw new RpcException(error)
    }
  }

  @Patch(':id')
  async changeStatus(
    @Param('id', ParseUUIDPipe) id: string, 
    @Body() statusDto: StatusDto) {
    try {
      return this.client.send('changeOrderStatus', {id, status: statusDto.status})
    } catch (error) {
      throw new RpcException(error)
    }
  }

  @Get(':status')
  async findAllByStatus(
    @Param() statusDto: StatusDto,
    @Query() paginationDto: PaginationDto
  ){

    try {
        return this.client.send('findAllOrders',
          {...paginationDto,
            status: statusDto.status
          }
        )
    } catch (error) {
      throw new RpcException(error)
    }

  }

}
