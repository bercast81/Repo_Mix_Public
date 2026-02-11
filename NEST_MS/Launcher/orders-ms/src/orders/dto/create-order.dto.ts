import { ArrayMinSize, IsArray, ValidateNested} from "class-validator"
import { OrderStatus } from "@prisma/client"
import { OrderStatusList } from "src/common/enums/orders.enum"
import { OrderItemDto } from "./order-item.dto"
import { Type } from "class-transformer"


export class CreateOrderDto {
    
    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({each:true}) //valida internamente los objetos en el array
    @Type(()=>OrderItemDto)
    items: OrderItemDto[]

}
