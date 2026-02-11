import { PartialType } from '@nestjs/swagger';
import { AuthCredentialsDto } from './create-auth.dto';

export class UpdateAuthDto extends PartialType(AuthCredentialsDto) {}
