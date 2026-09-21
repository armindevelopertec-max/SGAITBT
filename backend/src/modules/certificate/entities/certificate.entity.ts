import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  Index,
} from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';
import { CertificateType, CertificateStatus } from '@common/enums';
import { Student } from '@modules/student/entities/student.entity';
import { Enrollment } from '@modules/enrollment/entities/enrollment.entity';
import { User } from '@modules/user/entities/user.entity';

@Entity('certificates')
@Index('IDX_certificate_student', ['studentId'])
@Index('IDX_certificate_verification', ['verificationCode'], { unique: true })
@Index('IDX_certificate_type_status', ['certificateType', 'status'])
export class Certificate extends BaseEntity {
  @Column({
    name: 'certificate_type',
    type: 'enum',
    enum: CertificateType,
  })
  certificateType: CertificateType;

  @ManyToOne(() => Student)
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @Column({ name: 'student_id', type: 'uuid' })
  studentId: string;

  @ManyToOne(() => Enrollment, { nullable: true })
  @JoinColumn({ name: 'enrollment_id' })
  enrollment?: Enrollment;

  @Column({ name: 'enrollment_id', type: 'uuid', nullable: true })
  enrollmentId?: string;

  @Column({
    name: 'verification_code',
    type: 'varchar',
    length: 32,
    unique: true,
  })
  verificationCode: string;

  @Column({
    name: 'document_number',
    type: 'varchar',
    length: 50,
  })
  documentNumber: string;

  @Column({ name: 'issued_at', type: 'timestamptz' })
  issuedAt: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'issued_by' })
  issuedBy: User;

  @Column({ name: 'issued_by', type: 'uuid' })
  issuedById: string;

  @Column({ name: 'valid_until', type: 'date', nullable: true })
  validUntil?: Date;

  @Column({
    name: 'status',
    type: 'enum',
    enum: CertificateStatus,
    default: CertificateStatus.ACTIVE,
  })
  status: CertificateStatus;

  @Column({ name: 'revoked_at', type: 'timestamptz', nullable: true })
  revokedAt?: Date;

  @Column({ name: 'revoked_reason', type: 'text', nullable: true })
  revokedReason?: string;

  @Column({ name: 'revoked_by', type: 'uuid', nullable: true })
  revokedById?: string;

  @Column({ name: 'pdf_url', type: 'text', nullable: true })
  pdfUrl?: string;

  @Column({ name: 'metadata', type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @Column({ name: 'content_hash', type: 'varchar', length: 64, nullable: true })
  contentHash?: string;
}
