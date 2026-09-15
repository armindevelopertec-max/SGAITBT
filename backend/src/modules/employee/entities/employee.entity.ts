import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';
import { EmployeeType } from '@common/enums';
import { Person } from '@modules/person/entities/person.entity';

@Entity('employees')
export class Employee extends BaseEntity {
  @Column({ name: 'employee_code', type: 'varchar', length: 50 })
  @Index('IDX_employee_code', { unique: true })
  employeeCode: string;

  @Column({ name: 'hire_date', type: 'date', nullable: true })
  hireDate?: Date;

  @Column({ name: 'employee_type', type: 'enum', enum: EmployeeType })
  employeeType: EmployeeType;

  @Column({ type: 'varchar', length: 150, nullable: true })
  position?: string;

  @Column({ name: 'person_id', type: 'uuid' })
  @Index('IDX_employee_person_id')
  personId: string;

  @ManyToOne(() => Person, (person) => person.employees)
  @JoinColumn({ name: 'person_id' })
  persona: Person;
}