import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { PermissionAction } from '@common/enums';
import { ALL_PERMISSIONS } from '@common/permissions';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { UserRole } from './entities/user-role.entity';
import { RolePermission } from './entities/role-permission.entity';

export interface ResolvedRole {
  key: string;
  description?: string;
  inherited: boolean;
}

export const DEFAULT_ROLE_KEYS = {
  ADMIN: 'ADMIN',
  RECTOR: 'RECTOR',
  DIRECTIVO: 'DIRECTIVO',
  COORDINADOR: 'COORDINADOR',
  DOCENTE: 'DOCENTE',
  ADMINISTRATIVO: 'ADMINISTRATIVO',
  SECRETARIA: 'SECRETARIA',
  APOYO: 'APOYO',
  ESTUDIANTE: 'ESTUDIANTE',
} as const;

export const LEGACY_ROLE_MAP: Record<string, string> = {
  ADMIN: DEFAULT_ROLE_KEYS.ADMIN,
  SECRETARY: DEFAULT_ROLE_KEYS.SECRETARIA,
  TEACHER: DEFAULT_ROLE_KEYS.DOCENTE,
  STUDENT: DEFAULT_ROLE_KEYS.ESTUDIANTE,
};

export const NEW_ROLE_TO_LEGACY: Record<string, string> = {
  ADMIN: 'ADMIN',
  SECRETARIA: 'SECRETARY',
  DOCENTE: 'TEACHER',
  ESTUDIANTE: 'STUDENT',
  COORDINADOR: 'TEACHER',
  ADMINISTRATIVO: 'SECRETARY',
  RECTOR: 'ADMIN',
  DIRECTIVO: 'ADMIN',
  APOYO: 'SECRETARY',
};

interface RoleStruct {
  key: string;
  description?: string;
  parentKey?: string;
  permissions?: string[];
  system?: boolean;
}

const ROLE_TREE: RoleStruct[] = [
  {
    key: DEFAULT_ROLE_KEYS.ADMIN,
    description: 'Administrador',
    system: true,
    permissions: [...ALL_PERMISSIONS],
  },
  {
    key: DEFAULT_ROLE_KEYS.APOYO,
    description: 'Empleado base',
    system: true,
    permissions: ['dashboard.view'],
  },
  {
    key: DEFAULT_ROLE_KEYS.DIRECTIVO,
    description: 'Directivo',
    parentKey: DEFAULT_ROLE_KEYS.APOYO,
    system: true,
    permissions: [
      'dashboard.view',
      'reports.view',
      'students.view',
      'grades.view',
      'history.view',
      'institution.view',
      'audit.view',
    ],
  },
  {
    key: DEFAULT_ROLE_KEYS.RECTOR,
    description: 'Rector',
    parentKey: DEFAULT_ROLE_KEYS.DIRECTIVO,
    system: true,
    permissions: [
      'institution.update',
      'users.view',
      'users.create',
      'users.update',
      'employees.view',
      'employees.create',
      'employees.update',
      'roles.view',
      'roles.manage',
    ],
  },
  {
    key: DEFAULT_ROLE_KEYS.DOCENTE,
    description: 'Docente',
    parentKey: DEFAULT_ROLE_KEYS.APOYO,
    system: true,
    permissions: [
      'dashboard.view',
      'students.view',
      'assignments.view',
      'attendance.view',
      'attendance.create',
      'attendance.update',
      'grades.view',
      'grades.create',
      'grades.update',
      'history.view',
      'files.upload',
    ],
  },
  {
    key: DEFAULT_ROLE_KEYS.COORDINADOR,
    description: 'Coordinador académico',
    parentKey: DEFAULT_ROLE_KEYS.DOCENTE,
    system: true,
    permissions: [
      'subjects.view',
      'subjects.create',
      'subjects.update',
      'periods.view',
      'periods.create',
      'periods.update',
      'grades.verify',
      'reports.view',
    ],
  },
  {
    key: DEFAULT_ROLE_KEYS.ADMINISTRATIVO,
    description: 'Administrativo',
    parentKey: DEFAULT_ROLE_KEYS.APOYO,
    system: true,
    permissions: [
      'dashboard.view',
      'students.view',
      'students.create',
      'students.update',
      'deposits.view',
      'deposits.create',
      'deposits.update',
      'enrollments.view',
      'enrollments.create',
      'enrollments.update',
      'periods.view',
      'reports.view',
      'files.upload',
    ],
  },
  {
    key: DEFAULT_ROLE_KEYS.SECRETARIA,
    description: 'Secretaría académica',
    parentKey: DEFAULT_ROLE_KEYS.ADMINISTRATIVO,
    system: true,
    permissions: [
      'students.view',
      'students.create',
      'students.update',
      'careers.view',
      'careers.create',
      'careers.update',
      'subjects.view',
      'assignments.view',
      'assignments.create',
      'assignments.update',
      'attendance.view',
      'attendance.update',
      'grades.view',
      'grades.update',
      'history.view',
      'enrollments.view',
      'enrollments.create',
      'enrollments.update',
      'deposits.view',
      'deposits.update',
      'periods.view',
      'reports.view',
      'institution.view',
      'users.view',
      'files.upload',
    ],
  },
  {
    key: DEFAULT_ROLE_KEYS.ESTUDIANTE,
    description: 'Estudiante',
    parentKey: DEFAULT_ROLE_KEYS.APOYO,
    system: true,
    permissions: ['dashboard.view', 'history.view'],
  },
];

