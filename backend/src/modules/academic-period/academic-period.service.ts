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

function toISODate(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(`${value}T00:00:00`);
  return d.toISOString().slice(0, 10);
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/** El periodo ya terminó (su fecha de fin es anterior a hoy). */
function isPastPeriod(endDate: Date | string | null | undefined): boolean {
  const end = toISODate(endDate);
  return !!end && end < todayISO();
}

/** El periodo ya inició (su fecha de inicio es hoy o anterior). Sin fecha no ha iniciado. */
function hasStartedPeriod(startDate: Date | string | null | undefined): boolean {
  const start = toISODate(startDate);
  return !!start && start <= todayISO();
}

/** El periodo está en curso (hoy está entre inicio y fin, inclusive). */
function isCurrentPeriod(
  startDate: Date | string | null | undefined,
  endDate: Date | string | null | undefined,
): boolean {
  const today = todayISO();
  const start = toISODate(startDate);
  const end = toISODate(endDate);
  return !!start && !!end && start <= today && today <= end;
}

@Injectable()
export class AcademicPeriodService {
  constructor(
    @InjectRepository(AcademicPeriod)
    private readonly periodRepository: Repository<AcademicPeriod>,
  ) {}

  async create(createDto: CreateAcademicPeriodDto): Promise<AcademicPeriod> {
    const status = createDto.status ?? PeriodStatus.PLANNED;
    if (!createDto.startDate || !createDto.endDate) {
      if (status !== PeriodStatus.PLANNED) {
        throw new BadRequestException('Solo un periodo planificado puede crearse sin fechas');
      }
    } else if (new Date(createDto.endDate) <= new Date(createDto.startDate)) {
      throw new BadRequestException('La fecha de fin debe ser posterior a la fecha de inicio');
    }

    const year =
      createDto.year ||
      (createDto.startDate
        ? String(new Date(createDto.startDate).getFullYear())
        : String(new Date().getFullYear()));

    const count = await this.periodRepository.count({
      where: { year },
    });
    const sequence = createDto.sequence || count + 1;
    const periodName = createDto.periodName || `${toRoman(sequence)}/${year}`;

    const existing = await this.periodRepository.findOne({
      where: { year, periodName },
    });
    if (existing) {
      throw new BadRequestException('Ya existe ese periodo en el año indicado');
    }

    const period = this.periodRepository.create({
      year,
      sequence,
      startDate: createDto.startDate ?? undefined,
      endDate: createDto.endDate ?? undefined,
      status,
      periodName,
    });
    return this.periodRepository.save(period);
  }

  async findAll(query?: AcademicPeriodQueryDto): Promise<AcademicPeriod[]> {
    const { status, year } = query || {};
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (year) where.year = year;

    return this.periodRepository.find({
      where,
      order: { year: 'DESC', sequence: 'ASC' },
    });
  }

  async findOne(id: string): Promise<AcademicPeriod> {
    const period = await this.periodRepository.findOne({
      where: { id },
    });
    if (!period) {
      throw new NotFoundException('Gestión académica no encontrada');
    }
    return period;
  }

  async findById(id: string): Promise<AcademicPeriod> {
    return this.findOne(id);
  }

  async findOpenByYear(year: string): Promise<AcademicPeriod[]> {
    return this.periodRepository.find({
      where: { year, status: PeriodStatus.OPEN },
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
      updateDto.periodName = `${toRoman(updateDto.sequence || period.sequence)}/${year}`;
    }

    Object.assign(period, updateDto, updateDto.year || updateDto.startDate ? { year } : {});
    if (period.startDate && period.endDate && new Date(period.endDate) <= new Date(period.startDate)) {
      throw new BadRequestException('La fecha de fin debe ser posterior a la fecha de inicio');
    }
    if ((!period.startDate || !period.endDate) && period.status !== PeriodStatus.PLANNED) {
      throw new BadRequestException('Solo un periodo planificado puede quedar sin fechas');
    }
    return this.periodRepository.save(period);
  }

  async closePeriod(id: string): Promise<AcademicPeriod> {
    const period = await this.findStrict(id);
    if (period.status === PeriodStatus.CLOSED) {
      throw new BadRequestException('El periodo ya está cerrado');
    }
    if (isCurrentPeriod(period.startDate, period.endDate)) {
      throw new BadRequestException('No se puede cerrar el periodo en curso');
    }
    period.status = PeriodStatus.CLOSED;
    return this.periodRepository.save(period);
  }

  async openPeriod(id: string): Promise<AcademicPeriod> {
    const period = await this.findStrict(id);
    if (period.status === PeriodStatus.OPEN) {
      throw new BadRequestException('El periodo ya está abierto');
    }
    if (isPastPeriod(period.endDate)) {
      throw new BadRequestException('No se puede abrir un periodo cuya fecha de fin ya pasó');
    }
    if (!period.startDate || !period.endDate) {
      throw new BadRequestException('El periodo aún no tiene fechas definidas, no se puede abrir');
    }
    if (!hasStartedPeriod(period.startDate)) {
      throw new BadRequestException('El periodo aún no inicia, no se puede abrir');
    }
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