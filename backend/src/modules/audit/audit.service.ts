import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';

export interface AuditRecordInput {
  userId?: string;
  username?: string;
  action: string;
  module: string;
  entityType?: string;
  entityId?: string;
  previousValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
  ip?: string;
  description?: string;
}

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepository: Repository<AuditLog>,
  ) {}

  async record(input: AuditRecordInput): Promise<AuditLog> {
    const entry = this.auditRepository.create({
      userId: input.userId,
      username: input.username,
      action: input.action,
      module: input.module,
      entityType: input.entityType,
      entityId: input.entityId?.toString(),
      previousValue: input.previousValue ?? null,
      newValue: input.newValue ?? null,
      ip: input.ip,
      description: input.description,
    });
    return this.auditRepository.save(entry);
  }

  async findAll(filters?: {
    userId?: string;
    module?: string;
    action?: string;
    take?: number;
    skip?: number;
  }): Promise<[AuditLog[], number]> {
    const qb = this.auditRepository
      .createQueryBuilder('audit')
      .orderBy('audit.createdAt', 'DESC')
      .take(filters?.take ?? 100)
      .skip(filters?.skip ?? 0);

    if (filters?.userId) qb.andWhere('audit.userId = :userId', { userId: filters.userId });
    if (filters?.module) qb.andWhere('audit.module = :module', { module: filters.module });
    if (filters?.action) qb.andWhere('audit.action = :action', { action: filters.action });

    return qb.getManyAndCount();
  }

  async findByEntity(entityType: string, entityId: string): Promise<AuditLog[]> {
    return this.auditRepository.find({
      where: { entityType, entityId },
      order: { createdAt: 'DESC' },
    });
  }
}