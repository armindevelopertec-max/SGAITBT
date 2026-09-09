import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Enrollment } from './entities/enrollment.entity';
import {
  CreateEnrollmentDto,
  UpdateEnrollmentDto,
  EnrollmentQueryDto,
  EnrollStudentDto,
} from './dto/enrollment.dto';
import { Student } from '@modules/student/entities/student.entity';
import { Career } from '@modules/career/entities/career.entity';
import { AcademicPeriod } from '@modules/academic-period/entities/academic-period.entity';
import { DepositService } from '@modules/deposit/deposit.service';
import { AcademicStatus, DepositStatus, EnrollmentStatus } from '@common/enums';

@Injectable()
export class EnrollmentService {
  constructor(
    @InjectRepository(Enrollment)
    private readonly enrollmentRepository: Repository<Enrollment>,
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    @InjectRepository(Career)
    private readonly careerRepository: Repository<Career>,
    @InjectRepository(AcademicPeriod)
    private readonly periodRepository: Repository<AcademicPeriod>,
    private readonly depositService: DepositService,
  ) {}

  async create(createDto: CreateEnrollmentDto): Promise<Enrollment> {
    const existing = await this.enrollmentRepository.findOne({
      where: {
        studentId: createDto.studentId,
        academicPeriodId: createDto.academicPeriodId,
      },
    });
    if (existing) {
      throw new ConflictException('El estudiante ya está matriculado en esta gestión');
    }

    const student = await this.studentRepository.findOne({
      where: { id: createDto.studentId },
    });
    if (!student) {
      throw new NotFoundException('Estudiante no encontrado');
    }

    const career = await this.careerRepository.findOne({
      where: { id: createDto.careerId },
    });
    if (!career) {
      throw new NotFoundException('Carrera no encontrada');
    }

    const period = await this.periodRepository.findOne({
      where: { id: createDto.academicPeriodId },
    });
    if (!period) {
      throw new NotFoundException('Gestión académica no encontrada');
    }

    const verifiedDeposit = await this.depositService.findAll({
      studentId: createDto.studentId,
      status: DepositStatus.VERIFIED,
    });
    if (verifiedDeposit.length === 0) {
      const approvedDeposit = await this.depositService.findAll({
        studentId: createDto.studentId,
        status: DepositStatus.APPROVED,
      });
      if (approvedDeposit.length === 0) {
        throw new BadRequestException(
          'El estudiante debe tener un depósito verificado o aprobado para matricularse',
        );
      }
    }

    const enrollment = this.enrollmentRepository.create({
      ...createDto,
      enrollmentNumber: await this.generateEnrollmentNumber(createDto.academicPeriodId),
      status: EnrollmentStatus.ACTIVE,
    });

    const saved = await this.enrollmentRepository.save(enrollment);

    await this.studentRepository.update(student.id, {
      status: AcademicStatus.ACTIVE,
      careerId: createDto.careerId,
      currentLevel: createDto.semester,
      currentPeriodId: createDto.academicPeriodId,
    });

    return saved;
  }

  async enrollStudent(dto: EnrollStudentDto): Promise<Enrollment> {
    const student = await this.studentRepository.findOne({
      where: { id: dto.studentId },
      relations: ['career'],
    });
    if (!student) {
      throw new NotFoundException('Estudiante no encontrado');
    }
    if (!student.career) {
      throw new BadRequestException('El estudiante no tiene carrera asignada');
    }

    const semester = dto.semester ?? student.currentLevel ?? 1;

    return this.create({
      studentId: dto.studentId,
      careerId: student.career.id,
      academicPeriodId: dto.academicPeriodId,
      enrollmentDate: new Date(),
      semester,
    });
  }

  async generateEnrollmentNumber(periodId: string): Promise<string> {
    const period = await this.periodRepository.findOne({ where: { id: periodId } });
    if (!period) {
      throw new NotFoundException('Gestión académica no encontrada');
    }
    const year = period.year;

    const lastEnrollment = await this.enrollmentRepository
      .createQueryBuilder('enrollment')
      .where('enrollment.enrollmentNumber LIKE :prefix', { prefix: `MAT-${year}-%` })
      .orderBy('enrollment.enrollmentNumber', 'DESC')
      .getOne();

    let nextNumber = 1;
    if (lastEnrollment) {
      const lastNumber = parseInt(lastEnrollment.enrollmentNumber.split('-')[2], 10);
      nextNumber = lastNumber + 1;
    }

    return `MAT-${year}-${String(nextNumber).padStart(5, '0')}`;
  }

  async findAll(query?: EnrollmentQueryDto): Promise<Enrollment[]> {
    const { status, studentId, academicPeriodId, careerId } = query || {};
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (studentId) where.studentId = studentId;
    if (academicPeriodId) where.academicPeriodId = academicPeriodId;
    if (careerId) where.careerId = careerId;

    return this.enrollmentRepository.find({
      where,
      relations: ['student', 'career', 'academicPeriod'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Enrollment> {
    const enrollment = await this.enrollmentRepository.findOne({
      where: { id },
      relations: ['student', 'career', 'academicPeriod'],
    });
    if (!enrollment) {
      throw new NotFoundException('Matrícula no encontrada');
    }
    return enrollment;
  }

  async findByNumber(enrollmentNumber: string): Promise<Enrollment | null> {
    return this.enrollmentRepository.findOne({
      where: { enrollmentNumber },
      relations: ['student', 'career', 'academicPeriod'],
    });
  }

  async update(id: string, updateDto: UpdateEnrollmentDto): Promise<Enrollment> {
    const enrollment = await this.findOne(id);
    Object.assign(enrollment, updateDto);
    return this.enrollmentRepository.save(enrollment);
  }

  async cancel(id: string): Promise<Enrollment> {
    const enrollment = await this.findOne(id);
    enrollment.status = EnrollmentStatus.CANCELLED;
    const saved = await this.enrollmentRepository.save(enrollment);

    await this.studentRepository.update(enrollment.studentId, {
      status: AcademicStatus.INACTIVE,
    });

    return saved;
  }

  async countByPeriod(): Promise<Array<{ periodId: string; periodName: string; total: number }>> {
    return this.enrollmentRepository
      .createQueryBuilder('enrollment')
      .leftJoin('enrollment.academicPeriod', 'academicPeriod')
      .select('enrollment.academicPeriodId', 'periodId')
      .addSelect('academicPeriod.periodName', 'periodName')
      .addSelect('COUNT(*)', 'total')
      .where('enrollment.status = :status', { status: EnrollmentStatus.ACTIVE })
      .groupBy('enrollment.academicPeriodId')
      .addGroupBy('academicPeriod.periodName')
      .getRawMany();
  }

  async countTotal(): Promise<number> {
    return this.enrollmentRepository.count({
      where: { status: EnrollmentStatus.ACTIVE },
    });
  }
}