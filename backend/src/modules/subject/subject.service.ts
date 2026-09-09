import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subject } from './entities/subject.entity';
import { CreateSubjectDto, UpdateSubjectDto } from './dto/subject.dto';

@Injectable()
export class SubjectService {
  constructor(
    @InjectRepository(Subject)
    private readonly subjectRepository: Repository<Subject>,
  ) {}

  async create(createDto: CreateSubjectDto): Promise<Subject> {
    const existing = await this.subjectRepository.findOne({ where: { code: createDto.code } });
    if (existing) {
      throw new ConflictException('Ya existe una materia con ese código');
    }
    const subject = this.subjectRepository.create(createDto);
    return this.subjectRepository.save(subject);
  }

  async findAll(): Promise<Subject[]> {
    return this.subjectRepository.find({
      relations: ['career'],
      order: { semester: 'ASC', name: 'ASC' },
    });
  }

  async findByCareer(careerId: string): Promise<Subject[]> {
    return this.subjectRepository.find({
      where: { careerId, isActive: true },
      order: { semester: 'ASC', name: 'ASC' },
    });
  }

  async findBySemester(careerId: string, semester: number): Promise<Subject[]> {
    return this.subjectRepository.find({
      where: { careerId, semester, isActive: true },
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Subject> {
    const subject = await this.subjectRepository.findOne({
      where: { id },
      relations: ['career'],
    });
    if (!subject) {
      throw new NotFoundException('Materia no encontrada');
    }
    return subject;
  }

  async findById(id: string): Promise<Subject> {
    return this.findOne(id);
  }

  async update(id: string, updateDto: UpdateSubjectDto): Promise<Subject> {
    const subject = await this.findStrict(id);
    Object.assign(subject, updateDto);
    return this.subjectRepository.save(subject);
  }

  async toggleState(id: string): Promise<Subject> {
    const subject = await this.findStrict(id);
    subject.isActive = !subject.isActive;
    return this.subjectRepository.save(subject);
  }

  private async findStrict(id: string): Promise<Subject> {
    const subject = await this.subjectRepository.findOne({ where: { id } });
    if (!subject) {
      throw new NotFoundException('Materia no encontrada');
    }
    return subject;
  }
}