import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmployeeType } from '@common/enums';
import { Employee } from './entities/employee.entity';
import { Person } from '@modules/person/entities/person.entity';

export interface CreateEmployeeInput {
  personId: string;
  employeeType: EmployeeType;
  position?: string;
  hireDate?: Date;
  employeeCode?: string;
}

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

  async createEmployee(input: CreateEmployeeInput): Promise<Employee> {
    const person = await this.personRepository.findOne({
      where: { id: input.personId },
    });
    if (!person) {
      throw new Error('La persona no existe');
    }
    const employee = this.employeeRepository.create({
      personId: input.personId,
      employeeType: input.employeeType,
      position: input.position,
      hireDate: input.hireDate,
      employeeCode: input.employeeCode ?? (await this.nextEmployeeCode()),
    });
    return this.employeeRepository.save(employee);
  }

  async findByPersonId(personId: string): Promise<Employee | null> {
    return this.employeeRepository.findOne({ where: { personId } });
  }

  async findByType(employeeType: EmployeeType): Promise<Employee[]> {
    return this.employeeRepository.find({
      where: { employeeType },
      relations: { persona: true },
    });
  }
}