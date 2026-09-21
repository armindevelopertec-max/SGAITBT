import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  OneToMany,
  Index,
} from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';
import { UserStatus } from '@common/enums';
import { Student } from '@modules/student/entities/student.entity';
import { Person } from '@modules/person/entities/person.entity';
import { Employee } from '@modules/employee/entities/employee.entity';
import { UserRole } from '@modules/rbac/entities/user-role.entity';

@Entity('users')
export class User extends BaseEntity {
  @Column({ type: 'varchar', length: 150, unique: true })
  @Index('IDX_user_username', { unique: true })
  username: string;

  @Column({ type: 'varchar', length: 300 })
  passwordHash: string;

  @Column({ type: 'varchar', length: 150, unique: true })
  @Index('IDX_user_email', { unique: true })
  email: string;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  status: UserStatus;

  @Column({ name: 'last_login', type: 'timestamptz', nullable: true })
  lastLogin?: Date;

  @Column({ name: 'failed_attempts', type: 'integer', default: 0 })
  failedAttempts: number;

  @Column({ name: 'must_change_password', type: 'boolean', default: true })
  mustChangePassword: boolean;

  @Column({ name: 'photo_url', type: 'text', nullable: true })
  photoUrl?: string;

  @OneToOne(() => Student, (student) => student.user, { nullable: true })
  @JoinColumn({ name: 'student_id' })
  student?: Student;

  @Column({ name: 'student_id', type: 'uuid', nullable: true })
  @Index('IDX_user_student_id', { unique: true })
  studentId?: string;

  @OneToOne(() => Person, (person) => person.user, { nullable: true })
  @JoinColumn({ name: 'person_id' })
  person?: Person;

  @Column({ name: 'person_id', type: 'uuid', nullable: true })
  @Index('IDX_user_person_id', { unique: true })
  personId?: string;

  @Column({ name: 'employee_id', type: 'uuid', nullable: true })
  @Index('IDX_user_employee_id', { unique: true })
  employeeId?: string;

  @OneToOne(() => Employee, (employee) => employee.user, { nullable: true })
  @JoinColumn({ name: 'employee_id' })
  employee?: Employee;

  @OneToMany(() => UserRole, (userRole) => userRole.user)
  userRoles?: UserRole[];

  get fullName(): string {
    if (this.student?.person) {
      const p = this.student.person;
      const paternal = p.paternalSurname || '';
      const maternal = p.maternalSurname || '';
      return [p.firstName, paternal, maternal].filter(Boolean).join(' ').trim() || this.username;
    }
    if (this.person) {
      const p = this.person;
      const paternal = p.paternalSurname || '';
      const maternal = p.maternalSurname || '';
      return [p.firstName, paternal, maternal].filter(Boolean).join(' ').trim() || this.username;
    }
    return this.username;
  }
}