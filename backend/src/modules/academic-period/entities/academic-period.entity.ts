import {
  Column,
  Entity,
  Index,
  OneToMany,
} from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';
import { PeriodStatus } from '@common/enums';

@Entity('academic_periods')
@Index('IDX_period_year', ['year'])
@Index('UQ_period_year_name', ['year', 'periodName'], { unique: true })
export class AcademicPeriod extends BaseEntity {
  @Column({ type: 'varchar', length: 4 })
  year: string;

  @Column({ name: 'period_name', type: 'varchar', length: 100 })
  periodName: string;

  @Column({ name: 'sequence', type: 'integer', default: 1 })
  sequence: number;

  @Column({ name: 'start_date', type: 'date', nullable: true })
  startDate?: Date;

  @Column({ name: 'end_date', type: 'date', nullable: true })
  endDate?: Date;

  @Column({
    type: 'enum',
    enum: PeriodStatus,
    default: PeriodStatus.PLANNED,
  })
  status: PeriodStatus;

  @OneToMany('CalendarEvent', 'academicPeriod')
  calendarEvents?: unknown[];
}