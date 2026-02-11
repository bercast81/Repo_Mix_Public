import { IsString } from "class-validator";

export class StatusDto{
    
    @IsString()
    status: string
}