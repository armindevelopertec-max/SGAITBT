import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { Student } from './entities/student.entity';
import { CreateStudentDto, UpdateStudentDto, StudentQueryDto } from './dto/student.dto';
import { Career } from '@modules/career/entities/career.entity';
import { AcademicPeriod } from '@modules/academic-period/entities/academic-period.entity';
import { AcademicStatus } from '@common/enums';
import { UserService } from '@modules/user/user.service';

@Injectable()
export class StudentService {
  constructor(
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    @InjectRepository(Career)
    private readonly careerRepository: Repository<Career>,
    @InjectRepository(AcademicPeriod)
    private readonly periodRepository: Repository<AcademicPeriod>,
    private readonly userService: UserService,
  ) {}

  async create(createDto: CreateStudentDto): Promise<Student> {
    const existingCi = await this.studentRepository.findOne({ where: { ci: createDto.ci } });
    if (existingCi) {
      throw new ConflictException('Ya existe un estudiante con ese CI');
    }

    const existingEmail = await this.studentRepository.findOne({ where: { email: createDto.email } });
    if (existingEmail) {
      throw new ConflictException('Ya existe un estudiante con ese correo electrónico');
    }

    if (createDto.careerId) {
      const career = await this.careerRepository.findOne({ where: { id: createDto.careerId } });
      if (!career) {
        throw new NotFoundException('Carrera no encontrada');
      }
    }

    const student = this.studentRepository.create({
      ...createDto,
      ...this.deriveFullName(createDto),
      studentCode: await this.generateStudentCode(),
    });

    const saved = await this.studentRepository.save(student);

    const { user, password } = await this.userService.createStudentUser(saved.id);
    const result = saved as Student & {
      credentials?: { username: string; password: string };
    };
    result.credentials = { username: user.username, password };

    return result;
  }

  async generateStudentCode(): Promise<string> {
    const year = new Date().getFullYear();
    const lastStudent = await this.studentRepository
      .createQueryBuilder('student')
      .where('student.studentCode LIKE :prefix', { prefix: `EST-${year}-%` })
      .orderBy('student.studentCode', 'DESC')
      .getOne();

    let nextNumber = 1;
    if (lastStudent) {
      const lastNumber = parseInt(lastStudent.studentCode.split('-')[2], 10);
      nextNumber = lastNumber + 1;
    }

    return `EST-${year}-${String(nextNumber).padStart(4, '0')}`;
  }

  async findAll(query?: StudentQueryDto): Promise<Student[]> {
    const { status, careerId, search } = query || {};
    const qb = this.studentRepository
      .createQueryBuilder('student')
      .leftJoinAndSelect('student.career', 'career')
      .leftJoinAndSelect('student.currentPeriod', 'currentPeriod')
      .orderBy('student.createdAt', 'DESC');

    if (status) {
      qb.andWhere('student.status = :status', { status });
    }
    if (careerId) {
      qb.andWhere('student.careerId = :careerId', { careerId });
    }
    if (search) {
      qb.andWhere(
        new Brackets((sub) => {
          sub
            .where('LOWER(student.firstName) LIKE LOWER(:search)', { search: `%${search}%` })
            .orWhere('LOWER(student.lastName) LIKE LOWER(:search)', { search: `%${search}%` })
            .orWhere('student.ci LIKE :search', { search: `%${search}%` })
            .orWhere('student.studentCode LIKE :search', { search: `%${search}%` });
        }),
      );
    }

    return qb.getMany();
  }

  async findOne(id: string): Promise<Student> {
    return this.findStrict(id);
  }

  async findByCi(ci: string): Promise<Student | null> {
    return this.studentRepository.findOne({
      where: { ci },
      relations: ['career', 'currentPeriod'],
    });
  }

  async findByStudentCode(code: string): Promise<Student | null> {
    return this.studentRepository.findOne({
      where: { studentCode: code },
      relations: ['career', 'currentPeriod'],
    });
  }

  async update(id: string, updateDto: UpdateStudentDto): Promise<Student> {
    const student = await this.findStrict(id);

    if (updateDto.careerId && updateDto.careerId !== student.careerId) {
      const career = await this.careerRepository.findOne({ where: { id: updateDto.careerId } });
      if (!career) {
        throw new NotFoundException('Carrera no encontrada');
      }
    }

    Object.assign(student, updateDto, this.deriveFullName(updateDto));
    return this.studentRepository.save(student);
  }

  async updateStatus(id: string, status: AcademicStatus): Promise<Student> {
    const student = await this.findStrict(id);
    student.status = status;
    return this.studentRepository.save(student);
  }

  async assignCurrentPeriod(id: string, periodId: string): Promise<Student> {
    const student = await this.findStrict(id);
    const period = await this.periodRepository.findOne({ where: { id: periodId } });
    if (!period) {
      throw new NotFoundException('Gestión académica no encontrada');
    }
    student.currentPeriod = period;
    student.currentPeriodId = periodId;
    return this.studentRepository.save(student);
  }

  async countByStatus(): Promise<Record<string, number>> {
    const result = await this.studentRepository
      .createQueryBuilder('student')
      .select('student.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('student.status')
      .getRawMany();

    const counts: Record<string, number> = {};
    for (const row of result) {
      counts[row.status] = parseInt(row.count, 10);
    }
    return counts;
  }

  async countByCareer(): Promise<Array<{ careerId: string; careerName: string; total: number }>> {
    return this.studentRepository
      .createQueryBuilder('student')
      .leftJoin('student.career', 'career')
      .select('student.careerId', 'careerId')
      .addSelect('career.name', 'careerName')
      .addSelect('COUNT(*)', 'total')
      .groupBy('student.careerId')
      .addGroupBy('career.name')
      .getRawMany();
  }

  async getEntryYear(studentId: string): Promise<{ periodName: string; year: string } | null> {
    const enrollment = await this.studentRepository
      .createQueryBuilder('student')
      .leftJoinAndSelect('student.enrollments', 'enrollment')
      .leftJoinAndSelect('enrollment.academicPeriod', 'period')
      .where('student.id = :studentId', { studentId })
      .orderBy('enrollment.enrollmentDate', 'ASC')
      .getOne();

    if (!enrollment || !enrollment.enrollments || enrollment.enrollments.length === 0) {
      return null;
    }

    const firstEnrollment = enrollment.enrollments[0];
    if (firstEnrollment.academicPeriod?.year && firstEnrollment.academicPeriod?.periodName) {
      return {
        periodName: firstEnrollment.academicPeriod.periodName,
        year: firstEnrollment.academicPeriod.year,
      };
    }

    return null;
  }

  private async findStrict(id: string): Promise<Student> {
    const student = await this.studentRepository.findOne({
      where: { id },
      relations: ['career', 'currentPeriod', 'enrollments', 'deposits'],
    });
    if (!student) {
      throw new NotFoundException('Estudiante no encontrado');
    }
    return student;
  }

  private deriveFullName(
    data: { paternalSurname?: string; maternalSurname?: string; lastName?: string },
  ): { lastName: string } {
    const paternal = data.paternalSurname?.trim();
    const maternal = data.maternalSurname?.trim();
    if (paternal || maternal) {
      return { lastName: [paternal, maternal].filter(Boolean).join(' ').trim() };
    }
    return { lastName: data.lastName?.trim() ?? '' };
  }
}