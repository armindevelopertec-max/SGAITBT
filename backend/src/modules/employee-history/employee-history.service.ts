import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmployeeHistory } from './entities/employee-history.entity';
import {
  CreateEmployeeHistoryDto,
  UpdateEmployeeHistoryDto,
  EmployeeHistoryQueryDto,
} from './dto/employee-history.dto';

@Injectable()
export class EmployeeHistoryService {
  constructor(
    @InjectRepository(EmployeeHistory)
    private readonly repository: Repository<EmployeeHistory>,
  ) {}

  async create(dto: CreateEmployeeHistoryDto): Promise<EmployeeHistory> {
    const history = this.repository.create(dto);
    return this.repository.save(history);
  }

  async createBulk(
    dtos: CreateEmployeeHistoryDto[],
  ): Promise<EmployeeHistory[]> {
    const histories = dtos.map((dto) => this.repository.create(dto));
    return this.repository.save(histories);
  }

  async findAll(
    query?: EmployeeHistoryQueryDto,
  ): Promise<EmployeeHistory[]> {
    const where: Record<string, unknown> = {};

    if (query?.employeeId) where.employeeId = query.employeeId;
    if (query?.careerId) where.careerId = query.careerId;
    if (query?.academicPeriodId)
      where.academicPeriodId = query.academicPeriodId;
    if (query?.employeeType) where.employeeType = query.employeeType;

    return this.repository.find({
      where,
      relations: ['employee', 'employee.person', 'career', 'academicPeriod'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<EmployeeHistory> {
    const history = await this.repository.findOne({
      where: { id },
      relations: ['employee', 'employee.person', 'career', 'academicPeriod'],
    });
    if (!history) {
      throw new NotFoundException('Registro no encontrado');
    }
    return history;
  }

  async findByEmployee(
    employeeId: string,
  ): Promise<EmployeeHistory[]> {
    return this.repository.find({
      where: { employeeId },
      relations: ['employee', 'employee.person', 'career', 'academicPeriod'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByPeriod(
    academicPeriodId: string,
  ): Promise<EmployeeHistory[]> {
    return this.repository.find({
      where: { academicPeriodId },
      relations: ['employee', 'employee.person', 'career', 'academicPeriod'],
      order: { createdAt: 'DESC' },
    });
  }

  async update(
    id: string,
    dto: UpdateEmployeeHistoryDto,
  ): Promise<EmployeeHistory> {
    const history = await this.findOne(id);
    Object.assign(history, dto);
    return this.repository.save(history);
  }

  async updateOrCreate(
    employeeId: string,
    academicPeriodId: string,
    dto: CreateEmployeeHistoryDto,
  ): Promise<EmployeeHistory> {
    let history = await this.repository.findOne({
      where: { employeeId, academicPeriodId },
    });

    if (history) {
      Object.assign(history, dto);
    } else {
      history = this.repository.create({
        ...dto,
        employeeId,
        academicPeriodId,
      });
    }

    return this.repository.save(history);
  }

  async remove(id: string): Promise<void> {
    const history = await this.findOne(id);
    await this.repository.remove(history);
  }
}
