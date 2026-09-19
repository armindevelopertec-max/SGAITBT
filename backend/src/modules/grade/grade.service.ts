import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Grade } from './entities/grade.entity';
import {
  CreateBulkGradesDto,
  CreateGradeDto,
  GradeQueryDto,
  UpdateGradeDto,
} from './dto/grade.dto';
import { GradeStatus } from '@common/enums';
import { SubjectAssignment } from '@modules/subject-assignment/entities/subject-assignment.entity';
import { SubjectEnrollment } from '@modules/subject-assignment/entities/subject-enrollment.entity';
import { AcademicHistory } from '@modules/academic-history/entities/academic-history.entity';
import { Student } from '@modules/student/entities/student.entity';
import { Career } from '@modules/career/entities/career.entity';

export const MIN_PASSING_GRADE = 51;

@Injectable()
export class GradeService {
  constructor(
    @InjectRepository(Grade)
    private readonly gradeRepository: Repository<Grade>,
    @InjectRepository(SubjectAssignment)
    private readonly assignmentRepository: Repository<SubjectAssignment>,
    @InjectRepository(SubjectEnrollment)
    private readonly subjectEnrollmentRepository: Repository<SubjectEnrollment>,
    @InjectRepository(AcademicHistory)
    private readonly historyRepository: Repository<AcademicHistory>,
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    @InjectRepository(Career)
    private readonly careerRepository: Repository<Career>,
  ) {}

  async create(createDto: CreateGradeDto): Promise<Grade> {
    const assignment = await this.assignmentRepository.findOne({
      where: { id: createDto.assignmentId },
      relations: ['subject', 'academicPeriod'],
    });
    if (!assignment) {
      throw new NotFoundException('Asignación no encontrada');
    }

    const isEnrolled = await this.subjectEnrollmentRepository.findOne({
      where: {
        assignmentId: createDto.assignmentId,
        studentId: createDto.studentId,
      },
    });
    if (!isEnrolled) {
      throw new BadRequestException('El estudiante no está matriculado en esta materia');
    }

    const existing = await this.gradeRepository.findOne({
      where: {
        assignmentId: createDto.assignmentId,
        studentId: createDto.studentId,
      },
    });
    if (existing) {
      throw new BadRequestException('El estudiante ya tiene calificaciones en esta materia');
    }

    const grade = this.gradeRepository.create(createDto);
    this.calculateFinalGrade(grade);
    return this.gradeRepository.save(grade);
  }

  async createBulk(dto: CreateBulkGradesDto): Promise<Grade[]> {
    const assignment = await this.assignmentRepository.findOne({
      where: { id: dto.assignmentId },
      relations: ['subject', 'academicPeriod'],
    });
    if (!assignment) {
      throw new NotFoundException('Asignación no encontrada');
    }

    const grades = dto.grades.map((g) =>
      this.gradeRepository.create({
        assignmentId: dto.assignmentId,
        studentId: g.studentId,
        firstPartial: g.firstPartial,
        secondPartial: g.secondPartial,
        practices: g.practices,
        finalExam: g.finalExam,
      }),
    );

    for (const grade of grades) {
      this.calculateFinalGrade(grade);
    }

    const saved = await this.gradeRepository.save(grades);

    for (const grade of saved) {
      await this.syncHistory(grade, assignment);
    }

    return saved;
  }

  async findAll(query?: GradeQueryDto): Promise<Grade[]> {
    const { assignmentId, studentId, academicPeriodId } = query || {};
    const where: Record<string, unknown> = {};
    if (assignmentId) where.assignmentId = assignmentId;
    if (studentId) where.studentId = studentId;

    const qb = this.gradeRepository
      .createQueryBuilder('grade')
      .leftJoinAndSelect('grade.student', 'student')
      .leftJoinAndSelect('grade.assignment', 'assignment')
      .leftJoinAndSelect('assignment.subject', 'subject')
      .leftJoinAndSelect('subject.career', 'career')
      .orderBy('student.lastName', 'ASC');

    if (where.assignmentId) qb.andWhere('grade.assignmentId = :assignmentId', { assignmentId });
    if (where.studentId) qb.andWhere('grade.studentId = :studentId', { studentId });
    if (academicPeriodId) {
      qb.andWhere('assignment.academicPeriodId = :academicPeriodId', { academicPeriodId });
    }

    return qb.getMany();
  }

