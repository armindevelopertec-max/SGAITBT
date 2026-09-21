import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  Index,
} from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';
import { AcademicStatus, EnrollmentStatus, EnrollmentType } from '@common/enums';
import { Student } from '@modules/student/entities/student.entity';
import { Career } from '@modules/career/entities/career.entity';
import { AcademicPeriod } from '@modules/academic-period/entities/academic-period.entity';

@Entity('enrollments')
@Index('IDX_enrollment_student_period', ['studentId', 'academicPeriodId'])
export class Enrollment extends BaseEntity {
  @Column({ name: 'enrollment_number', type: 'varchar', length: 50 })
  @Index('IDX_enrollment_number', { unique: true })
  enrollmentNumber: string;

  @Column({ name: 'enrollment_date', type: 'date' })
  enrollmentDate: Date;

  @Column({
    name: 'status',
    type: 'enum',
    enum: EnrollmentStatus,
    default: EnrollmentStatus.ACTIVE,
  })
  status: EnrollmentStatus;

  @Column({
    name: 'enrollment_type',
    type: 'enum',
    enum: EnrollmentType,
    default: EnrollmentType.REGULAR,
  })
  enrollmentType: EnrollmentType;

  @Column({
    name: 'student_status',
    type: 'enum',
    enum: AcademicStatus,
    nullable: true,
  })
  studentStatus?: AcademicStatus;

  @Column({ name: 'total_amount', type: 'numeric', precision: 12, scale: 2, nullable: true })
  totalAmount?: number;

  @Column({ name: 'observations', type: 'text', nullable: true })
  observations?: string;

  @ManyToOne(() => Student, (student) => student.enrollments)
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @Column({ name: 'student_id', type: 'uuid' })
  @Index('IDX_enrollment_student_id')
  studentId: string;

  @ManyToOne(() => Career)
  @JoinColumn({ name: 'career_id' })
  career: Career;

  @Column({ name: 'career_id', type: 'uuid' })
  careerId: string;

  @ManyToOne(() => AcademicPeriod)
  @JoinColumn({ name: 'academic_period_id' })
  academicPeriod: AcademicPeriod;

  @Column({ name: 'academic_period_id', type: 'uuid' })
  @Index('IDX_enrollment_period_id')
  academicPeriodId: string;
}