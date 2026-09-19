import {
  Column,
  DeleteDateColumn,
  Entity,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';
import { ShiftType } from '@common/enums';
import { AcademicPeriod } from '@modules/academic-period/entities/academic-period.entity';

@Entity('parallels')
@Index('UQ_parallel_academic_period_code', ['academicPeriodId', 'code'], { unique: true })
export class Parallel extends BaseEntity {
  @Column({ name: 'academic_period_id' })
  academicPeriodId: string;

  @Column({ type: 'varchar', length: 10 })
  code: string;

  @Column({
    type: 'enum',
    enum: ShiftType,
    default: ShiftType.MANANA,
  })
  shift: ShiftType;

  @ManyToOne(() => AcademicPeriod, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'academic_period_id' })
  academicPeriod?: AcademicPeriod;

  @DeleteDateColumn()
  deletedAt?: Date;
}
