import { IsNumber, IsPositive } from "class-validator"

export class OrderItemDto{
    
    @IsNumber()
    @IsPositive()
    productId: number //en la DB de productos tienen un id de tipo numérico

    @IsNumber()
    @IsPositive()
    quantity: number

    @IsNumber()
    @IsPositive()
    price: number
}