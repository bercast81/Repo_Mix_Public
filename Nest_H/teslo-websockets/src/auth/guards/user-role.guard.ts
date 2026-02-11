import { BadRequestException, CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { User } from 'src/auth/entities/user.entity';
import { ValidRoles } from '../interfaces/valid-roles.enum';

@Injectable()
export class UserRoleGuard implements CanActivate {

  constructor(
    private readonly reflector: Reflector
  ){}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    
    const validRoles: string[]= this.reflector.get('roles', context.getHandler())

    if(!ValidRoles) return true //que pase si no hay roles
    if(validRoles.length===0) return true //lo mismo

    const req = context.switchToHttp().getRequest()
    const user = req.user as User

    if(!user) throw new BadRequestException('User not found')
    
    for(const role of user.roles){
      if(validRoles.includes(role)){
        return true
      }
    }

    throw new ForbiddenException(`User ${user.fullName} needs a valid role`)
  }
}
