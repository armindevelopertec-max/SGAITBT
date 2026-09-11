import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  Index,
} from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';
import { Career } from '@modules/career/entities/career.entity';
import { PeriodStatus } from '@common/enums';

@Entity('academic_periods')
@Index('IDX_period_career_year', ['careerId', 'year'])
export class AcademicPeriod extends BaseEntity {
  @Column({ type: 'varchar', length: 4 })
  year: string;

  @Column({ name: 'period_name', type: 'varchar', length: 100 })
  periodName: string;

  @Column({ name: 'sequence', type: 'integer', default: 1 })
  sequence: number;

  @Column({ name: 'start_date', type: 'date' })
  startDate: Date;

  @Column({ name: 'end_date', type: 'date' })
  endDate: Date;

  @Column({
    type: 'enum',
    enum: PeriodStatus,
    default: PeriodStatus.OPEN,
  })
  status: PeriodStatus;

  @ManyToOne(() => Career, (career) => career.academicPeriods)
  @JoinColumn({ name: 'career_id' })
  career: Career;

  @Column({ name: 'career_id', type: 'uuid' })
  @Index('IDX_academic_career_id')
  careerId: string;
}