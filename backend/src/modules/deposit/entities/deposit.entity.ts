import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  Index,
} from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';
import { DepositConcept, DepositStatus } from '@common/enums';
import { Student } from '@modules/student/entities/student.entity';
import { Person } from '@modules/person/entities/person.entity';

@Entity('deposits')
@Index('IDX_deposit_student', ['studentId'])
export class Deposit extends BaseEntity {
  @Column({ name: 'deposit_number', type: 'varchar', length: 100 })
  @Index('IDX_deposit_number', { unique: true })
  depositNumber: string;

  @Column({ name: 'deposit_date', type: 'date' })
  depositDate: Date;

  @Column({ name: 'amount', type: 'numeric', precision: 12, scale: 2 })
  amount: number;

  @Column({
    type: 'enum',
    enum: DepositConcept,
    default: DepositConcept.MATRICULA,
  })
  concept: DepositConcept;

  @Column({ name: 'concept_detail', type: 'varchar', length: 255, nullable: true })
  conceptDetail?: string;

  @Column({ name: 'voucher_url', type: 'text', nullable: true })
  voucherUrl?: string;

  @Column({
    name: 'verification_status',
    type: 'enum',
    enum: DepositStatus,
    default: DepositStatus.PENDING,
  })
  status: DepositStatus;

  @Column({ name: 'verification_comment', type: 'text', nullable: true })
  verificationComment?: string;

  @Column({ name: 'verification_date', type: 'timestamptz', nullable: true })
  verificationDate?: Date;

  @Column({ name: 'verified_by', type: 'varchar', length: 200, nullable: true })
  verifiedBy?: string;

  @ManyToOne(() => Student, (student) => student.deposits)
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @Column({ name: 'student_id', type: 'uuid', nullable: true })
  studentId?: string;

  // Aspirante: person aún sin ficha de estudiante.
  @ManyToOne(() => Person, { nullable: true })
  @JoinColumn({ name: 'person_id' })
  person?: Person;

  @Column({ name: 'person_id', type: 'uuid', nullable: true })
  @Index('IDX_deposit_person')
  personId?: string;

  get beneficiaryType(): 'student' | 'person' | null {
    if (this.studentId) return 'student';
    if (this.personId) return 'person';
    return null;
  }
}