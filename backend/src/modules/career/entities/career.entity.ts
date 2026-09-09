import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  Index,
} from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';
import { Institution } from '@modules/institution/entities/institution.entity';
import { AcademicPeriod } from '@modules/academic-period/entities/academic-period.entity';
import { Subject } from '@modules/subject/entities/subject.entity';
import { Student } from '@modules/student/entities/student.entity';
import { CareerState } from '@common/enums';

@Entity('careers')
export class Career extends BaseEntity {
  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'varchar', length: 30 })
  @Index('IDX_career_code', { unique: true })
  code: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'duration_years', type: 'integer', default: 3 })
  durationYears: number;

  @Column({ name: 'number_of_levels', type: 'integer', default: 6 })
  numberOfLevels: number;

  @Column({
    type: 'enum',
    enum: CareerState,
    default: CareerState.ACTIVE,
  })
  state: CareerState;

  @Column({ name: 'study_plan', type: 'jsonb', nullable: true })
  studyPlan?: Record<string, unknown>;

  @ManyToOne(() => Institution, (institution) => institution.careers)
  @JoinColumn({ name: 'institution_id' })
  institution: Institution;

  @Column({ name: 'institution_id', type: 'uuid' })
  institutionId: string;

  @OneToMany(() => AcademicPeriod, (period) => period.career)
  academicPeriods: AcademicPeriod[];

  @OneToMany(() => Subject, (subject) => subject.career)
  subjects: Subject[];

  @OneToMany(() => Student, (student) => student.career)
  students: Student[];
}