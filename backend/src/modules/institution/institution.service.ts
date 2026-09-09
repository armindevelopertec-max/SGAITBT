import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Institution } from './entities/institution.entity';
import { CreateInstitutionDto, UpdateInstitutionDto, UpdateInstitutionConfigDto } from './dto/institution.dto';

@Injectable()
export class InstitutionService {
  constructor(
    @InjectRepository(Institution)
    private readonly institutionRepository: Repository<Institution>,
  ) {}

  async create(createDto: CreateInstitutionDto): Promise<Institution> {
    const existing = await this.institutionRepository.findOne({ where: { slug: createDto.slug } });
    if (existing) {
      throw new ConflictException('Ya existe una institución con ese slug');
    }
    const institution = this.institutionRepository.create(createDto);
    return this.institutionRepository.save(institution);
  }

  async findAll(): Promise<Institution[]> {
    return this.institutionRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Institution> {
    const institution = await this.institutionRepository.findOne({
      where: { id },
      relations: ['careers'],
    });
    if (!institution) {
      throw new NotFoundException('Institución no encontrada');
    }
    return institution;
  }

  async findBySlug(slug: string): Promise<Institution | null> {
    return this.institutionRepository.findOne({ where: { slug } });
  }

  async update(id: string, updateDto: UpdateInstitutionDto): Promise<Institution> {
    const institution = await this.findStrict(id);
    Object.assign(institution, updateDto);
    return this.institutionRepository.save(institution);
  }

  async updateConfig(id: string, updateDto: UpdateInstitutionConfigDto): Promise<Institution> {
    const institution = await this.findStrict(id);
    Object.assign(institution, updateDto);
    return this.institutionRepository.save(institution);
  }

  async setLogo(id: string, logoUrl: string): Promise<Institution> {
    const institution = await this.findStrict(id);
    institution.logoUrl = logoUrl;
    return this.institutionRepository.save(institution);
  }

  async deactivate(id: string): Promise<void> {
    const institution = await this.findStrict(id);
    institution.isActive = false;
    await this.institutionRepository.save(institution);
  }

  private async findStrict(id: string): Promise<Institution> {
    const institution = await this.institutionRepository.findOne({ where: { id } });
    if (!institution) {
      throw new NotFoundException('Institución no encontrada');
    }
    return institution;
  }
}