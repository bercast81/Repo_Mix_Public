import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty } from "class-validator";

export class SenderDto{
    @ApiProperty({
        name: 'email',
        type: String,
        required: true,
        description: 'Email del destinatario'
    })
    @IsEmail()
    @IsNotEmpty()
    email: string
}