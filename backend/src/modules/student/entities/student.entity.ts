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
import { AcademicStatus } from '@common/enums';
import { Career } from '@modules/career/entities/career.entity';
import { Enrollment } from '@modules/enrollment/entities/enrollment.entity';
import { Deposit } from '@modules/deposit/entities/deposit.entity';
import { User } from '@modules/user/entities/user.entity';
import { Person } from '@modules/person/entities/person.entity';

@Entity('students')
export class Student extends BaseEntity {
  @Column({ name: 'diploma_number', type: 'varchar', length: 30, nullable: true })
  diplomaNumber?: string;

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

  @OneToOne(() => User, (user) => user.student, { nullable: true })
  user?: User;

  @OneToOne(() => Person, (person) => person.student, { nullable: true })
  @JoinColumn({ name: 'person_id' })
  person: Person;

  @Column({ name: 'person_id', type: 'uuid', nullable: true })
  @Index('IDX_student_person_id', { unique: true })
  personId?: string;

  @OneToMany(() => Enrollment, (enrollment) => enrollment.student)
  enrollments: Enrollment[];

  @OneToMany(() => Deposit, (deposit) => deposit.student)
  deposits: Deposit[];
}
