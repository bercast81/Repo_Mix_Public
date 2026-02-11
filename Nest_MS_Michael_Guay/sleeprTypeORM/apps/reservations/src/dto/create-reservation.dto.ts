import { Type } from "class-transformer";
import { IsDate, IsDefined, IsNotEmpty, IsNotEmptyObject, IsNumber, IsOptional, IsString, ValidateNested } from "class-validator";
import { CardDto } from "../../../../libs/common/src/dto/card.dto";
import { CreateChargeDto } from "@app/common/dto/create-charge.dto";

export class CreateReservationDto {
    @IsDate()
    @Type(()=> Date)
    startDate: Date;
    
    @IsDate()
    @Type(()=> Date)
    endDate: Date;
    
    /*
    @IsString()
    @IsOptional()
    userId: string;*/
    
    @IsString()
    @IsNotEmpty()
    placeId: string;
    

    @IsDefined()
    @IsNotEmptyObject()
    @ValidateNested()
    @Type(()=> CreateChargeDto)
    charge: CreateChargeDto
}
