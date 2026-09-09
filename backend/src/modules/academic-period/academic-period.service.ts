import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AcademicPeriod } from './entities/academic-period.entity';
import { PeriodStatus } from '@common/enums';
import {
  CreateAcademicPeriodDto,
  UpdateAcademicPeriodDto,
  AcademicPeriodQueryDto,
} from './dto/academic-period.dto';

@Injectable()
export class AcademicPeriodService {
  constructor(
    @InjectRepository(AcademicPeriod)
    private readonly periodRepository: Repository<AcademicPeriod>,
  ) {}

  async create(createDto: CreateAcademicPeriodDto): Promise<AcademicPeriod> {
    if (new Date(createDto.endDate) <= new Date(createDto.startDate)) {
      throw new BadRequestException('La fecha de fin debe ser posterior a la fecha de inicio');
    }

    const existing = await this.periodRepository.findOne({
      where: {
        year: createDto.year,
        semester: createDto.semester,
        careerId: createDto.careerId,
      },
    });
    if (existing) {
      throw new BadRequestException('Ya existe una gestión con ese periodo para la carrera');
    }

    const period = this.periodRepository.create(createDto);
    return this.periodRepository.save(period);
  }

  async findAll(query?: AcademicPeriodQueryDto): Promise<AcademicPeriod[]> {
    const { status, careerId, year } = query || {};
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (careerId) where.careerId = careerId;
    if (year) where.year = year;

    return this.periodRepository.find({
      where,
      relations: ['career'],
      order: { year: 'DESC', semester: 'DESC' },
    });
  }

  async findOne(id: string): Promise<AcademicPeriod> {
    const period = await this.periodRepository.findOne({
      where: { id },
      relations: ['career'],
    });
    if (!period) {
      throw new NotFoundException('Gestión académica no encontrada');
    }
    return period;
  }

  async findById(id: string): Promise<AcademicPeriod> {
    return this.findOne(id);
  }

  async findOpenByCareer(careerId: string, year: string): Promise<AcademicPeriod[]> {
    return this.periodRepository.find({
      where: { careerId, year, status: PeriodStatus.OPEN },
      order: { semester: 'ASC' },
    });
  }

  async update(id: string, updateDto: UpdateAcademicPeriodDto): Promise<AcademicPeriod> {
    const period = await this.findStrict(id);
    Object.assign(period, updateDto);
    return this.periodRepository.save(period);
  }

  async closePeriod(id: string): Promise<AcademicPeriod> {
    const period = await this.findStrict(id);
    period.status = PeriodStatus.CLOSED;
    return this.periodRepository.save(period);
  }

  async openPeriod(id: string): Promise<AcademicPeriod> {
    const period = await this.findStrict(id);
    period.status = PeriodStatus.OPEN;
    return this.periodRepository.save(period);
  }

  async remove(id: string): Promise<void> {
    const period = await this.findStrict(id);
    await this.periodRepository.softDelete(period.id);
  }

  private async findStrict(id: string): Promise<AcademicPeriod> {
    const period = await this.periodRepository.findOne({ where: { id } });
    if (!period) {
      throw new NotFoundException('Gestión académica no encontrada');
    }
    return period;
  }
}