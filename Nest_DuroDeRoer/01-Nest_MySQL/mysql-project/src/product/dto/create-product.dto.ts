import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from "class-validator";

export class CreateProductDto {

    @ApiProperty({
    name: "id",
    required: false,
    description: "id del producto",
    type: Number
    })
    @IsOptional()
    @IsNumber()
    @IsPositive()
    id: number

    @IsString()
    @IsNotEmpty()
    name: string

    @IsNotEmpty()
    @IsNumber()
    @IsPositive()
    stock: number

    @IsNotEmpty()
    @IsNumber()
    @IsPositive()
    price: number

    @IsOptional()
    @IsString()
    friendlySearch: string

    @IsOptional()
    @IsBoolean()
    deleted: boolean
}
