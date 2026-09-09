import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  OneToMany,
  Index,
} from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';
import { AcademicStatus, Sex } from '@common/enums';
import { Career } from '@modules/career/entities/career.entity';
import { AcademicPeriod } from '@modules/academic-period/entities/academic-period.entity';
import { Enrollment } from '@modules/enrollment/entities/enrollment.entity';
import { Deposit } from '@modules/deposit/entities/deposit.entity';
import { User } from '@modules/user/entities/user.entity';

@Entity('students')
export class Student extends BaseEntity {
  @Column({ type: 'varchar', length: 150 })
  firstName: string;

  @Column({ type: 'varchar', length: 150 })
  lastName: string;

  @Column({ type: 'varchar', length: 30 })
  @Index('IDX_student_ci', { unique: true })
  ci: string;

  @Column({ name: 'ci_extension', type: 'varchar', length: 20, nullable: true })
  ciExtension?: string;

  @Column({ name: 'birth_date', type: 'date' })
  birthDate: Date;

  @Column({ type: 'enum', enum: Sex, nullable: true })
  sex?: Sex;

  @Column({ type: 'varchar', length: 30, nullable: true })
  phone?: string;

  @Column({ type: 'text', nullable: true })
  address?: string;

  @Column({ type: 'varchar', length: 150, unique: true })
  @Index('IDX_student_email', { unique: true })
  email: string;

  @Column({ name: 'photo_url', type: 'text', nullable: true })
  photoUrl?: string;

  @Column({ name: 'student_code', type: 'varchar', length: 50 })
  @Index('IDX_student_code', { unique: true })
  studentCode: string;

  @Column({
    name: 'academic_status',
    type: 'enum',
    enum: AcademicStatus,
    default: AcademicStatus.PRE_ENROLLED,
  })
  status: AcademicStatus;

  @Column({ name: 'current_level', type: 'integer', default: 1 })
  currentLevel: number;

  @ManyToOne(() => Career, (career) => career.students)
  @JoinColumn({ name: 'career_id' })
  career: Career;

  @Column({ name: 'career_id', type: 'uuid', nullable: true })
  careerId?: string;

  @ManyToOne(() => AcademicPeriod, { nullable: true })
  @JoinColumn({ name: 'current_period_id' })
  currentPeriod?: AcademicPeriod;

  @Column({ name: 'current_period_id', type: 'uuid', nullable: true })
  currentPeriodId?: string;

  @OneToOne(() => User, (user) => user.student, { nullable: true })
  user?: User;

  @OneToMany(() => Enrollment, (enrollment) => enrollment.student)
  enrollments: Enrollment[];

  @OneToMany(() => Deposit, (deposit) => deposit.student)
  deposits: Deposit[];
}