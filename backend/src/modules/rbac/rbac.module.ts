import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { UserRole } from './entities/user-role.entity';
import { RolePermission } from './entities/role-permission.entity';
import { RbacService } from './rbac.service';
import { RolesController } from './roles.controller';
import { AuditModule } from '@modules/audit/audit.module';

@Module({
  imports: [TypeOrmModule.forFeature([Role, Permission, UserRole, RolePermission]), AuditModule],
  providers: [RbacService],
  controllers: [RolesController],
  exports: [RbacService, TypeOrmModule],
})
export class RbacModule {}