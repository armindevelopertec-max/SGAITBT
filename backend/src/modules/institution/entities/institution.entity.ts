import {
  Column,
  Entity,
  OneToMany,
  Index,
} from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';
import { Career } from '@modules/career/entities/career.entity';

@Entity('institutions')
export class Institution extends BaseEntity {
  @Column({ name: 'institution_name', type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'varchar', length: 300, unique: true })
  @Index('IDX_institution_slug', { unique: true })
  slug: string;

  @Column({ name: 'institution_code', type: 'varchar', length: 50 })
  code: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description?: string;

  @Column({ type: 'text', nullable: true })
  address?: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  phone?: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  phoneSecondary?: string;

  @Column({ name: 'institutional_email', type: 'varchar', length: 150, nullable: true })
  email?: string;

  @Column({ name: 'rector_name', type: 'varchar', length: 200, nullable: true })
  rectorName?: string;

  @Column({ name: 'rector_signature', type: 'text', nullable: true })
  rectorSignature?: string;

  @Column({ name: 'logo_url', type: 'text', nullable: true })
  logoUrl?: string;

  @Column({ name: 'academic_regulation', type: 'text', nullable: true })
  academicRegulation?: string;

  @Column({ name: 'document_config', type: 'jsonb', nullable: true })
  documentConfig?: Record<string, unknown>;

  @OneToMany(() => Career, (career) => career.institution)
  careers: Career[];
}