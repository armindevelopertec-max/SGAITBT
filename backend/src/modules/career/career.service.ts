import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Career } from './entities/career.entity';
import { CreateCareerDto, UpdateCareerDto, CareerQueryDto } from './dto/career.dto';
import { CareerState } from '@common/enums';

@Injectable()
export class CareerService {
  constructor(
    @InjectRepository(Career)
    private readonly careerRepository: Repository<Career>,
  ) {}

  async create(createDto: CreateCareerDto): Promise<Career> {
    const existing = await this.careerRepository.findOne({ where: { code: createDto.code } });
    if (existing) {
      throw new ConflictException('Ya existe una carrera con ese código');
    }
    const career = this.careerRepository.create(createDto);
    return this.careerRepository.save(career);
  }

  async findAll(query?: CareerQueryDto): Promise<Career[]> {
    const { state } = query || {};
    const where: Record<string, unknown> = {};
    if (state) where.state = state;

    return this.careerRepository.find({
      where,
      relations: ['subjects'],
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Career> {
    const career = await this.careerRepository.findOne({
      where: { id },
      relations: ['subjects', 'academicPeriods'],
    });
    if (!career) {
      throw new NotFoundException('Carrera no encontrada');
    }
    return career;
  }

  async findByCode(code: string): Promise<Career | null> {
    return this.careerRepository.findOne({ where: { code } });
  }

  async update(id: string, updateDto: UpdateCareerDto): Promise<Career> {
    const career = await this.findStrict(id);
    Object.assign(career, updateDto);
    return this.careerRepository.save(career);
  }

  async toggleState(id: string): Promise<Career> {
    const career = await this.findStrict(id);
    career.state = career.state === CareerState.ACTIVE ? CareerState.INACTIVE : CareerState.ACTIVE;
    career.isActive = !career.isActive;
    return this.careerRepository.save(career);
  }

  async deactivate(id: string): Promise<void> {
    const career = await this.findStrict(id);
    career.isActive = false;
    career.state = CareerState.INACTIVE;
    await this.careerRepository.save(career);
  }

  async count(): Promise<number> {
    return this.careerRepository.count({ where: { isActive: true } });
  }

  private async findStrict(id: string): Promise<Career> {
    const career = await this.careerRepository.findOne({ where: { id } });
    if (!career) {
      throw new NotFoundException('Carrera no encontrada');
    }
    return career;
  }
}