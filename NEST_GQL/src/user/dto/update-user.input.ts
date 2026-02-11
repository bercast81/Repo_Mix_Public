import { ValidRoles } from 'src/auth/enums/valid-roles.enum';
import { CreateUserInput } from './create-user.input';
import { InputType, Field, PartialType, ID } from '@nestjs/graphql';
import { IsArray, IsBoolean, IsOptional, IsUUID } from 'class-validator';

@InputType()
export class UpdateUserInput extends PartialType(CreateUserInput) {
  @Field(() => ID)
  @IsUUID()
  @IsOptional()
  id: string;

  @Field(()=> [ValidRoles], {nullable: true})
  @IsArray()
  @IsOptional()
  roles?: ValidRoles[]

  @Field(()=> Boolean, {nullable: true})
  @IsBoolean()
  @IsOptional()
  isActive?: boolean


}
