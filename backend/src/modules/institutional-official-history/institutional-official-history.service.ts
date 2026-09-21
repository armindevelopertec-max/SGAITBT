import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { InstitutionalOfficialHistory } from './entities/institutional-official-history.entity';
import {
  CreateInstitutionalOfficialHistoryDto,
  UpdateInstitutionalOfficialHistoryDto,
  InstitutionalOfficialHistoryQueryDto,
} from './dto/institutional-official-history.dto';
import { OfficialType } from '@common/enums';

@Injectable()
export class InstitutionalOfficialHistoryService {
  constructor(
    @InjectRepository(InstitutionalOfficialHistory)
    private readonly repository: Repository<InstitutionalOfficialHistory>,
  ) {}

  async create(
    dto: CreateInstitutionalOfficialHistoryDto,
  ): Promise<InstitutionalOfficialHistory> {
    if (dto.isVacant && (dto.personId || dto.employeeId)) {
      throw new BadRequestException(
        'Un cargo vacante no debe tener persona asignada',
      );
    }

    if (dto.endDate && new Date(dto.endDate) < new Date(dto.startDate)) {
      throw new BadRequestException(
        'La fecha de fin no puede ser anterior a la fecha de inicio',
      );
    }

    const official = this.repository.create({
      ...dto,
      startDate: new Date(dto.startDate),
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
    });

    return this.repository.save(official);
  }

  async findAll(
    query?: InstitutionalOfficialHistoryQueryDto,
  ): Promise<InstitutionalOfficialHistory[]> {
    const where: Record<string, unknown> = {};

    if (query?.officialType) {
      where.officialType = query.officialType;
    }
    if (query?.careerId) {
      where.careerId = query.careerId;
    }
    if (query?.startGestion) {
      where.startGestion = MoreThanOrEqual(query.startGestion);
    }
    if (query?.endGestion) {
      where.endGestion = LessThanOrEqual(query.endGestion);
    }
    if (query?.active) {
      where.endDate = IsNull();
    }

    return this.repository.find({
      where,
      relations: ['person', 'employee', 'career'],
      order: { startDate: 'DESC' },
    });
  }

  async findOne(id: string): Promise<InstitutionalOfficialHistory> {
    const official = await this.repository.findOne({
      where: { id },
      relations: ['person', 'employee', 'career'],
    });
    if (!official) {
      throw new NotFoundException('Registro no encontrado');
    }
    return official;
  }

  async findCurrentByType(
    officialType: OfficialType,
    careerId?: string,
  ): Promise<InstitutionalOfficialHistory | null> {
    const where: Record<string, unknown> = {
      officialType,
      endDate: IsNull(),
    };
    if (careerId) {
      where.careerId = careerId;
    }

    return this.repository.findOne({
      where,
      relations: ['person', 'employee', 'career'],
    });
  }

  async findByPeriod(
    officialType: OfficialType,
    gestion: string,
    careerId?: string,
  ): Promise<InstitutionalOfficialHistory[]> {
    const where: Record<string, unknown> = {
      officialType,
    };

    if (careerId) {
      where.careerId = careerId;
    }

    const allRecords = await this.repository.find({
      where,
      relations: ['person', 'employee', 'career'],
      order: { startDate: 'ASC' },
    });

    return allRecords.filter((record) => {
      const startInGestion = record.startGestion <= gestion;
      const endInGestion =
        !record.endGestion || record.endGestion >= gestion;
      return startInGestion && endInGestion;
    });
  }

  async update(
    id: string,
    dto: UpdateInstitutionalOfficialHistoryDto,
  ): Promise<InstitutionalOfficialHistory> {
    const official = await this.findOne(id);

    if (dto.isVacant && (dto.personId || dto.employeeId)) {
      throw new BadRequestException(
        'Un cargo vacante no debe tener persona asignada',
      );
    }

    if (dto.endDate && new Date(dto.endDate) < official.startDate) {
      throw new BadRequestException(
        'La fecha de fin no puede ser anterior a la fecha de inicio',
      );
    }

    Object.assign(official, {
      ...dto,
      endDate: dto.endDate ? new Date(dto.endDate) : official.endDate,
    });

    return this.repository.save(official);
  }

  async endTenure(id: string): Promise<InstitutionalOfficialHistory> {
    const official = await this.findOne(id);
    if (official.endDate) {
      throw new BadRequestException('El cargo ya tiene fecha de fin');
    }

    const today = new Date();
    official.endDate = today;
    official.endGestion = today.getFullYear().toString();

    return this.repository.save(official);
  }

  async remove(id: string): Promise<void> {
    const official = await this.findOne(id);
    await this.repository.remove(official);
  }
}
