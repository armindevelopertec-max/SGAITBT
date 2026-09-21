import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  Index,
} from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';
import { EmployeeType } from '@common/enums';
import { Employee } from '@modules/employee/entities/employee.entity';
import { Career } from '@modules/career/entities/career.entity';
import { AcademicPeriod } from '@modules/academic-period/entities/academic-period.entity';

@Entity('employee_history')
@Index('IDX_employee_history_employee', ['employeeId'])
@Index('IDX_employee_history_period', ['academicPeriodId'])
export class EmployeeHistory extends BaseEntity {
  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @Column({ name: 'employee_id', type: 'uuid' })
  employeeId: string;

  @ManyToOne(() => Career, { nullable: true })
  @JoinColumn({ name: 'career_id' })
  career?: Career;

  @Column({ name: 'career_id', type: 'uuid', nullable: true })
  careerId?: string;

  @ManyToOne(() => AcademicPeriod)
  @JoinColumn({ name: 'academic_period_id' })
  academicPeriod: AcademicPeriod;

  @Column({ name: 'academic_period_id', type: 'uuid' })
  academicPeriodId: string;

  @Column({
    name: 'employee_type',
    type: 'enum',
    enum: EmployeeType,
  })
  employeeType: EmployeeType;

  @Column({ name: 'position', type: 'varchar', length: 150, nullable: true })
  position?: string;

  @Column({ name: 'subjects_taught', type: 'int', default: 0 })
  subjectsTaught: number;

  @Column({ name: 'parallels_taught', type: 'int', default: 0 })
  parallelsTaught: number;

  @Column({ name: 'total_hours', type: 'int', default: 0 })
  totalHours: number;

  @Column({ type: 'text', nullable: true })
  observations?: string;
}
