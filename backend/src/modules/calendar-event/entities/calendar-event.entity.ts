import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';
import {
  CalendarEventCategory,
  CalendarEventStatus,
} from '@common/enums';
import { AcademicPeriod } from '@modules/academic-period/entities/academic-period.entity';

@Entity('calendar_events')
@Index('IDX_calendar_period', ['academicPeriodId'])
@Index('IDX_calendar_period_category', ['academicPeriodId', 'category'])
@Index('IDX_calendar_period_start', ['academicPeriodId', 'startDate'])
export class CalendarEvent extends BaseEntity {
  @Column({ type: 'varchar', length: 150 })
  title: string;

  @Column({
    type: 'enum',
    enum: CalendarEventCategory,
    default: CalendarEventCategory.OTHER,
  })
  category: CalendarEventCategory;

  @Column({ name: 'start_date', type: 'date' })
  startDate: Date;

  @Column({ name: 'end_date', type: 'date', nullable: true })
  endDate?: Date;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: CalendarEventStatus,
    default: CalendarEventStatus.ACTIVE,
  })
  status: CalendarEventStatus;

  @ManyToOne('AcademicPeriod', 'calendarEvents', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'academic_period_id' })
  academicPeriod: AcademicPeriod;

  @Column({ name: 'academic_period_id', type: 'uuid' })
  academicPeriodId: string;
}
