import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Attendance } from './entities/attendance.entity';
import {
  AttendanceQueryDto,
  CreateAttendanceDto,
  UpdateAttendanceDto,
} from './dto/attendance.dto';
import { AttendanceStatus } from '@common/enums';
import { SubjectEnrollment } from '@modules/subject-assignment/entities/subject-enrollment.entity';
import { SubjectAssignment } from '@modules/subject-assignment/entities/subject-assignment.entity';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(Attendance)
    private readonly attendanceRepository: Repository<Attendance>,
    @InjectRepository(SubjectEnrollment)
    private readonly subjectEnrollmentRepository: Repository<SubjectEnrollment>,
    @InjectRepository(SubjectAssignment)
    private readonly assignmentRepository: Repository<SubjectAssignment>,
  ) {}

  async create(createDto: CreateAttendanceDto): Promise<Attendance[]> {
    const assignment = await this.assignmentRepository.findOne({
      where: { id: createDto.assignmentId },
    });
    if (!assignment) {
      throw new NotFoundException('Asignación no encontrada');
    }

    const studentIds = createDto.records.map((r) => r.studentId);

    const enrollments = await this.subjectEnrollmentRepository.find({
      where: {
        assignmentId: createDto.assignmentId,
        studentId: In(studentIds),
      },
    });

    if (enrollments.length !== studentIds.length) {
      throw new BadRequestException('Uno o más estudiantes no están matriculados en esta materia');
    }

    const existing = await this.attendanceRepository.find({
      where: {
        attendanceDate: createDto.attendanceDate,
        assignmentId: createDto.assignmentId,
      },
    });

    if (existing.length > 0) {
      throw new BadRequestException('Ya existe un registro de asistencia para esta fecha');
    }

    const records = createDto.records.map((record) =>
      this.attendanceRepository.create({
        assignmentId: createDto.assignmentId,
        studentId: record.studentId,
        attendanceDate: createDto.attendanceDate,
        status: record.status,
        observations: record.observations,
      }),
    );

    return this.attendanceRepository.save(records);
  }

  async findAll(query?: AttendanceQueryDto): Promise<Attendance[]> {
    const { assignmentId, studentId, fromDate, toDate } = query || {};
    const qb = this.attendanceRepository
      .createQueryBuilder('attendance')
      .leftJoinAndSelect('attendance.student', 'student')
      .orderBy('attendance.attendanceDate', 'DESC');

    if (assignmentId) {
      qb.andWhere('attendance.assignmentId = :assignmentId', { assignmentId });
    }
    if (studentId) {
      qb.andWhere('attendance.studentId = :studentId', { studentId });
    }
    if (fromDate) {
      qb.andWhere('attendance.attendanceDate >= :fromDate', { fromDate });
    }
    if (toDate) {
      qb.andWhere('attendance.attendanceDate <= :toDate', { toDate });
    }

    return qb.getMany();
  }

  async findForAssignment(assignmentId: string): Promise<Attendance[]> {
    return this.attendanceRepository.find({
      where: { assignmentId },
      relations: ['student'],
      order: { attendanceDate: 'ASC' },
    });
  }

  async update(id: string, updateDto: UpdateAttendanceDto): Promise<Attendance> {
    const attendance = await this.attendanceRepository.findOne({ where: { id } });
    if (!attendance) {
      throw new NotFoundException('Registro de asistencia no encontrado');
    }
    Object.assign(attendance, updateDto);
    return this.attendanceRepository.save(attendance);
  }

  async delete(id: string): Promise<void> {
    const attendance = await this.attendanceRepository.findOne({ where: { id } });
    if (!attendance) {
      throw new NotFoundException('Registro de asistencia no encontrado');
    }
    await this.attendanceRepository.remove(attendance);
  }

  async getSummary(assignmentId: string, studentId?: string) {
    const records = await this.attendanceRepository.find({
      where: { assignmentId },
    });

    const studentsSet = new Set(records.map((r) => r.studentId));
    if (studentId) {
      studentsSet.clear();
      studentsSet.add(studentId);
    }

    const summary = Array.from(studentsSet).map((sid) => {
      const studentRecords = records.filter((r) => r.studentId === sid);
      const total = studentRecords.length;
      const present = studentRecords.filter(
        (r) => r.status === AttendanceStatus.PRESENT,
      ).length;
      const late = studentRecords.filter((r) => r.status === AttendanceStatus.LATE).length;
      const justified = studentRecords.filter(
        (r) => r.status === AttendanceStatus.JUSTIFIED,
      ).length;
      const absent = studentRecords.filter(
        (r) => r.status === AttendanceStatus.ABSENT,
      ).length;
      const percentage = total > 0 ? ((present + late) / total) * 100 : 0;

      return {
        studentId: sid,
        total,
        present,
        late,
        justified,
        absent,
        percentage: Math.round(percentage * 100) / 100,
        lowAttendance: percentage < 75,
      };
    });

    const overall = records.length > 0
      ? summary.reduce(
          (acc, s) => {
            acc.total += s.total;
            acc.present += s.present;
            acc.late += s.late;
            acc.justified += s.justified;
            acc.absent += s.absent;
            return acc;
          },
          { total: 0, present: 0, late: 0, justified: 0, absent: 0 },
        )
      : { total: 0, present: 0, late: 0, justified: 0, absent: 0 };

    return {
      summary,
      overall: {
        ...overall,
        percentage: overall.total > 0
          ? Math.round(((overall.present + overall.late) / overall.total) * 10000) / 100
          : 0,
      },
    };
  }
}