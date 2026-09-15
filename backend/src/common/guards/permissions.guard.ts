import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '@common/decorators/require-permission.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required || required.length === 0) return true;

    const request = context.switchToHttp().getRequest<Record<string, any>>();
    const user = request.user;

    if (!user) return false;
    const permissions: string[] = Array.isArray(user.permissions)
      ? user.permissions
      : [];

    if (permissions.includes('*')) return true;

    return required.some((permission) => permissions.includes(permission));
  }
}