import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Deposit } from './entities/deposit.entity';
import { CreateDepositDto, UpdateDepositDto, VerifyDepositDto, DepositQueryDto } from './dto/deposit.dto';
import { Student } from '@modules/student/entities/student.entity';
import { DepositStatus } from '@common/enums';

@Injectable()
export class DepositService {
  constructor(
    @InjectRepository(Deposit)
    private readonly depositRepository: Repository<Deposit>,
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
  ) {}

  async create(createDto: CreateDepositDto): Promise<Deposit> {
    const student = await this.studentRepository.findOne({
      where: { id: createDto.studentId },
    });
    if (!student) {
      throw new NotFoundException('Estudiante no encontrado');
    }

    const existing = await this.depositRepository.findOne({
      where: { depositNumber: createDto.depositNumber },
    });
    if (existing) {
      throw new BadRequestException('Ya existe un depósito con ese número de comprobante');
    }

    const deposit = this.depositRepository.create({
      ...createDto,
      status: DepositStatus.PENDING,
    });
    return this.depositRepository.save(deposit);
  }

  async findAll(query?: DepositQueryDto): Promise<Deposit[]> {
    const { status, studentId } = query || {};
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (studentId) where.studentId = studentId;

    return this.depositRepository.find({
      where,
      relations: ['student'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Deposit> {
    const deposit = await this.depositRepository.findOne({
      where: { id },
      relations: ['student'],
    });
    if (!deposit) {
      throw new NotFoundException('Depósito no encontrado');
    }
    return deposit;
  }

  async update(id: string, updateDto: UpdateDepositDto): Promise<Deposit> {
    const deposit = await this.findOne(id);
    if (
      deposit.status === DepositStatus.APPROVED ||
      deposit.status === DepositStatus.REJECTED
    ) {
      throw new BadRequestException('No se puede modificar un depósito finalizado');
    }
    Object.assign(deposit, updateDto);
    return this.depositRepository.save(deposit);
  }

  async verify(id: string, verifyDto: VerifyDepositDto, verifierName: string): Promise<Deposit> {
    const deposit = await this.findOne(id);

    if (deposit.status === DepositStatus.APPROVED) {
      throw new BadRequestException('El depósito ya fue aprobado');
    }

    deposit.status = verifyDto.status;
    deposit.verificationComment = verifyDto.verificationComment;
    deposit.verificationDate = new Date();
    deposit.verifiedBy = verifierName;

    return this.depositRepository.save(deposit);
  }

  async countByStatus(): Promise<Record<string, number>> {
    const result = await this.depositRepository
      .createQueryBuilder('deposit')
      .select('deposit.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('deposit.status')
      .getRawMany();

    const counts: Record<string, number> = {};
    for (const row of result) {
      counts[row.status] = parseInt(row.count, 10);
    }
    return counts;
  }

  async totalDeposits(): Promise<string> {
    const result = await this.depositRepository
      .createQueryBuilder('deposit')
      .select('COALESCE(SUM(deposit.amount), 0)', 'total')
      .getRawOne();
    return result.total;
  }
}