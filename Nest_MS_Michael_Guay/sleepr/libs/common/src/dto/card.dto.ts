import { IsCreditCard, IsDate, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class CardDto{
        
        @IsString()
        @IsNotEmpty()
        cvc: string;
        
        @IsNumber()
        exp_month: number;
        
        @IsNumber()
        exp_year: number;

        @IsOptional()
        networks?: any //Card.Networks
     
        @IsCreditCard()
        number: string;

        @IsOptional()
        token?: string; 
}