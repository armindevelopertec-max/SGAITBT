import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  Index,
} from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';
import { AttendanceStatus } from '@common/enums';
import { Student } from '@modules/student/entities/student.entity';
import { SubjectAssignment } from '@modules/subject-assignment/entities/subject-assignment.entity';

@Entity('attendances')
@Index('IDX_attendance_student_date', ['studentId', 'attendanceDate'])
export class Attendance extends BaseEntity {
  @Column({ name: 'attendance_date', type: 'date' })
  attendanceDate: Date;

  @Column({
    type: 'enum',
    enum: AttendanceStatus,
    default: AttendanceStatus.PRESENT,
  })
  status: AttendanceStatus;

  @Column({ type: 'text', nullable: true })
  observations?: string;

  @ManyToOne(() => Student)
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @Column({ name: 'student_id', type: 'uuid' })
  @Index('IDX_attendance_student_id')
  studentId: string;

  @ManyToOne(() => SubjectAssignment, (assignment) => assignment.attendanceRecords)
  @JoinColumn({ name: 'assignment_id' })
  assignment: SubjectAssignment;

  @Column({ name: 'assignment_id', type: 'uuid' })
  @Index('IDX_attendance_assignment_id')
  assignmentId: string;
}