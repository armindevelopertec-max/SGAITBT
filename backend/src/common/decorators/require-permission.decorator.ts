import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'required_permissions';

export function RequirePermission(...permissions: string[]): MethodDecorator &
  ClassDecorator {
  return SetMetadata(PERMISSIONS_KEY, permissions);
}

export function RequireAnyPermission(...permissions: string[]): MethodDecorator &
  ClassDecorator {
  return SetMetadata(PERMISSIONS_KEY, permissions);
}