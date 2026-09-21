import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  Index,
} from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';
import { Person } from '@modules/person/entities/person.entity';
import { User } from '@modules/user/entities/user.entity';

@Entity('person_history')
@Index('IDX_person_history_person', ['personId'])
@Index('IDX_person_history_field', ['fieldChanged'])
@Index('IDX_person_history_changed_by', ['changedBy'])
@Index('IDX_person_history_created_at', ['createdAt'])
export class PersonHistory extends BaseEntity {
  @ManyToOne(() => Person)
  @JoinColumn({ name: 'person_id' })
  person: Person;

  @Column({ name: 'person_id', type: 'uuid' })
  personId: string;

  @Column({ name: 'field_changed', type: 'varchar', length: 50 })
  fieldChanged: string;

  @Column({ name: 'previous_value', type: 'text', nullable: true })
  previousValue?: string | null;

  @Column({ name: 'new_value', type: 'text', nullable: true })
  newValue?: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'changed_by' })
  changedBy?: User;

  @Column({ name: 'changed_by', type: 'uuid', nullable: true })
  changedById?: string;

  @Column({ name: 'client_ip', type: 'varchar', length: 50, nullable: true })
  clientIp?: string;
}
