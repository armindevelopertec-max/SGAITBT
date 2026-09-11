import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  Index,
} from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';
import { Career } from '@modules/career/entities/career.entity';
import { SubjectAssignment } from '@modules/subject-assignment/entities/subject-assignment.entity';

@Entity('subjects')
@Index('IDX_subject_career_semester', ['careerId', 'semester'])
@Index('IDX_subject_career_code', ['careerId', 'code'], { unique: true })
export class Subject extends BaseEntity {
  @Column({ type: 'varchar', length: 30 })
  code: string;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ name: 'semester', type: 'integer' })
  semester: number;

  @Column({ name: 'weekly_hours', type: 'integer', default: 0 })
  weeklyHours: number;

  @Column({ name: 'total_hours', type: 'integer', default: 0 })
  totalHours: number;

  @Column({ name: 'prerequisites', type: 'simple-json', nullable: true })
  prerequisites?: string[];

  @Column({ name: 'is_elective', type: 'boolean', default: false })
  isElective: boolean;

  @ManyToOne(() => Career, (career) => career.subjects)
  @JoinColumn({ name: 'career_id' })
  career: Career;

  @Column({ name: 'career_id', type: 'uuid' })
  @Index('IDX_subject_career_id')
  careerId: string;

  @OneToMany(() => SubjectAssignment, (assignment) => assignment.subject)
  assignments: SubjectAssignment[];
}