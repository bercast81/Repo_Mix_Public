import { SignupInput } from './signup.input';
import { InputType, Field, PartialType, ID } from '@nestjs/graphql';

@InputType()
export class UpdateUserInput extends PartialType(SignupInput) {
  @Field(() => ID)
  id: string;
}
