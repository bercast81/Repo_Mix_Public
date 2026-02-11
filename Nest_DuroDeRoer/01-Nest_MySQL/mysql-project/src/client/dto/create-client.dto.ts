import { Type } from "class-transformer"
import { IsEmail, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from "class-validator"
import { Address } from "../entities/address.entity"

export class CreateClientDto {
    @IsOptional()
    @IsPositive()
    @IsNumber()
    id: number

    @IsString()
    @IsNotEmpty()
    name: string

    @IsNotEmpty()
    @IsEmail()
    email: string

    @Type(()=> Address)
    @IsNotEmpty()
    address: Address
}
