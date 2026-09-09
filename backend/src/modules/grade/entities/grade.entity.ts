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
import { SubjectAssignment } from '@modules/subject-assignment/entities/subject-assignment.entity';

@Entity('grades')
@Index('IDX_grade_student_assignment', ['studentId', 'assignmentId'], { unique: true })
export class Grade extends BaseEntity {
  @Column({ name: 'first_partial', type: 'numeric', precision: 5, scale: 2, nullable: true })
  firstPartial?: number;

  @Column({ name: 'second_partial', type: 'numeric', precision: 5, scale: 2, nullable: true })
  secondPartial?: number;

  @Column({ name: 'practices', type: 'numeric', precision: 5, scale: 2, nullable: true })
  practices?: number;

  @Column({ name: 'final_exam', type: 'numeric', precision: 5, scale: 2, nullable: true })
  finalExam?: number;

  @Column({ name: 'final_grade', type: 'numeric', precision: 5, scale: 2, nullable: true })
  finalGrade?: number;

  @Column({
    type: 'enum',
    enum: GradeStatus,
    default: GradeStatus.PENDING,
  })
  status: GradeStatus;

  @ManyToOne(() => Student)
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @Column({ name: 'student_id', type: 'uuid' })
  @Index('IDX_grade_student_id')
  studentId: string;

  @ManyToOne(() => SubjectAssignment, (assignment) => assignment.grades)
  @JoinColumn({ name: 'assignment_id' })
  assignment: SubjectAssignment;

  @Column({ name: 'assignment_id', type: 'uuid' })
  @Index('IDX_grade_assignment_id')
  assignmentId: string;
}