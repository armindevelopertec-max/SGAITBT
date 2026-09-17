import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { RbacService } from './rbac.service';
import {
  CreateRoleDto,
  UpdateRoleDto,
  UpdateRolePermissionsDto,
} from './dto/role.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { PermissionsGuard } from '@common/guards/permissions.guard';
import { RequirePermission } from '@common/decorators/require-permission.decorator';
import { Audit } from '@common/decorators/audit.decorator';
import { BadRequestException } from '@nestjs/common';
import { PERMISSIONS } from '@common/permissions';

@ApiTags('Roles')
@Controller('roles')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class RolesController {
  constructor(private readonly rbacService: RbacService) {}

  @Get('permissions')
  @RequirePermission(PERMISSIONS.ROLES_VIEW)
  listPermissions() {
    return this.rbacService.listPermissions();
  }

  @Get()
  @RequirePermission(PERMISSIONS.ROLES_VIEW)
  async findAll() {
    const roles = await this.rbacService.getRolesWithPermissions();
    return roles.map((role) => ({
      id: role.id,
      name: role.name,
      description: role.description,
      parentId: role.parentId,
      parentName: role.parent?.name ?? null,
      isSystem: role.isSystem,
      isActive: role.isActive,
      permissions: (role.rolePermissions ?? []).map((rp) => rp.permission.key),
    }));
  }

  @Get(':id')
  @RequirePermission(PERMISSIONS.ROLES_VIEW)
  findOne(@Param('id') id: string) {
    return this.rbacService.findRoleById(id);
  }

  @Post()
  @RequirePermission(PERMISSIONS.ROLES_MANAGE)
  @Audit({ module: 'roles', action: 'CREATE', entityType: 'Role' })
  create(@Body() dto: CreateRoleDto) {
    return this.rbacService.createRole(dto.name, dto.description, dto.parentKey);
  }

  @Patch(':id')
  @RequirePermission(PERMISSIONS.ROLES_MANAGE)
  @Audit({ module: 'roles', action: 'UPDATE', entityType: 'Role', entityIdFrom: 'params' })
  update(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
    return this.rbacService.updateRole(id, dto);
  }

  @Patch(':id/permissions')
  @RequirePermission(PERMISSIONS.ROLES_MANAGE)
  @Audit({
    module: 'roles',
    action: 'UPDATE_PERMISSIONS',
    entityType: 'Role',
    entityIdFrom: 'params',
  })
  setPermissions(@Param('id') id: string, @Body() dto: UpdateRolePermissionsDto) {
    if (!dto.permissionKeys || dto.permissionKeys.length === 0) {
      throw new BadRequestException('Debe indicar al menos un permiso');
    }
    return this.rbacService.setRolePermissions(id, dto.permissionKeys);
  }

  @Delete(':id')
  @RequirePermission(PERMISSIONS.ROLES_MANAGE)
  @Audit({ module: 'roles', action: 'DELETE', entityType: 'Role', entityIdFrom: 'params' })
  remove(@Param('id') id: string) {
    return this.rbacService.deleteRole(id);
  }
}