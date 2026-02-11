import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator"

export class AddressDto{
    
    @IsOptional()
    @IsNumber()
    id?: number

    @IsNotEmpty()
    @IsString()
    country: string

    @IsNotEmpty()
    @IsString()
    province: string

    @IsNotEmpty()
    @IsString()
    city: string

    @IsNotEmpty()
    @IsString()
    street: string
}