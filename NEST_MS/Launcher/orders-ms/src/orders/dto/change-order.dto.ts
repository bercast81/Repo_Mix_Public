import { IsEnum, IsUUID } from "class-validator";
import { OrderStatus } from "@prisma/client";
import { OrderStatusList } from "src/common/enums/orders.enum";

export class ChangeOrderStatusDto {

  @IsUUID(4)
  id: string;

  @IsEnum( OrderStatusList, {
    message: `Valid status are ${ OrderStatusList }`
  })
  status: OrderStatus;


}