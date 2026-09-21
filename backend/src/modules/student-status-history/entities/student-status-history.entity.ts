import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  Index,
} from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';
import { AcademicStatus } from '@common/enums';
import { Student } from '@modules/student/entities/student.entity';
import { Career } from '@modules/career/entities/career.entity';
import { AcademicPeriod } from '@modules/academic-period/entities/academic-period.entity';
import { User } from '@modules/user/entities/user.entity';

@Entity('student_status_history')
@Index('IDX_student_status_history_student', ['studentId'])
@Index('IDX_student_status_history_period', ['academicPeriodId'])
@Index('IDX_student_status_history_changed_by', ['changedBy'])
export class StudentStatusHistory extends BaseEntity {
  @ManyToOne(() => Student)
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @Column({ name: 'student_id', type: 'uuid' })
  studentId: string;

  @Column({
    name: 'previous_status',
    type: 'varchar',
    length: 30,
    nullable: true,
  })
  previousStatus?: AcademicStatus | null;

  @Column({
    name: 'new_status',
    type: 'varchar',
    length: 30,
    nullable: true,
  })
  newStatus?: AcademicStatus | null;

  @ManyToOne(() => Career, { nullable: true })
  @JoinColumn({ name: 'previous_career_id' })
  previousCareer?: Career;

  @Column({ name: 'previous_career_id', type: 'uuid', nullable: true })
  previousCareerId?: string;

  @ManyToOne(() => Career, { nullable: true })
  @JoinColumn({ name: 'new_career_id' })
  newCareer?: Career;

  @Column({ name: 'new_career_id', type: 'uuid', nullable: true })
  newCareerId?: string;

  @Column({ name: 'previous_level', type: 'integer', nullable: true })
  previousLevel?: number | null;

  @Column({ name: 'new_level', type: 'integer', nullable: true })
  newLevel?: number | null;

  @ManyToOne(() => AcademicPeriod, { nullable: true })
  @JoinColumn({ name: 'academic_period_id' })
  academicPeriod?: AcademicPeriod;

  @Column({ name: 'academic_period_id', type: 'uuid', nullable: true })
  academicPeriodId?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'changed_by' })
  changedBy?: User;

  @Column({ name: 'changed_by', type: 'uuid', nullable: true })
  changedById?: string;

  @Column({ type: 'text', nullable: true })
  changeReason?: string;

  @Column({ name: 'client_ip', type: 'varchar', length: 50, nullable: true })
  clientIp?: string;
}
