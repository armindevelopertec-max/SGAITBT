import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Person } from './entities/person.entity';
import { CreatePersonDto, PersonQueryDto, UpdatePersonDto } from './dto/person.dto';
import { PersonStatus } from '@common/enums';

@Injectable()
export class PersonService {
  constructor(
    @InjectRepository(Person)
    private readonly personRepository: Repository<Person>,
  ) {}

  async create(createDto: CreatePersonDto): Promise<Person> {
    const byCi = await this.personRepository.findOne({
      where: { ci: createDto.ci },
    });
    if (byCi) {
      throw new ConflictException('Ya existe una persona con ese CI');
    }
    const byEmail = await this.personRepository.findOne({
      where: { email: createDto.email },
    });
    if (byEmail) {
      throw new ConflictException('Ya existe una persona con ese correo');
    }
    const person = this.personRepository.create({
      ...createDto,
      birthDate: createDto.birthDate ? new Date(createDto.birthDate) : undefined,
      status: createDto.status ?? PersonStatus.ACTIVE,
    });
    return this.personRepository.save(person);
  }

  async findAll(query?: PersonQueryDto): Promise<Person[]> {
    const qb = this.personRepository
      .createQueryBuilder('person')
      .leftJoinAndSelect('person.user', 'user')
      .leftJoinAndSelect('person.student', 'student')
      .leftJoinAndSelect('person.employees', 'employees')
      .orderBy('person.firstName', 'ASC');

    if (query?.status) {
      qb.andWhere('person.status = :status', { status: query.status });
    }
    if (query?.search) {
      qb.andWhere(
        `(person.firstName ILIKE :search
          OR person.paternalSurname ILIKE :search
          OR person.maternalSurname ILIKE :search
          OR person.lastName ILIKE :search
          OR person.ci ILIKE :search
          OR person.email ILIKE :search)`,
        { search: `%${query.search}%` },
      );
    }

    return qb.getMany();
  }

  async findOne(id: string): Promise<Person> {
    const person = await this.personRepository.findOne({
      where: { id },
      relations: ['user', 'student', 'employees'],
    });
    if (!person) {
      throw new NotFoundException('Persona no encontrada');
    }
    return person;
  }

  async findByCiOrEmail(ci?: string, email?: string): Promise<Person | null> {
    if (ci) {
      const byCi = await this.personRepository.findOne({ where: { ci } });
      if (byCi) return byCi;
    }
    if (email) {
      return this.personRepository.findOne({ where: { email } });
    }
    return null;
  }

  async update(id: string, updateDto: UpdatePersonDto): Promise<Person> {
    const person = await this.findOne(id);
    const { birthDate, ...rest } = updateDto;
    Object.assign(person, rest, {
      birthDate: birthDate ? new Date(birthDate) : person.birthDate,
    });
    return this.personRepository.save(person);
  }

  async deactivate(id: string): Promise<Person> {
    const person = await this.findOne(id);
    person.status = PersonStatus.INACTIVE;
    person.isActive = false;
    return this.personRepository.save(person);
  }

  async count(): Promise<number> {
    return this.personRepository.count({ where: { isActive: true } });
  }
}