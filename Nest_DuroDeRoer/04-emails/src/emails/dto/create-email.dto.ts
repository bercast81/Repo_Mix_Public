import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { ArrayNotEmpty, IsArray, IsNotEmpty, IsString, ValidateNested } from "class-validator";
import { SenderDto } from "./sender.dto";

export class CreateEmailDto {


    @ApiProperty({
        name: 'body',
        required: true,
        type: String,
        description: 'Cuerpo del mensaje a enviar'
    })
    @IsString()
    @IsNotEmpty()
    body: string
    
    @ApiProperty({
        name: 'subject',
        required: true,
        type: String,
        description: 'Asunto del mensaje a enviar'
    })
    @IsString()
    @IsNotEmpty()
    subject: string

    @ApiProperty({
        name: 'receivers',
        required: true,
        isArray: true,
        type: String,
        description: 'Destinatarios del mensaje a enviar'
    })
    @IsArray()
    @ArrayNotEmpty()
    @ValidateNested({each: true})
    @Type(()=>SenderDto)
    receivers: SenderDto[]

}
