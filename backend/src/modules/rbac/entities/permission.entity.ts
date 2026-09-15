import { Column, Entity, Index, OneToMany } from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';
import { PermissionAction } from '@common/enums';
import { RolePermission } from './role-permission.entity';

@Entity('permissions')
export class Permission extends BaseEntity {
  @Column({ type: 'varchar', length: 100 })
  @Index('IDX_permission_key', { unique: true })
  key: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  module?: string;

  @Column({ type: 'enum', enum: PermissionAction, default: PermissionAction.OTHER })
  action: PermissionAction;

  @Column({ type: 'varchar', length: 250, nullable: true })
  description?: string;

  @OneToMany(() => RolePermission, (rp) => rp.permission)
  rolePermissions?: RolePermission[];
}