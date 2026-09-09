import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  Index,
} from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';
import { Subject } from '@modules/subject/entities/subject.entity';
import { User } from '@modules/user/entities/user.entity';
import { AcademicPeriod } from '@modules/academic-period/entities/academic-period.entity';
import { Grade } from '@modules/grade/entities/grade.entity';
import { Attendance } from '@modules/attendance/entities/attendance.entity';
import { SubjectEnrollment } from './subject-enrollment.entity';

@Entity('subject_assignments')
@Index('IDX_assignment_subject_period', ['subjectId', 'academicPeriodId'])
export class SubjectAssignment extends BaseEntity {
  @Column({ name: 'parallel', type: 'varchar', length: 20, default: 'A' })
  parallel: string;

  @Column({ name: 'classroom', type: 'varchar', length: 50, nullable: true })
  classroom?: string;

  @Column({ name: 'schedule', type: 'jsonb', nullable: true })
  schedule?: Record<string, unknown>;

  @ManyToOne(() => Subject, (subject) => subject.assignments)
  @JoinColumn({ name: 'subject_id' })
  subject: Subject;

  @Column({ name: 'subject_id', type: 'uuid' })
  @Index('IDX_assignment_subject_id')
  subjectId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'teacher_id' })
  teacher?: User;

  @Column({ name: 'teacher_id', type: 'uuid', nullable: true })
  teacherId?: string;

  @ManyToOne(() => AcademicPeriod)
  @JoinColumn({ name: 'academic_period_id' })
  academicPeriod: AcademicPeriod;

  @Column({ name: 'academic_period_id', type: 'uuid' })
  @Index('IDX_assignment_period_id')
  academicPeriodId: string;

  @Column({ name: 'semester', type: 'integer' })
  semester: number;

  @OneToMany(() => Grade, (grade) => grade.assignment)
  grades: Grade[];

  @OneToMany(() => Attendance, (attendance) => attendance.assignment)
  attendanceRecords: Attendance[];

  @OneToMany(() => SubjectEnrollment, (enrollment) => enrollment.assignment)
  enrollments: SubjectEnrollment[];
}