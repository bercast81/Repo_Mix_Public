import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseIntPipe } from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  create(@Body() createOrderDto: CreateOrderDto) {
    return this.orderService.create(createOrderDto);
  }

  @Get()
  findAll() {
    return this.orderService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.orderService.getOrderById(id);
  }

  @Get('pendig-orders')
  getPendingOrders(){
    return this.orderService.getPendingOrders()
  }

  @Get('confirmed-orders')
  getConfirmedgOrders(@Query('start') start: Date, @Query('end') end: Date){
    return this.orderService.getConfirmedOrders(start,end)
  }
  @Get('orders-by-client')
  getOrdersByClient(@Param('id', ParseIntPipe) clientId: number){
    return this.orderService.getOrdersByClient(clientId)
  }

  @Patch('confirm/:id')
  confirmOrder(@Param('id') id: string) {
    return this.orderService.confirmOrder(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.orderService.remove(+id);
  }
}
