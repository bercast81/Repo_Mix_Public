import { Type } from "class-transformer";
import { IsEnum, IsInt, IsNumber, IsOptional, Min } from "class-validator";
import { OrderStatus } from "@prisma/client";
import { OrderStatusList } from "src/common/enums/orders.enum";

export class OrderPaginationDto{
  
  @IsOptional()
  @IsEnum( OrderStatusList, {
    message: `Valid status are ${ OrderStatusList }`
  })
  status?: OrderStatus;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1

  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit: number = 10
}