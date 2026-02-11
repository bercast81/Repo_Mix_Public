import { IsArray, IsIn, IsNumber, IsOptional, IsString, MinLength } from "class-validator"

export class CreateProductDto {
    @IsString()
    @MinLength(1)
    title: string

    @IsNumber()
    @IsOptional()
    price?: number

    @IsString()
    @IsOptional()
    description?: string

    @IsString()
    @IsOptional()
    slug?: string

    @IsString()
    @IsOptional()
    stock?: number

    @IsString({each: true})
    @IsArray()
    sizes: string[]

    @IsIn(['men', 'women', 'kid', 'unisex'])
    gender: string

    @IsString({each: true})
    @IsOptional()
    @IsArray()
    tags?: string[]

    @IsOptional()
    @IsString({each: true})
    @IsArray()
    images?: string[]
}