  async findForAssignment(assignmentId: string): Promise<Grade[]> {
    return this.findAll({ assignmentId });
  }

  async findForStudent(studentId: string): Promise<Grade[]> {
    return this.findAll({ studentId });
  }

  async findOne(id: string): Promise<Grade> {
    const grade = await this.gradeRepository.findOne({
      where: { id },
      relations: ['student', 'assignment', 'assignment.subject'],
    });
    if (!grade) {
      throw new NotFoundException('Calificación no encontrada');
    }
    return grade;
  }

  async update(id: string, updateDto: UpdateGradeDto): Promise<Grade> {
    const grade = await this.findOne(id);
    Object.assign(grade, updateDto);
    this.calculateFinalGrade(grade);
    const saved = await this.gradeRepository.save(grade);

    const assignment = await this.assignmentRepository.findOne({
      where: { id: saved.assignmentId },
      relations: ['subject', 'academicPeriod'],
    });
    if (assignment) {
      await this.syncHistory(saved, assignment);
    }

    return saved;
  }

  async delete(id: string): Promise<void> {
    const grade = await this.findOne(id);
    await this.historyRepository.delete({ studentId: grade.studentId, subject: { code: '' } });
    await this.gradeRepository.remove(grade);
  }

  private calculateFinalGrade(grade: Grade): void {
    const weights = this.getGradeWeights();

    const parts: Record<string, number> = {
      firstPartial: grade.firstPartial ?? 0,
      secondPartial: grade.secondPartial ?? 0,
      practices: grade.practices ?? 0,
      finalExam: grade.finalExam ?? 0,
    };

    let final = 0;
    final += (parts.firstPartial / 100) * weights.firstPartial;
    final += (parts.secondPartial / 100) * weights.secondPartial;
    final += (parts.practices / 100) * weights.practices;
    final += (parts.finalExam / 100) * weights.finalExam;

    grade.finalGrade = Math.round(final * 100) / 100;
    grade.status = grade.finalGrade >= MIN_PASSING_GRADE
      ? GradeStatus.APPROVED
      : GradeStatus.FAILED;
  }

  private getGradeWeights(): { firstPartial: number; secondPartial: number; practices: number; finalExam: number } {
    return {
      firstPartial: 25,
      secondPartial: 25,
      practices: 20,
      finalExam: 30,
    };
  }

  private async syncHistory(
    grade: Grade,
    assignment: SubjectAssignment,
  ): Promise<void> {
    const student = await this.studentRepository.findOne({
      where: { id: grade.studentId },
      relations: ['career'],
    });
    if (!student) return;

    const existing = await this.historyRepository.findOne({
      where: {
        studentId: grade.studentId,
        subjectId: assignment.subjectId,
        academicPeriodId: assignment.academicPeriodId,
      },
    });

    if (existing) {
      existing.finalGrade = grade.finalGrade ?? null;
      existing.status = grade.status;
      await this.historyRepository.save(existing);
      return;
    }

    const history = this.historyRepository.create({
      studentId: grade.studentId,
      careerId: student.career?.id,
      academicPeriodId: assignment.academicPeriodId,
      subjectId: assignment.subjectId,
      semester: assignment.subject.semester,
      finalGrade: grade.finalGrade ?? null,
      status: grade.status,
    });

    await this.historyRepository.save(history);
  }

  async getCentralizedReport(
    assignmentId: string,
  ): Promise<Array<Record<string, unknown>>> {
    const grades = await this.findForAssignment(assignmentId);
    return grades.map((g) => ({
      studentId: g.studentId,
      studentName: `${g.student.firstName} ${g.student.lastName}`,
      ci: g.student.ci,
      firstPartial: g.firstPartial,
      secondPartial: g.secondPartial,
      practices: g.practices,
      finalExam: g.finalExam,
      finalGrade: g.finalGrade,
      status: g.status,
    }));
  }
}