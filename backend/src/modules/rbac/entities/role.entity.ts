import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';
import { UserRole as UserRoleJoin } from './user-role.entity';
import { RolePermission } from './role-permission.entity';

@Entity('roles')
export class Role extends BaseEntity {
  @Column({ type: 'varchar', length: 100 })
  @Index('IDX_role_name', { unique: true })
  name: string;

  @Column({ type: 'varchar', length: 250, nullable: true })
  description?: string;

  @Column({ name: 'parent_id', type: 'uuid', nullable: true })
  parentId?: string;

  @ManyToOne(() => Role, (role) => role.children, { nullable: true })
  @JoinColumn({ name: 'parent_id' })
  parent?: Role;

  @OneToMany(() => Role, (role) => role.parent)
  children?: Role[];

  @Column({ name: 'is_system', type: 'boolean', default: false })
  isSystem: boolean;

  @OneToMany(() => RolePermission, (rp) => rp.role)
  rolePermissions?: RolePermission[];

  @OneToMany(() => UserRoleJoin, (ur) => ur.role)
  userRoles?: UserRoleJoin[];
}