import { createParamDecorator, ExecutionContext, ForbiddenException, InternalServerErrorException } from "@nestjs/common";
import { ValidRoles } from "../enums/valid-roles.enum";
import { GqlExecutionContext } from "@nestjs/graphql";
import { User } from "src/user/entities/user.entity";

export const CurrentUser = createParamDecorator(
   (roles: ValidRoles[]=[], context: ExecutionContext)=>{

    const ctx = GqlExecutionContext.create(context)

    //extraigo el user de la request que obtengo del strategy con validate
    const user: User = ctx.getContext().req.user

    if(!user) throw new InternalServerErrorException('No user inside the request')

    if(roles.length === 0) return user
    
    for(const role of user.roles){
        if(roles.includes(role as ValidRoles)){
            return user
        }
    }

    throw new ForbiddenException(`User ${user.fullName} needs a valid role`)
   }
)