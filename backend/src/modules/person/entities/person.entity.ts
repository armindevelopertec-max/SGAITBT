import { Column, Entity, Index, OneToMany, OneToOne } from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';
import { PersonStatus, Sex } from '@common/enums';
import { Student } from '@modules/student/entities/student.entity';
import { Employee } from '@modules/employee/entities/employee.entity';
import { User } from '@modules/user/entities/user.entity';

@Entity('persons')
export class Person extends BaseEntity {
  @Column({ type: 'varchar', length: 30 })
  @Index('IDX_person_ci', { unique: true })
  ci: string;

  @Column({ name: 'ci_extension', type: 'varchar', length: 20, nullable: true })
  ciExtension?: string;

  @Column({ name: 'first_name', type: 'varchar', length: 150 })
  firstName: string;

  @Column({ name: 'paternal_surname', type: 'varchar', length: 150, nullable: true })
  paternalSurname?: string;

  @Column({ name: 'maternal_surname', type: 'varchar', length: 150, nullable: true })
  maternalSurname?: string;

  @Column({ name: 'last_name', type: 'varchar', length: 150 })
  lastName: string;

  @Column({ name: 'birth_date', type: 'date', nullable: true })
  birthDate?: Date;

  @Column({ type: 'enum', enum: Sex, nullable: true })
  sex?: Sex;

  @Column({ type: 'varchar', length: 30, nullable: true })
  phone?: string;

  @Column({ type: 'varchar', length: 150 })
  @Index('IDX_person_email', { unique: true })
  email: string;

  @Column({ type: 'text', nullable: true })
  address?: string;

  @Column({ name: 'photo_url', type: 'text', nullable: true })
  photoUrl?: string;

  @Column({
    type: 'enum',
    enum: PersonStatus,
    default: PersonStatus.ACTIVE,
  })
  status: PersonStatus;

  @OneToOne(() => User, (user) => user.person, { nullable: true })
  user?: User;

  @OneToOne(() => Student, (student) => student.person, { nullable: true })
  student?: Student;

  @OneToMany(() => Employee, (employee) => employee.person)
  employees?: Employee[];
}