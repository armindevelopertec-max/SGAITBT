import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  Index,
} from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';
import { GradeStatus } from '@common/enums';
import { Student } from '@modules/student/entities/student.entity';
import { Subject } from '@modules/subject/entities/subject.entity';
import { AcademicPeriod } from '@modules/academic-period/entities/academic-period.entity';
import { Career } from '@modules/career/entities/career.entity';

@Entity('academic_history')
@Index('IDX_history_student_period', ['studentId', 'academicPeriodId'])
export class AcademicHistory extends BaseEntity {
  @ManyToOne(() => Student)
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @Column({ name: 'student_id', type: 'uuid' })
  @Index('IDX_history_student_id')
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
  @Index('IDX_history_period_id')
  academicPeriodId: string;

  @ManyToOne(() => Subject)
  @JoinColumn({ name: 'subject_id' })
  subject: Subject;

  @Column({ name: 'subject_id', type: 'uuid' })
  subjectId: string;

  @Column({ name: 'semester', type: 'integer' })
  semester: number;

  @Column({ name: 'final_grade', type: 'numeric', precision: 5, scale: 2, nullable: true })
  finalGrade?: number | null;

  @Column({
    type: 'enum',
    enum: GradeStatus,
    default: GradeStatus.PENDING,
  })
  status: GradeStatus;

  @Column({ name: 'is_reevaluation', type: 'boolean', default: false })
  isReevaluation: boolean;
}