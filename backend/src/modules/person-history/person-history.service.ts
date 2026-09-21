import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { PersonHistory } from './entities/person-history.entity';
import { PersonHistoryQueryDto } from './dto/person-history.dto';

@Injectable()
export class PersonHistoryService {
  constructor(
    @InjectRepository(PersonHistory)
    private readonly repository: Repository<PersonHistory>,
  ) {}

  async create(
    personId: string,
    fieldChanged: string,
    previousValue: string | null,
    newValue: string | null,
    changedById?: string,
    clientIp?: string,
  ): Promise<PersonHistory> {
    const history = this.repository.create({
      personId,
      fieldChanged,
      previousValue,
      newValue,
      changedById,
      clientIp,
    });

    return this.repository.save(history);
  }

  async createBulk(
    personId: string,
    changes: Array<{
      fieldChanged: string;
      previousValue: string | null;
      newValue: string | null;
    }>,
    changedById?: string,
    clientIp?: string,
  ): Promise<PersonHistory[]> {
    const histories = changes.map((change) =>
      this.repository.create({
        personId,
        fieldChanged: change.fieldChanged,
        previousValue: change.previousValue,
        newValue: change.newValue,
        changedById,
        clientIp,
      }),
    );

    return this.repository.save(histories);
  }

  async findAll(
    query?: PersonHistoryQueryDto,
  ): Promise<PersonHistory[]> {
    const where: Record<string, unknown> = {};

    if (query?.personId) where.personId = query.personId;
    if (query?.fieldChanged) where.fieldChanged = query.fieldChanged;
    if (query?.changedById) where.changedById = query.changedById;
    if (query?.startDate) {
      where.createdAt = MoreThanOrEqual(new Date(query.startDate));
    }
    if (query?.endDate) {
      where.createdAt = LessThanOrEqual(new Date(query.endDate));
    }

    return this.repository.find({
      where,
      relations: ['person', 'changedBy'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByPerson(personId: string): Promise<PersonHistory[]> {
    return this.repository.find({
      where: { personId },
      relations: ['person', 'changedBy'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByField(
    personId: string,
    fieldChanged: string,
  ): Promise<PersonHistory[]> {
    return this.repository.find({
      where: { personId, fieldChanged },
      relations: ['person', 'changedBy'],
      order: { createdAt: 'DESC' },
    });
  }

  async getFieldHistory(
    personId: string,
    fieldChanged: string,
  ): Promise<Array<{ value: string; changedAt: Date; changedBy?: string }>> {
    const history = await this.repository.find({
      where: { personId, fieldChanged },
      relations: ['changedBy'],
      order: { createdAt: 'ASC' },
    });

    return history.map((h) => ({
      value: h.newValue || h.previousValue || '',
      changedAt: h.createdAt,
      changedBy: h.changedBy?.fullName || 'Sistema',
    }));
  }
}
