import { Type } from "class-transformer";
import { ArrayNotEmpty, IsArray, IsDate, IsNotEmpty, IsOptional, IsUUID } from "class-validator";
import { CreateClientDto } from "src/client/dto/create-client.dto";
import { CreateProductDto } from "src/product/dto/create-product.dto";
import { Product } from "src/product/entities/product.entity";

export class CreateOrderDto {
    @IsUUID()
    @IsOptional()
    id?: string

    @IsOptional()
    @IsDate()
    @Type(()=> Date)
    createAt?: Date

    @IsOptional()
    @IsDate()
    @Type(()=> Date)
    updateAt?: Date

    @IsOptional()
    @IsDate()
    @Type(()=> Date)
    confirmAt?: Date

    @IsNotEmpty()
    @Type(()=>CreateClientDto)
    client!: CreateClientDto

    @IsNotEmpty()
    @IsArray()
    @ArrayNotEmpty()
    @Type(()=>CreateProductDto)
    products!: CreateProductDto[]
}
