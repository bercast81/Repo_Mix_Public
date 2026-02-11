import { ArrayMinSize, IsArray, ValidateNested} from "class-validator"
import { OrderStatusList } from "src/common/enums/orders.enum"
import { Type } from "class-transformer"
import { OrderItemDto } from "./order-item.dto"


export class CreateOrderDto {
    
    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({each:true}) //valida internamente los objetos en el array
    @Type(()=>OrderItemDto)
    items: OrderItemDto[]

}
