import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { GradeHistory } from './entities/grade-history.entity';
import { GradeHistoryQueryDto } from './dto/grade-history.dto';

@Injectable()
export class GradeHistoryService {
  constructor(
    @InjectRepository(GradeHistory)
    private readonly repository: Repository<GradeHistory>,
  ) {}

  async create(
    gradeId: string,
    previousData: Partial<GradeHistory>,
    newData: Partial<GradeHistory>,
    changedById?: string,
    clientIp?: string,
  ): Promise<GradeHistory> {
    const history = this.repository.create({
      gradeId,
      previousFirstPartial: previousData.previousFirstPartial,
      previousSecondPartial: previousData.previousSecondPartial,
      previousPractices: previousData.previousPractices,
      previousFinalExam: previousData.previousFinalExam,
      previousFinalGrade: previousData.previousFinalGrade,
      previousStatus: previousData.previousStatus,
      newFirstPartial: newData.newFirstPartial,
      newSecondPartial: newData.newSecondPartial,
      newPractices: newData.newPractices,
      newFinalExam: newData.newFinalExam,
      newFinalGrade: newData.newFinalGrade,
      newStatus: newData.newStatus,
      changedById,
      clientIp,
    });

    return this.repository.save(history);
  }

  async findAll(query?: GradeHistoryQueryDto): Promise<GradeHistory[]> {
    const where: Record<string, unknown> = {};

    if (query?.gradeId) {
      where.gradeId = query.gradeId;
    }
    if (query?.changedById) {
      where.changedById = query.changedById;
    }
    if (query?.startDate) {
      where.createdAt = MoreThanOrEqual(new Date(query.startDate));
    }
    if (query?.endDate) {
      where.createdAt = LessThanOrEqual(new Date(query.endDate));
    }

    return this.repository.find({
      where,
      relations: ['grade', 'grade.student', 'grade.student.person', 'changedBy'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByGrade(gradeId: string): Promise<GradeHistory[]> {
    return this.repository.find({
      where: { gradeId },
      relations: ['grade', 'grade.student', 'grade.student.person', 'changedBy'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByStudent(studentId: string): Promise<GradeHistory[]> {
    return this.repository.find({
      where: {},
      relations: ['grade', 'grade.student', 'changedBy'],
      order: { createdAt: 'DESC' },
    });
  }
}
