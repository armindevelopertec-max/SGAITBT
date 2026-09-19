import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CalendarEvent } from './entities/calendar-event.entity';
import {
  CalendarEventQueryDto,
  CreateCalendarEventDto,
  UpdateCalendarEventDto,
} from './dto/calendar-event.dto';
import { CalendarEventStatus } from '@common/enums';
import { AcademicPeriod } from '@modules/academic-period/entities/academic-period.entity';

@Injectable()
export class CalendarEventService {
  constructor(
    @InjectRepository(CalendarEvent)
    private readonly eventRepository: Repository<CalendarEvent>,
    @InjectRepository(AcademicPeriod)
    private readonly periodRepository: Repository<AcademicPeriod>,
  ) {}

  async create(dto: CreateCalendarEventDto): Promise<CalendarEvent> {
    const period = await this.periodRepository.findOne({
      where: { id: dto.academicPeriodId },
    });
    if (!period) {
      throw new NotFoundException('Periodo académico no encontrado');
    }
    if (dto.endDate && new Date(dto.endDate) < new Date(dto.startDate)) {
      throw new BadRequestException(
        'La fecha de fin debe ser igual o posterior a la fecha de inicio',
      );
    }
    const event = this.eventRepository.create({
      ...dto,
      status: dto.status ?? CalendarEventStatus.ACTIVE,
    });
    return this.eventRepository.save(event);
  }

  async findAll(query?: CalendarEventQueryDto): Promise<CalendarEvent[]> {
    const { academicPeriodId, category, status } = query || {};
    const where: Record<string, unknown> = {};
    if (academicPeriodId) where.academicPeriodId = academicPeriodId;
    if (category) where.category = category;
    if (status) where.status = status;
    return this.eventRepository.find({
      where,
      relations: ['academicPeriod'],
      order: { startDate: 'ASC', createdAt: 'ASC' },
    });
  }

  async findOne(id: string): Promise<CalendarEvent> {
    const event = await this.eventRepository.findOne({
      where: { id },
      relations: ['academicPeriod'],
    });
    if (!event) {
      throw new NotFoundException('Evento del calendario no encontrado');
    }
    return event;
  }

  async update(id: string, dto: UpdateCalendarEventDto): Promise<CalendarEvent> {
    const event = await this.findOne(id);
    const start = dto.startDate ?? event.startDate;
    const end = dto.endDate ?? event.endDate;
    if (end && new Date(end) < new Date(start)) {
      throw new BadRequestException(
        'La fecha de fin debe ser igual o posterior a la fecha de inicio',
      );
    }
    Object.assign(event, dto);
    return this.eventRepository.save(event);
  }

  async remove(id: string): Promise<void> {
    const event = await this.findOne(id);
    await this.eventRepository.remove(event);
  }
}
