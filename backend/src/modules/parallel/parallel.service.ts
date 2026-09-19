import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Parallel } from './entities/parallel.entity';
import { SubjectAssignment } from '../subject-assignment/entities/subject-assignment.entity';
import { CreateParallelDto, UpdateParallelDto } from './dto/parallel.dto';

@Injectable()
export class ParallelService {
  constructor(
    @InjectRepository(Parallel)
    private readonly parallelRepository: Repository<Parallel>,
    @InjectRepository(SubjectAssignment)
    private readonly subjectAssignmentRepository: Repository<SubjectAssignment>,
  ) {}

  async create(dto: CreateParallelDto): Promise<Parallel> {
    const existing = await this.parallelRepository.findOne({
      where: {
        academicPeriodId: dto.academicPeriodId,
        code: dto.code,
      },
      withDeleted: true,
    });
    if (existing) {
      if (existing.deletedAt) {
        await this.parallelRepository.restore(existing.id);
        const restored = await this.parallelRepository.findOne({ where: { id: existing.id } });
        if (restored) {
          Object.assign(restored, dto);
          return this.parallelRepository.save(restored);
        }
      }
      throw new BadRequestException('Ya existe un paralelo con este código en el periodo');
    }

    const parallel = this.parallelRepository.create(dto);
    return this.parallelRepository.save(parallel);
  }

  async findAll(academicPeriodId?: string): Promise<Parallel[]> {
    const where: Record<string, unknown> = {};
    if (academicPeriodId) {
      where.academicPeriodId = academicPeriodId;
    }
    return this.parallelRepository.find({
      where,
      relations: ['academicPeriod'],
      order: { code: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Parallel> {
    const parallel = await this.parallelRepository.findOne({
      where: { id },
      relations: ['academicPeriod'],
    });
    if (!parallel) {
      throw new NotFoundException('Paralelo no encontrado');
    }
    return parallel;
  }

  async findByAcademicPeriod(academicPeriodId: string): Promise<Parallel[]> {
    return this.parallelRepository.find({
      where: { academicPeriodId },
      order: { code: 'ASC' },
    });
  }

  async update(id: string, dto: UpdateParallelDto): Promise<Parallel> {
    const parallel = await this.findOne(id);

    if (dto.code && dto.code !== parallel.code) {
      const existing = await this.parallelRepository.findOne({
        where: {
          academicPeriodId: parallel.academicPeriodId,
          code: dto.code,
        },
      });
      if (existing) {
        throw new BadRequestException('Ya existe un paralelo con este código en el periodo');
      }
    }

    Object.assign(parallel, dto);
    return this.parallelRepository.save(parallel);
  }

  async remove(id: string): Promise<void> {
    const assignmentsWithParallel = await this.subjectAssignmentRepository.count({
      where: { parallelId: id },
    });
    if (assignmentsWithParallel > 0) {
      throw new BadRequestException(
        `No se puede eliminar el paralelo porque está asignado a ${assignmentsWithParallel} materia(s)`,
      );
    }
    const parallel = await this.findOne(id);
    await this.parallelRepository.softDelete(parallel.id);
  }
}
