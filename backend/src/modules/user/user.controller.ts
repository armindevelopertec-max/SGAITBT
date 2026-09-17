import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UserService } from './user.service';
import {
  CreateUserDto,
  UpdateUserDto,
  ResetPasswordDto,
  UserQueryDto,
} from './dto/user.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { PermissionsGuard } from '@common/guards/permissions.guard';
import { RequirePermission } from '@common/decorators/require-permission.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { PERMISSIONS } from '@common/permissions';
import { User } from './entities/user.entity';
import { RbacService } from '@modules/rbac/rbac.service';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly rbacService: RbacService,
  ) {}

  @Post()
  @RequirePermission(PERMISSIONS.USERS_CREATE)
  create(@Body() dto: CreateUserDto) {
    return this.userService.create(dto);
  }

  @Post('student/:studentId')
  @RequirePermission(PERMISSIONS.USERS_CREATE)
  createStudentUser(@Param('studentId') studentId: string) {
    return this.userService.createStudentUser(studentId);
  }

  @Get()
  @RequirePermission(PERMISSIONS.USERS_VIEW)
  findAll(@Query() query: UserQueryDto) {
    return this.userService.findAll(query);
  }

  @Get('role/:role')
  @RequirePermission(
    PERMISSIONS.USERS_VIEW,
    PERMISSIONS.ASSIGNMENTS_VIEW,
    PERMISSIONS.GRADES_VIEW,
  )
  findByRole(@Param('role') role: string) {
    return this.userService.findByRole(role);
  }

  @Get('counts/by-role')
  @RequirePermission(PERMISSIONS.USERS_VIEW)
  countByRole() {
    return this.userService.countByRole();
  }

  @Get('roles')
  @RequirePermission(PERMISSIONS.ROLES_VIEW, PERMISSIONS.USERS_VIEW)
  async listRoles() {
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

  @Get('me')
  async findMe(@CurrentUser() user: User) {
    const [userInfo, roles, permissions] = await Promise.all([
      this.userService.findOne(user.id),
      this.rbacService.getUserRoles(user.id),
      this.rbacService.getUserPermissions(user.id),
    ]);
    return {
      ...userInfo,
      roles: roles.map((r) => r.key),
      permissions,
    };
  }

  @Get(':id')
  @RequirePermission(PERMISSIONS.USERS_VIEW)
  async findOne(@Param('id') id: string) {
    const [user, roles, permissions] = await Promise.all([
      this.userService.findOne(id),
      this.rbacService.getUserRoles(id),
      this.rbacService.getUserPermissions(id),
    ]);
    return {
      ...user,
      roles: roles.map((r) => r.key),
      permissions,
    };
  }

  @Patch(':id')
  @RequirePermission(PERMISSIONS.USERS_UPDATE)
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.userService.update(id, dto);
  }

  @Patch(':id/roles')
  @RequirePermission(PERMISSIONS.USERS_UPDATE)
  updateRoles(@Param('id') id: string, @Body('roleKeys') roleKeys: string[]) {
    return this.userService.updateUserRoles(id, roleKeys);
  }

  @Patch(':id/reset-password')
  @RequirePermission(PERMISSIONS.USERS_UPDATE)
  resetPassword(@Param('id') id: string, @Body() dto: ResetPasswordDto) {
    return this.userService.resetPassword(id, dto);
  }
}