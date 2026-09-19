import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  Index,
} from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';
import { Student } from '@modules/student/entities/student.entity';
import { SubjectAssignment } from './subject-assignment.entity';
import { AcademicPeriod } from '@modules/academic-period/entities/academic-period.entity';

@Entity('subject_enrollments')
@Index('IDX_subject_enrollment_student', ['studentId'])
@Index('IDX_subject_enrollment_assignment', ['assignmentId'])
export class SubjectEnrollment extends BaseEntity {
  @ManyToOne(() => Student)
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @Column({ name: 'student_id', type: 'uuid' })
  studentId: string;

  @ManyToOne(() => SubjectAssignment, (assignment) => assignment.enrollments)
  @JoinColumn({ name: 'assignment_id' })
  assignment: SubjectAssignment;

  @Column({ name: 'assignment_id', type: 'uuid' })
  assignmentId: string;

  @ManyToOne(() => AcademicPeriod)
  @JoinColumn({ name: 'academic_period_id' })
  academicPeriod: AcademicPeriod;

  @Column({ name: 'academic_period_id', type: 'uuid' })
  academicPeriodId: string;
}
