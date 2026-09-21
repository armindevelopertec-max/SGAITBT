import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  Index,
} from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';
import { OfficialType } from '@common/enums';
import { Person } from '@modules/person/entities/person.entity';
import { Employee } from '@modules/employee/entities/employee.entity';
import { Career } from '@modules/career/entities/career.entity';

@Entity('institutional_official_history')
@Index('IDX_official_type_period', ['officialType', 'startDate'])
@Index('IDX_official_career', ['careerId'])
export class InstitutionalOfficialHistory extends BaseEntity {
  @Column({
    name: 'official_type',
    type: 'enum',
    enum: OfficialType,
  })
  officialType: OfficialType;

  @ManyToOne(() => Person, { nullable: true })
  @JoinColumn({ name: 'person_id' })
  person?: Person;

  @Column({ name: 'person_id', type: 'uuid', nullable: true })
  personId?: string;

  @ManyToOne(() => Employee, { nullable: true })
  @JoinColumn({ name: 'employee_id' })
  employee?: Employee;

  @Column({ name: 'employee_id', type: 'uuid', nullable: true })
  employeeId?: string;

  @ManyToOne(() => Career, { nullable: true })
  @JoinColumn({ name: 'career_id' })
  career?: Career;

  @Column({ name: 'career_id', type: 'uuid', nullable: true })
  careerId?: string;

  @Column({ name: 'full_name', type: 'varchar', length: 200 })
  fullName: string;

  @Column({ name: 'start_date', type: 'date' })
  startDate: Date;

  @Column({ name: 'end_date', type: 'date', nullable: true })
  endDate?: Date;

  @Column({ name: 'start_gestion', type: 'varchar', length: 4 })
  startGestion: string;

  @Column({ name: 'end_gestion', type: 'varchar', length: 4, nullable: true })
  endGestion?: string;

  @Column({ type: 'text', nullable: true })
  observations?: string;

  @Column({ name: 'is_vacant', type: 'boolean', default: false })
  isVacant: boolean;
}
