import { RbacService } from './rbac.service';

function role(id: string, name: string, parentId?: string) {
  return { id, name, description: `Rol ${name}`, parentId } as any;
}

function createRepos() {
  const roles = [
    role('r-apoyo', 'APOYO'),
    role('r-docente', 'DOCENTE', 'r-apoyo'),
    role('r-estudiante', 'ESTUDIANTE', 'r-apoyo'),
  ];

  const permissions = [
    { id: 'p1', key: 'dashboard.view' },
    { id: 'p2', key: 'grades.create' },
    { id: 'p3', key: 'history.view' },
  ];

  const rolePermissions = [
    { roleId: 'r-apoyo', permissionId: 'p1', permission: permissions[0] },
    { roleId: 'r-docente', permissionId: 'p2', permission: permissions[1] },
    { roleId: 'r-estudiante', permissionId: 'p3', permission: permissions[2] },
  ];

  const roleRepository = {
    find: jest.fn(async ({ where }: any = {}) => {
      if (where?.id?.value) {
        const ids = where.id.value as string[];
        return roles.filter((r) => ids.includes(r.id));
      }
      if (where?.name?.value) {
        const keys = where.name.value as string[];
        return roles.filter((r) => keys.includes(r.name));
      }
      return roles;
    }),
    findOne: jest.fn(async ({ where }: any) => {
      return roles.find((r) => r.id === where.id) ?? null;
    }),
    update: jest.fn(),
    create: jest.fn((dto: any) => dto),
    save: jest.fn((entity: any) => entity),
  };

  const permissionRepository = {
    find: jest.fn(async () => permissions),
    findOne: jest.fn(),
    create: jest.fn((dto: any) => dto),
    save: jest.fn((entity: any) => entity),
  };

  const userRoleRepository = {
    find: jest.fn(async (_opts: any) => {
      return [{ userId: 'u-1', roleId: 'r-docente', role: roles[1] }];
    }),
    findOne: jest.fn(),
    create: jest.fn((dto: any) => dto),
    save: jest.fn((entity: any) => entity),
    delete: jest.fn(),
  };

  const rolePermissionRepository = {
    find: jest.fn(async ({ where }: any = {}) => {
      const roleIds = where?.roleId?.value ?? [];
      return rolePermissions.filter((rp) => roleIds.includes(rp.roleId));
    }),
    create: jest.fn((dto: any) => dto),
    save: jest.fn((entity: any) => entity),
  };

  return {
    roleRepository,
    permissionRepository,
    userRoleRepository,
    rolePermissionRepository,
    roles,
    rolePermissions,
    permissions,
  };
}

describe('RbacService', () => {
  describe('getUserRoles con herencia', () => {
    it('resuelve DOCENTE y su ancestro APOYO ordenados', async () => {
      const repos = createRepos();
      const service = new RbacService(
        repos.roleRepository as any,
        repos.permissionRepository as any,
        repos.userRoleRepository as any,
        repos.rolePermissionRepository as any,
      );

      const roles = await service.getUserRoles('u-1');

      const keys = roles.map((r) => r.key);
      expect(keys).toContain('DOCENTE');
      expect(keys).toContain('APOYO');
      const docente = roles.find((r) => r.key === 'DOCENTE');
      const apoyo = roles.find((r) => r.key === 'APOYO');
      expect(docente?.inherited).toBe(false);
      expect(apoyo?.inherited).toBe(true);
    });
  });

  describe('getUserPermissions con herencia', () => {
    it('retorna permisos del rol directo y de ancestros', async () => {
      const repos = createRepos();
      const service = new RbacService(
        repos.roleRepository as any,
        repos.permissionRepository as any,
        repos.userRoleRepository as any,
        repos.rolePermissionRepository as any,
      );

      const permissions = await service.getUserPermissions('u-1');

      expect(permissions).toContain('dashboard.view'); // heredado de APOYO
      expect(permissions).toContain('grades.create'); // de DOCENTE
    });
  });
});