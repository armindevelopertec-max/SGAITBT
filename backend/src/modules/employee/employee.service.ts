import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmployeeType } from '@common/enums';
import { Employee } from './entities/employee.entity';
import { Person } from '@modules/person/entities/person.entity';
import {
  CreateEmployeeDto,
  EmployeeQueryDto,
  UpdateEmployeeDto,
} from './dto/employee.dto';

export interface CreateEmployeeInput {
  personId: string;
  employeeType: EmployeeType;
  position?: string;
  hireDate?: Date;
  employeeCode?: string;
}

export type CreateEmployeeParams = CreateEmployeeDto & {
  employeeCode?: string;
};

@Injectable()
export class EmployeeService {
  constructor(
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
    @InjectRepository(Person)
    private readonly personRepository: Repository<Person>,
  ) {}

  private async nextEmployeeCode(): Promise<string> {
    const prefix = 'EMP';
    const last = await this.employeeRepository
      .createQueryBuilder('employee')
      .orderBy('employee.employeeCode', 'DESC')
      .getOne();
    const seq = last ? (parseInt(last.employeeCode.replace(prefix, ''), 10) || 0) + 1 : 1;
    return `${prefix}-${String(seq).padStart(5, '0')}`;
  }

  async createEmployee(input: CreateEmployeeParams): Promise<Employee> {
    const person = await this.personRepository.findOne({
      where: { id: input.personId },
    });
    if (!person) {
      throw new BadRequestException('La persona no existe');
    }
    const existing = await this.employeeRepository.find({ where: { personId: input.personId } });
    if (existing.length > 0) {
      throw new BadRequestException('La persona ya tiene un empleado registrado');
    }
    const employee = this.employeeRepository.create({
      personId: input.personId,
      employeeType: input.employeeType,
      position: input.position,
      hireDate: input.hireDate
        ? new Date(input.hireDate as Date | string)
        : undefined,
      employeeCode: input.employeeCode ?? (await this.nextEmployeeCode()),
    });
    return this.employeeRepository.save(employee);
  }

  async findAll(query?: EmployeeQueryDto): Promise<Employee[]> {
    const qb = this.employeeRepository
      .createQueryBuilder('employee')
      .leftJoinAndSelect('employee.person', 'person')
      .leftJoinAndSelect('person.user', 'personUser')
      .leftJoinAndSelect('employee.user', 'employeeUser')
      .orderBy('employee.employeeCode', 'ASC');

    if (query?.employeeType) {
      qb.andWhere('employee.employeeType = :employeeType', {
        employeeType: query.employeeType,
      });
    }
    if (query?.search) {
      qb.andWhere(
        `(person.firstName ILIKE :search
          OR person.lastName ILIKE :search
          OR person.ci ILIKE :search
          OR employee.employeeCode ILIKE :search
          OR employee.position ILIKE :search)`,
        { search: `%${query.search}%` },
      );
    }

    return qb.getMany();
  }

  async findOne(id: string): Promise<Employee> {
    const employee = await this.employeeRepository.findOne({
      where: { id },
      relations: {
        person: { user: true },
      },
    });
    if (!employee) {
      throw new NotFoundException('Empleado no encontrado');
    }
    return employee;
  }

  async findByPersonId(personId?: string): Promise<Employee | null> {
    if (!personId) return null;
    return this.employeeRepository.findOne({
      where: { personId: personId },
      relations: {
        person: { user: true },
      },
    });
  }

  async update(id: string, dto: UpdateEmployeeDto): Promise<Employee> {
    const employee = await this.findOne(id);
    const { hireDate, ...rest } = dto;
    Object.assign(employee, rest, {
      hireDate: hireDate ? new Date(hireDate) : employee.hireDate,
    });
    return this.employeeRepository.save(employee);
  }

  async deactivate(id: string): Promise<Employee> {
    const employee = await this.findOne(id);
    employee.isActive = false;
    return this.employeeRepository.save(employee);
  }

  async findByType(employeeType: EmployeeType): Promise<Employee[]> {
    return this.employeeRepository.find({
      where: { employeeType },
      relations: { person: true },
    });
  }
}