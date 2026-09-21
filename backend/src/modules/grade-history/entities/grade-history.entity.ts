import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  Index,
} from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';
import { GradeStatus } from '@common/enums';
import { Grade } from '@modules/grade/entities/grade.entity';
import { User } from '@modules/user/entities/user.entity';

@Entity('grade_history')
@Index('IDX_grade_history_grade_id', ['gradeId'])
@Index('IDX_grade_history_changed_by', ['changedBy'])
@Index('IDX_grade_history_created_at', ['createdAt'])
export class GradeHistory extends BaseEntity {
  @ManyToOne(() => Grade)
  @JoinColumn({ name: 'grade_id' })
  grade: Grade;

  @Column({ name: 'grade_id', type: 'uuid' })
  gradeId: string;

  @Column({ name: 'previous_first_partial', type: 'numeric', precision: 5, scale: 2, nullable: true })
  previousFirstPartial?: number | null;

  @Column({ name: 'previous_second_partial', type: 'numeric', precision: 5, scale: 2, nullable: true })
  previousSecondPartial?: number | null;

  @Column({ name: 'previous_practices', type: 'numeric', precision: 5, scale: 2, nullable: true })
  previousPractices?: number | null;

  @Column({ name: 'previous_final_exam', type: 'numeric', precision: 5, scale: 2, nullable: true })
  previousFinalExam?: number | null;

  @Column({ name: 'previous_final_grade', type: 'numeric', precision: 5, scale: 2, nullable: true })
  previousFinalGrade?: number | null;

  @Column({
    name: 'previous_status',
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  previousStatus?: GradeStatus | null;

  @Column({ name: 'new_first_partial', type: 'numeric', precision: 5, scale: 2, nullable: true })
  newFirstPartial?: number | null;

  @Column({ name: 'new_second_partial', type: 'numeric', precision: 5, scale: 2, nullable: true })
  newSecondPartial?: number | null;

  @Column({ name: 'new_practices', type: 'numeric', precision: 5, scale: 2, nullable: true })
  newPractices?: number | null;

  @Column({ name: 'new_final_exam', type: 'numeric', precision: 5, scale: 2, nullable: true })
  newFinalExam?: number | null;

  @Column({ name: 'new_final_grade', type: 'numeric', precision: 5, scale: 2, nullable: true })
  newFinalGrade?: number | null;

  @Column({
    name: 'new_status',
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  newStatus?: GradeStatus | null;

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