@Injectable()
export class RbacService {
  private readonly logger = new Logger(RbacService.name);

  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,
    @InjectRepository(RolePermission)
    private readonly rolePermissionRepository: Repository<RolePermission>,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    try {
      await this.ensurePermissions();
      await this.seedRoles();
    } catch (error) {
      this.logger.warn(
        `No se pudieron asegurar permisos/roles: ${(error as Error).message}`,
      );
    }
  }

  async ensurePermissions(): Promise<Permission[]> {
    const existing = await this.permissionRepository.find();
    const existingKeys = new Set(existing.map((p) => p.key));

    const toCreate: Permission[] = [];
    for (const key of ALL_PERMISSIONS) {
      if (existingKeys.has(key)) continue;
      const [module, action] = key.split('.');
      const known = (
        ['ALL', 'VIEW', 'CREATE', 'UPDATE', 'DELETE'] as const
      ).find((a) => a === action?.toUpperCase());
      const permission = this.permissionRepository.create({
        key,
        module,
        action: (known ?? PermissionAction.OTHER) as PermissionAction,
        description: `Permiso ${key}`,
      });
      toCreate.push(permission);
    }

    if (toCreate.length > 0) {
      await this.permissionRepository.save(toCreate);
      this.logger.log(`Permisos creados: ${toCreate.length}`);
    }

    return this.permissionRepository.find();
  }

  async seedRoles(): Promise<void> {
    const permissions = await this.permissionRepository.find();
    const permissionByKey = new Map(permissions.map((p) => [p.key, p]));
    const existingRoles = await this.roleRepository.find();
    const roleByKey = new Map(existingRoles.map((r) => [r.name, r]));
    const roleIdsByKey = new Map<string, string>();

    const idsByName = new Map(
      existingRoles.map((r) => [r.name, r.id]),
    );

    for (const struct of ROLE_TREE) {
      let role = roleByKey.get(struct.key);
      if (!role) {
        role = this.roleRepository.create({
          name: struct.key,
          description: struct.description,
          isSystem: struct.system ?? false,
        });
        await this.roleRepository.save(role);
        roleByKey.set(struct.key, role);
        roleIdsByKey.set(struct.key, role.id);
        idsByName.set(role.name, role.id);
        this.logger.log(`Rol creado: ${struct.key}`);
      } else {
        role.description = struct.description;
        role.isSystem = struct.system ?? role.isSystem;
        await this.roleRepository.save(role);
        roleIdsByKey.set(struct.key, role.id);
      }
    }

    for (const struct of ROLE_TREE) {
      if (!struct.parentKey) continue;
      const roleId = roleIdsByKey.get(struct.key);
      const parentId = roleIdsByKey.get(struct.parentKey);
      if (!roleId || !parentId) continue;
      await this.roleRepository.update({ id: roleId }, { parentId });
    }

    const permissionKeyById = new Map(
      permissions.map((p) => [p.id, p.key]),
    );

    for (const struct of ROLE_TREE) {
      const roleId = roleIdsByKey.get(struct.key);
      if (!roleId || !struct.permissions) continue;

      const current = await this.rolePermissionRepository.find({
        where: { roleId },
      });
      const currentPermissionIds = new Set(current.map((rp) => rp.permissionId));

      if (struct.system) {
        const allowedKeys = new Set(struct.permissions);
        const stale = current.filter((rp) => {
          const key = permissionKeyById.get(rp.permissionId);
          return key === undefined || !allowedKeys.has(key);
        });
        if (stale.length > 0) {
          await this.rolePermissionRepository.remove(stale);
        }
      }

      for (const key of struct.permissions) {
        const permission = permissionByKey.get(key);
        if (!permission) continue;
        if (currentPermissionIds.has(permission.id)) continue;
        await this.rolePermissionRepository.save(
          this.rolePermissionRepository.create({
            roleId,
            permissionId: permission.id,
          }),
        );
      }
    }
  }

  async findRoleByKey(key: string): Promise<Role | null> {
    return this.roleRepository.findOne({ where: { name: key } });
  }

  async findRoleById(id: string): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { id },
      relations: {
        parent: true,
        rolePermissions: { permission: true },
      },
    });
    if (!role) {
      throw new NotFoundException('Rol no encontrado');
    }
    return role;
  }

  async assignRole(userId: string, roleKey: string): Promise<void> {
    const role = await this.findRoleByKey(roleKey);
    if (!role) {
      throw new Error(`No existe el rol ${roleKey}`);
    }
    const exists = await this.userRoleRepository.findOne({
      where: { userId, roleId: role.id },
    });
    if (!exists) {
      await this.userRoleRepository.save(
        this.userRoleRepository.create({ userId, roleId: role.id }),
      );
    }
  }

  async replaceRoles(userId: string, roleKeys: string[]): Promise<void> {
    await this.userRoleRepository.delete({ userId });
    for (const key of roleKeys) {
      const role = await this.findRoleByKey(key);
      if (role) {
        await this.userRoleRepository.save(
          this.userRoleRepository.create({ userId, roleId: role.id }),
        );
      }
    }
  }

  async getUserRoleKeys(userId: string): Promise<string[]> {
    const userRoles = await this.userRoleRepository.find({
      where: { userId },
      relations: { role: true },
    });
    return userRoles.map((ur) => ur.role.name);
  }

  async getUserRoles(userId: string): Promise<ResolvedRole[]> {
    const userRoles = await this.userRoleRepository.find({
      where: { userId },
      relations: { role: true },
    });
    if (userRoles.length === 0) return [];

    const roleIds = userRoles.map((ur) => ur.role.id);
    const rolesWithAncestors = await this.collectWithAncestors(
      await this.roleRepository.find({ where: { id: In(roleIds) } }),
    );

    const result: ResolvedRole[] = [];
    const seen = new Set<string>();
    for (const role of rolesWithAncestors) {
      if (seen.has(role.name)) continue;
      seen.add(role.name);
      result.push({
        key: role.name,
        description: role.description,
        inherited: !roleIds.includes(role.id),
      });
    }
    return result;
  }

  private async collectWithAncestors(roles: Role[]): Promise<Role[]> {
    const result: Role[] = [...roles];
    const visited = new Set<string>(roles.map((r) => r.id));
    const queue = [...roles];

    while (queue.length > 0) {
      const current = queue.shift();
      if (!current || !current.parentId || visited.has(current.parentId)) continue;
      const parent = await this.roleRepository.findOne({
        where: { id: current.parentId },
      });
      if (!parent) continue;
      visited.add(parent.id);
      result.push(parent);
      queue.push(parent);
    }

    return result;
  }

  async getUserPermissions(userId: string): Promise<string[]> {
    const effective = await this.getUserRoles(userId);
    if (effective.length === 0) return [];

    const keys = effective.map((r) => r.key);
    const roles = await this.roleRepository.find({ where: { name: In(keys) } });
    if (roles.length === 0) return [];

    const rolePermissions = await this.rolePermissionRepository.find({
      where: { roleId: In(roles.map((r) => r.id)) },
      relations: { permission: true },
    });

    const permSet = new Set(
      rolePermissions.map((rp) => rp.permission.key).filter(Boolean),
    );
    return Array.from(permSet);
  }

  async getRolesWithPermissions(): Promise<Role[]> {
    return this.roleRepository.find({
      relations: {
        parent: true,
        rolePermissions: { permission: true },
      },
      order: { name: 'ASC' },
    });
  }

  async createRole(
    key: string,
    description?: string,
    parentKey?: string,
  ): Promise<Role> {
    const roleKey = key.trim().toUpperCase().replace(/\s+/g, '_');
    const existing = await this.roleRepository.findOne({
      where: { name: roleKey },
    });
    if (existing) {
      throw new ConflictException(`Ya existe el rol ${roleKey}`);
    }
    let parentId: string | undefined;
    if (parentKey) {
      const parent = await this.findRoleByKey(parentKey.trim().toUpperCase());
      if (!parent) {
        throw new BadRequestException(`No existe el rol padre ${parentKey}`);
      }
      parentId = parent.id;
    }
    const role = this.roleRepository.create({
      name: roleKey,
      description,
      parentId,
      isSystem: false,
    });
    return this.roleRepository.save(role);
  }

  async updateRole(
    id: string,
    data: { description?: string; parentKey?: string },
  ): Promise<Role> {
    const role = await this.findRoleById(id);
    if (data.description !== undefined) {
      role.description = data.description;
    }
    if (data.parentKey !== undefined) {
      if (data.parentKey) {
        if (data.parentKey === role.name) {
          throw new BadRequestException('Un rol no puede ser su propio padre');
        }
        const parent = await this.findRoleByKey(data.parentKey.trim().toUpperCase());
        if (!parent) {
          throw new BadRequestException(`No existe el rol padre ${data.parentKey}`);
        }
        role.parentId = parent.id;
      } else {
        role.parentId = undefined;
      }
    }
    return this.roleRepository.save(role);
  }

  async deleteRole(id: string): Promise<void> {
    const role = await this.findRoleById(id);
    if (role.isSystem) {
      throw new BadRequestException('No se puede eliminar un rol de sistema');
    }
    const assigned = await this.userRoleRepository.count({ where: { roleId: id } });
    if (assigned > 0) {
      throw new BadRequestException(
        `El rol ${role.name} está asignado a ${assigned} usuario(s) y no puede eliminarse`,
      );
    }
    await this.rolePermissionRepository.delete({ roleId: id });
    await this.userRoleRepository.delete({ roleId: id });
    await this.roleRepository.delete(id);
  }

  async setRolePermissions(roleId: string, permissionKeys: string[]): Promise<Role> {
    await this.findRoleById(roleId);
    const permissions = await this.permissionRepository.find({
      where: { key: In(permissionKeys) },
    });
    await this.rolePermissionRepository.delete({ roleId });
    for (const permission of permissions) {
      await this.rolePermissionRepository.save(
        this.rolePermissionRepository.create({
          roleId,
          permissionId: permission.id,
        }),
      );
    }
    return this.findRoleById(roleId);
  }

  async listPermissions(): Promise<Permission[]> {
    return this.permissionRepository.find({ order: { module: 'ASC', key: 'ASC' } });
  }

  async hasAnyPermission(userId: string, required: string[]): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId);
    return required.some((p) => permissions.includes(p));
  }
}