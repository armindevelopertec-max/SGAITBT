import {
  ConflictException,
  Injectable,
  Inject,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { Student } from './entities/student.entity';
import { CreateStudentDto, UpdateStudentDto, StudentQueryDto } from './dto/student.dto';
import { Career } from '@modules/career/entities/career.entity';
import { Person } from '@modules/person/entities/person.entity';
import { AcademicStatus } from '@common/enums';
import { UserService } from '@modules/user/user.service';
import { StudentStatusHistoryService } from '@modules/student-status-history/student-status-history.service';

@Injectable()
export class StudentService {
  constructor(
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    @InjectRepository(Career)
    private readonly careerRepository: Repository<Career>,
    @InjectRepository(Person)
    private readonly personRepository: Repository<Person>,
    private readonly userService: UserService,
    @Inject(forwardRef(() => StudentStatusHistoryService))
    private readonly studentStatusHistoryService: StudentStatusHistoryService,
  ) {}

  async create(createDto: CreateStudentDto): Promise<Student> {
    const person = await this.personRepository.findOne({
      where: { id: createDto.personId },
    });
    if (!person) {
      throw new NotFoundException('Persona no encontrada');
    }

    const existingStudent = await this.studentRepository.findOne({
      where: { personId: createDto.personId },
    });
    if (existingStudent) {
      throw new ConflictException('Esta persona ya tiene una ficha de estudiante');
    }

    if (createDto.careerId) {
      const career = await this.careerRepository.findOne({ where: { id: createDto.careerId } });
      if (!career) {
        throw new NotFoundException('Carrera no encontrada');
      }
    }

    const student = this.studentRepository.create({
      personId: createDto.personId,
      diplomaNumber: createDto.diplomaNumber,
      status: createDto.status ?? AcademicStatus.PRE_ENROLLED,
      currentLevel: createDto.currentLevel ?? 1,
      careerId: createDto.careerId,
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
      .leftJoinAndSelect('student.person', 'person')
      .leftJoinAndSelect('student.career', 'career')
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
            .where('LOWER(person.firstName) LIKE LOWER(:search)', { search: `%${search}%` })
            .orWhere('LOWER(person.lastName) LIKE LOWER(:search)', { search: `%${search}%` })
            .orWhere('person.ci LIKE :search', { search: `%${search}%` })
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
      where: { person: { ci } as any },
      relations: ['person', 'career'],
    });
  }

  async findByStudentCode(code: string): Promise<Student | null> {
    return this.studentRepository.findOne({
      where: { studentCode: code },
      relations: ['person', 'career'],
    });
  }

  async update(id: string, updateDto: UpdateStudentDto): Promise<Student> {
    const student = await this.findStrict(id);

    const statusChanged = updateDto.status && updateDto.status !== student.status;
    const careerChanged = updateDto.careerId && updateDto.careerId !== student.careerId;

    if (updateDto.careerId && updateDto.careerId !== student.careerId) {
      const career = await this.careerRepository.findOne({ where: { id: updateDto.careerId } });
      if (!career) {
        throw new NotFoundException('Carrera no encontrada');
      }
    }

    Object.assign(student, updateDto);
    const saved = await this.studentRepository.save(student);

    if (statusChanged || careerChanged) {
      await this.studentStatusHistoryService.create(
        student.id,
        {
          status: student.status,
          careerId: student.careerId,
          level: student.currentLevel,
        },
        {
          status: updateDto.status ?? student.status,
          careerId: updateDto.careerId ?? student.careerId,
          level: updateDto.currentLevel ?? student.currentLevel,
        },
      );
    }

    return saved;
  }

  async updateStatus(id: string, status: AcademicStatus): Promise<Student> {
    const student = await this.findStrict(id);
    student.status = status;
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
    const student = await this.studentRepository
      .createQueryBuilder('student')
      .leftJoinAndSelect('student.enrollments', 'enrollment')
      .leftJoinAndSelect('enrollment.academicPeriod', 'period')
      .where('student.id = :studentId', { studentId })
      .orderBy('enrollment.enrollmentDate', 'ASC')
      .getOne();

    if (!student || !student.enrollments || student.enrollments.length === 0) {
      return null;
    }

    const firstEnrollment = student.enrollments[0];
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
      relations: ['person', 'career', 'enrollments', 'deposits'],
    });
    if (!student) {
      throw new NotFoundException('Estudiante no encontrado');
    }
    return student;
  }
}
