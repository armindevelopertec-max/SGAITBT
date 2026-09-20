import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Student } from '@modules/student/entities/student.entity';
import { Enrollment } from '@modules/enrollment/entities/enrollment.entity';
import { Deposit } from '@modules/deposit/entities/deposit.entity';
import { User } from '@modules/user/entities/user.entity';
import { Subject } from '@modules/subject/entities/subject.entity';
import { Career } from '@modules/career/entities/career.entity';
import { AcademicHistory } from '@modules/academic-history/entities/academic-history.entity';
import {
  AcademicStatus,
  DepositStatus,
  EnrollmentStatus,
  GradeStatus,
} from '@common/enums';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    @InjectRepository(Enrollment)
    private readonly enrollmentRepository: Repository<Enrollment>,
    @InjectRepository(Deposit)
    private readonly depositRepository: Repository<Deposit>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Subject)
    private readonly subjectRepository: Repository<Subject>,
    @InjectRepository(Career)
    private readonly careerRepository: Repository<Career>,
    @InjectRepository(AcademicHistory)
    private readonly historyRepository: Repository<AcademicHistory>,
  ) {}

  async getAdminDashboard() {
    const startOfYear = new Date(new Date().getFullYear(), 0, 1);
    const [
      totalStudents,
      activeStudents,
      newStudents,
      teachers,
      activeSubjects,
      careers,
      enrollmentsThisYear,
      pendingDeposits,
      approved,
      failed,
      graduates,
    ] = await Promise.all([
      this.studentRepository.count(),
      this.studentRepository.count({ where: { status: AcademicStatus.ACTIVE } }),
      this.studentRepository
        .createQueryBuilder('student')
        .where('student.createdAt >= :start', { start: startOfYear })
        .getCount(),
      this.userRepository
        .createQueryBuilder('user')
        .innerJoin('user.userRoles', 'userRole')
        .innerJoin('userRole.role', 'assignedRole')
        .where('assignedRole.name = :roleKey', { roleKey: 'DOCENTE' })
        .andWhere('user.isActive = true')
        .getCount(),
      this.subjectRepository.count({ where: { isActive: true } }),
      this.careerRepository.count({ where: { isActive: true } }),
      this.enrollmentRepository.count({
        where: {
          status: EnrollmentStatus.ACTIVE,
          createdAt: MoreThan(startOfYear),
        },
      }),
      this.depositRepository.count({ where: { status: DepositStatus.PENDING } }),
      this.historyRepository.count({ where: { status: GradeStatus.APPROVED } }),
      this.historyRepository.count({ where: { status: GradeStatus.FAILED } }),
      this.studentRepository.count({ where: { status: AcademicStatus.GRADUATE } }),
    ]);

    const studentsByCareer = await this.studentRepository
      .createQueryBuilder('student')
      .leftJoin('student.career', 'career')
      .select('career.name', 'careerName')
      .addSelect('COUNT(*)', 'total')
      .groupBy('career.name')
      .getRawMany();

    const studentsByStatus = await this.studentRepository
      .createQueryBuilder('student')
      .select('student.status', 'status')
      .addSelect('COUNT(*)', 'total')
      .groupBy('student.status')
      .getRawMany();

    const recentStudents = await this.studentRepository.find({
      order: { createdAt: 'DESC' },
      take: 10,
      relations: ['career'],
    });

    return {
      summary: {
        totalStudents,
        activeStudents,
        newStudents,
        teachers,
        activeSubjects,
        careers,
        enrollmentsThisYear,
        pendingDeposits,
        approved,
        failed,
        graduates,
      },
      studentsByCareer,
      studentsByStatus,
      recentStudents,
    };
  }

  async getTeacherDashboard(_teacherId: string) {
    const assignments = await this.enrollmentRepository
      .createQueryBuilder('e')
      .select('COUNT(DISTINCT e.studentId)', 'students')
      .where('e.status = :status', { status: EnrollmentStatus.ACTIVE })
      .getRawOne();

    return {
      summary: {
        mySubjects: 0,
        myStudents: assignments?.students ?? 0,
      },
    };
  }

  async getStudentDashboard(studentId: string) {
    const student = await this.studentRepository.findOne({
      where: { id: studentId },
      relations: ['career', 'person'],
    });
    if (!student) {
      throw new NotFoundException('Estudiante no encontrado');
    }

    const enrollment = await this.enrollmentRepository.findOne({
      where: {
        studentId,
        status: EnrollmentStatus.ACTIVE,
      },
      order: { createdAt: 'DESC' },
      relations: ['academicPeriod'],
    });

    const history = await this.historyRepository.find({
      where: { studentId },
    });
    const approved = history.filter((h) => h.status === GradeStatus.APPROVED).length;
    const failed = history.filter((h) => h.status === GradeStatus.FAILED).length;

    return {
      student: {
        id: student.id,
        firstName: student.person?.firstName,
        lastName: student.person?.lastName,
        studentCode: student.studentCode,
        career: student.career?.name,
        currentLevel: student.currentLevel,
        currentPeriod: enrollment?.academicPeriod?.periodName,
        status: student.status,
      },
      enrollment: enrollment
        ? {
            enrollmentNumber: enrollment.enrollmentNumber,
            period: enrollment.academicPeriod.periodName,
            status: enrollment.status,
          }
        : null,
      academicSummary: {
        approved,
        failed,
        total: history.length,
      },
    };
  }
}