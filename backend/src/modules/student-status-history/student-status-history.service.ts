import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StudentStatusHistory } from './entities/student-status-history.entity';
import { StudentStatusHistoryQueryDto } from './dto/student-status-history.dto';
import { AcademicStatus } from '@common/enums';

@Injectable()
export class StudentStatusHistoryService {
  constructor(
    @InjectRepository(StudentStatusHistory)
    private readonly repository: Repository<StudentStatusHistory>,
  ) {}

  async create(
    studentId: string,
    previousData: {
      status?: AcademicStatus | null;
      careerId?: string | null;
      level?: number | null;
    },
    newData: {
      status?: AcademicStatus | null;
      careerId?: string | null;
      level?: number | null;
    },
    academicPeriodId?: string,
    changedById?: string,
    changeReason?: string,
    clientIp?: string,
  ): Promise<StudentStatusHistory> {
    const history = new StudentStatusHistory();
    history.studentId = studentId;
    history.previousStatus = previousData.status ?? undefined;
    history.newStatus = newData.status ?? undefined;
    history.previousCareerId = previousData.careerId ?? undefined;
    history.newCareerId = newData.careerId ?? undefined;
    history.previousLevel = previousData.level ?? undefined;
    history.newLevel = newData.level ?? undefined;
    history.academicPeriodId = academicPeriodId;
    history.changedById = changedById;
    history.changeReason = changeReason;
    history.clientIp = clientIp;

    return this.repository.save(history);
  }

  async findAll(
    query?: StudentStatusHistoryQueryDto,
  ): Promise<StudentStatusHistory[]> {
    const where: Record<string, unknown> = {};

    if (query?.studentId) where.studentId = query.studentId;
    if (query?.academicPeriodId) where.academicPeriodId = query.academicPeriodId;
    if (query?.changedById) where.changedById = query.changedById;
    if (query?.status) where.newStatus = query.status;

    return this.repository.find({
      where,
      relations: [
        'student',
        'student.person',
        'previousCareer',
        'newCareer',
        'academicPeriod',
        'changedBy',
      ],
      order: { createdAt: 'DESC' },
    });
  }

  async findByStudent(studentId: string): Promise<StudentStatusHistory[]> {
    return this.repository.find({
      where: { studentId },
      relations: [
        'student',
        'student.person',
        'previousCareer',
        'newCareer',
        'academicPeriod',
        'changedBy',
      ],
      order: { createdAt: 'ASC' },
    });
  }

  async findByPeriod(academicPeriodId: string): Promise<StudentStatusHistory[]> {
    return this.repository.find({
      where: { academicPeriodId },
      relations: [
        'student',
        'student.person',
        'previousCareer',
        'newCareer',
        'changedBy',
      ],
      order: { createdAt: 'DESC' },
    });
  }

  async getStatusAtPeriod(
    studentId: string,
    academicPeriodId: string,
  ): Promise<StudentStatusHistory | null> {
    const allHistory = await this.findByStudent(studentId);
    const periodEndDate = await this.getPeriodEndDate(academicPeriodId);

    return (
      allHistory.find(
        (h) =>
          h.academicPeriodId === academicPeriodId ||
          (h.academicPeriodId &&
            h.createdAt <= (periodEndDate || new Date())),
      ) || null
    );
  }

  private async getPeriodEndDate(periodId: string): Promise<Date | null> {
    const { AcademicPeriod } = await import(
      '@modules/academic-period/entities/academic-period.entity'
    );
    const repo = this.repository.manager.getRepository(AcademicPeriod);
    const period = await repo.findOne({ where: { id: periodId } });
    return period?.endDate ? new Date(period.endDate) : null;
  }
}
