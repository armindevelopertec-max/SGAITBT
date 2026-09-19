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
import { Employee } from '@modules/employee/entities/employee.entity';
import { AcademicPeriod } from '@modules/academic-period/entities/academic-period.entity';
import { Grade } from '@modules/grade/entities/grade.entity';
import { Attendance } from '@modules/attendance/entities/attendance.entity';
import { SubjectEnrollment } from './subject-enrollment.entity';
import { Parallel } from '@modules/parallel/entities/parallel.entity';

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

  @ManyToOne(() => Employee, { nullable: true })
  @JoinColumn({ name: 'employee_id' })
  employee?: Employee;

  @Column({ name: 'employee_id', type: 'uuid', nullable: true })
  @Index('IDX_assignment_employee_id')
  employeeId?: string;

  @ManyToOne(() => AcademicPeriod)
  @JoinColumn({ name: 'academic_period_id' })
  academicPeriod: AcademicPeriod;

  @Column({ name: 'academic_period_id', type: 'uuid' })
  @Index('IDX_assignment_period_id')
  academicPeriodId: string;

  @ManyToOne(() => Parallel, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'parallel_id' })
  parallelEntity?: Parallel;

  @Column({ name: 'parallel_id', type: 'uuid', nullable: true })
  parallelId?: string;

  @Column({ name: 'semester', type: 'integer' })
  semester: number;

  @OneToMany(() => Grade, (grade) => grade.assignment)
  grades: Grade[];

  @OneToMany(() => Attendance, (attendance) => attendance.assignment)
  attendanceRecords: Attendance[];

  @OneToMany(() => SubjectEnrollment, (enrollment) => enrollment.assignment)
  enrollments: SubjectEnrollment[];
}