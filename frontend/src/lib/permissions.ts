import { AuthUser } from '@/lib/session';

export interface PermissionKey {
  (user: AuthUser | null, permission: string): boolean;
}

export function hasPermission(user: AuthUser | null, permission: string): boolean {
  if (!user) return false;
  const permissions = Array.isArray(user.permissions) ? user.permissions : [];
  if (permissions.includes('*')) return true;
  return permissions.includes(permission);
}

export function hasAnyPermission(
  user: AuthUser | null,
  permissions: string[],
): boolean {
  return permissions.some((permission) => hasPermission(user, permission));
}

export function hasRole(user: AuthUser | null, ...roles: string[]): boolean {
  if (!user) return false;
  const userRoles = Array.isArray(user.roles) ? user.roles : [];
  const matched = userRoles.some((r) => roles.includes(r.toUpperCase())) ||
    roles.includes(user.role?.toUpperCase());
  return matched;
}

export function primaryRoleKey(user: AuthUser | null): string | undefined {
  if (!user) return undefined;
  if (Array.isArray(user.roles) && user.roles.length > 0) return user.roles[0];
  return user.role;
}