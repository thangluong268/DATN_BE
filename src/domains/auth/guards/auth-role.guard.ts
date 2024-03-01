import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { ROLE_NAME } from '../../../shared/enums/role-name.enum';
import { ROLES_KEY } from '../decorators/auth-role.decorator';

@Injectable()
export class AuthRoleGuard implements CanActivate {
  constructor(private reflector: Reflector) {}
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [context.getHandler(), context.getClass()]);
    if (!requiredRoles) return true;
    const { user } = context.switchToHttp().getRequest();
    if (user.role.includes(ROLE_NAME.ADMIN)) return true;
    return requiredRoles.some((role) => user.role.includes(role));
  }
}
