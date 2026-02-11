import { IsNotEmpty, IsNumber, IsPositive, Max, Min } from "class-validator";

export class StockDto{
    @IsNotEmpty()
    @IsPositive()
    @IsNumber()
    id: number

    @IsNotEmpty()
    @Min(0)
    @Max(1000)
    @IsNumber()
    stock: number

}