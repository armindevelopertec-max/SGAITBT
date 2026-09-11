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

function toRoman(n: number): string {
  const map: Array<[number, string]> = [
    [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
  ];
  let result = '';
  let value = n;
  for (const [num, sym] of map) {
    while (value >= num) {
      result += sym;
      value -= num;
    }
  }
  return result || String(n);
}

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

    const year = createDto.year || String(new Date(createDto.startDate).getFullYear());

    const count = await this.periodRepository.count({
      where: { year, careerId: createDto.careerId },
    });
    const sequence = createDto.sequence || count + 1;

    const existing = await this.periodRepository.findOne({
      where: { year, careerId: createDto.careerId, sequence },
    });
    if (existing) {
      throw new BadRequestException('Ya existe ese periodo para la carrera en el año indicado');
    }

    const period = this.periodRepository.create({
      careerId: createDto.careerId,
      year,
      sequence,
      startDate: createDto.startDate,
      endDate: createDto.endDate,
      status: createDto.status,
      periodName: createDto.periodName || `${year}/${toRoman(sequence)}`,
    });
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
      order: { year: 'DESC', sequence: 'ASC' },
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
      order: { sequence: 'ASC' },
    });
  }

  async update(id: string, updateDto: UpdateAcademicPeriodDto): Promise<AcademicPeriod> {
    const period = await this.findStrict(id);

    const year =
      updateDto.year ??
      (updateDto.startDate ? String(new Date(updateDto.startDate).getFullYear()) : undefined) ??
      period.year;

    if ((updateDto.year || updateDto.startDate) && !updateDto.periodName) {
      updateDto.periodName = `${year}/${toRoman(updateDto.sequence || period.sequence)}`;
    }

    Object.assign(period, updateDto, updateDto.year || updateDto.startDate ? { year } : {});
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