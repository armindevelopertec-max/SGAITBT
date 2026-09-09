import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { AcademicHistory } from './entities/academic-history.entity';
import { Student } from '@modules/student/entities/student.entity';
import { GradeStatus, StudyConclusionStatus, AcademicStatus } from '@common/enums';

@Injectable()
export class AcademicHistoryService {
  constructor(
    @InjectRepository(AcademicHistory)
    private readonly historyRepository: Repository<AcademicHistory>,
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
  ) {}

  async findForStudent(studentId: string): Promise<AcademicHistory[]> {
    const student = await this.studentRepository.findOne({ where: { id: studentId } });
    if (!student) {
      throw new NotFoundException('Estudiante no encontrado');
    }

    return this.historyRepository.find({
      where: { studentId },
      relations: ['subject', 'career', 'academicPeriod'],
      order: { semester: 'ASC' },
    });
  }

  async findForCareer(careerId: string): Promise<AcademicHistory[]> {
    return this.historyRepository.find({
      where: { careerId },
      relations: ['student', 'subject', 'academicPeriod'],
      order: { semester: 'ASC' },
    });
  }

  async findForPeriod(academicPeriodId: string): Promise<AcademicHistory[]> {
    return this.historyRepository.find({
      where: { academicPeriodId },
      relations: ['student', 'subject', 'career'],
      order: { semester: 'ASC' },
    });
  }

  async getStudentSummary(
    studentId: string,
  ): Promise<{
    approved: number;
    failed: number;
    pending: number;
    total: number;
    completedSemesters: number[];
    conclusion: StudyConclusionStatus;
    details: AcademicHistory[];
  }> {
    const records = await this.findForStudent(studentId);
    const student = await this.studentRepository.findOne({
      where: { id: studentId },
      relations: ['career'],
    });

    const approved = records.filter((r) => r.status === GradeStatus.APPROVED);
    const failed = records.filter((r) => r.status === GradeStatus.FAILED);
    const pending = records.filter((r) => r.status === GradeStatus.PENDING);

    const completedSemestersSet = new Set(
      approved.map((r) => r.semester),
    );
    const completedSemesters = Array.from(completedSemestersSet).sort();

    let conclusion = StudyConclusionStatus.IN_PROGRESS;
    if (!student?.career) {
      conclusion = StudyConclusionStatus.IN_PROGRESS;
    } else if (
      completedSemesters.includes(student.career.numberOfLevels) &&
      failed.length === 0 &&
      pending.length === 0
    ) {
      conclusion = StudyConclusionStatus.COMPLETED;
    }

    const summary = {
      approved: approved.length,
      failed: failed.length,
      pending: pending.length,
      total: records.length,
      completedSemesters,
      conclusion,
      details: records,
    };

    if (conclusion === StudyConclusionStatus.COMPLETED && student) {
      await this.studentRepository.update(student.id, { status: AcademicStatus.GRADUATE });
    }

    return summary;
  }

  async getOverallStats() {
    const approved = await this.historyRepository.count({
      where: { status: GradeStatus.APPROVED },
    });
    const failed = await this.historyRepository.count({
      where: { status: GradeStatus.FAILED },
    });
    const pending = await this.historyRepository.count({
      where: { status: GradeStatus.PENDING },
    });

    const byCareer = await this.historyRepository
      .createQueryBuilder('h')
      .leftJoin('h.career', 'career')
      .select('career.name', 'careerName')
      .addSelect('COUNT(*)', 'total')
      .addSelect(
        `COUNT(CASE WHEN h.status = '${GradeStatus.APPROVED}' THEN 1 END)`,
        'approved',
      )
      .addSelect(
        `COUNT(CASE WHEN h.status = '${GradeStatus.FAILED}' THEN 1 END)`,
        'failed',
      )
      .groupBy('career.name')
      .getRawMany();

    return { approved, failed, pending, byCareer };
  }

  async getGradesByIds(studentIds: string[]) {
    return this.historyRepository.find({ where: { studentId: In(studentIds) } });
  }
}