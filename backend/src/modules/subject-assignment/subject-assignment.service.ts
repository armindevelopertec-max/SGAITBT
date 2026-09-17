import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { SubjectAssignment } from './entities/subject-assignment.entity';
import { SubjectEnrollment } from './entities/subject-enrollment.entity';
import {
  AutoAssignStudentsDto,
  CreateSubjectAssignmentDto,
  EnrollStudentInAssignmentDto,
  UpdateSubjectAssignmentDto,
  AssignmentQueryDto,
} from './dto/subject-assignment.dto';
import { Subject } from '@modules/subject/entities/subject.entity';
import { AcademicPeriod } from '@modules/academic-period/entities/academic-period.entity';
import { Enrollment } from '@modules/enrollment/entities/enrollment.entity';
import { Employee } from '@modules/employee/entities/employee.entity';

@Injectable()
export class SubjectAssignmentService {
  constructor(
    @InjectRepository(SubjectAssignment)
    private readonly assignmentRepository: Repository<SubjectAssignment>,
    @InjectRepository(SubjectEnrollment)
    private readonly enrollmentRepository: Repository<SubjectEnrollment>,
    @InjectRepository(Subject)
    private readonly subjectRepository: Repository<Subject>,
    @InjectRepository(AcademicPeriod)
    private readonly periodRepository: Repository<AcademicPeriod>,
    @InjectRepository(Enrollment)
    private readonly matriculaRepository: Repository<Enrollment>,
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
  ) {}

  async create(createDto: CreateSubjectAssignmentDto): Promise<SubjectAssignment> {
    const subject = await this.subjectRepository.findOne({
      where: { id: createDto.subjectId },
    });
    if (!subject) {
      throw new NotFoundException('Materia no encontrada');
    }

    const period = await this.periodRepository.findOne({
      where: { id: createDto.academicPeriodId },
    });
    if (!period) {
      throw new NotFoundException('Gestión académica no encontrada');
    }

    if (createDto.employeeId) {
      const employee = await this.employeeRepository.findOne({
        where: { id: createDto.employeeId },
      });
      if (!employee) {
        throw new BadRequestException('El docente no existe');
      }
    }

    const existing = await this.assignmentRepository.findOne({
      where: {
        subjectId: createDto.subjectId,
        academicPeriodId: createDto.academicPeriodId,
        parallel: createDto.parallel ?? 'A',
      },
    });
    if (existing) {
      throw new BadRequestException('Ya existe una asignación para esa materia, gestión y paralelo');
    }

    const assignment = this.assignmentRepository.create({
      ...createDto,
      semester: createDto.semester ?? subject.semester,
      parallel: createDto.parallel ?? 'A',
    });

    return this.assignmentRepository.save(assignment);
  }

  async findAll(query?: AssignmentQueryDto): Promise<SubjectAssignment[]> {
    const { subjectId, academicPeriodId, employeeId, parallel } = query || {};
    const where: Record<string, unknown> = {};
    if (subjectId) where.subjectId = subjectId;
    if (academicPeriodId) where.academicPeriodId = academicPeriodId;
    if (employeeId) where.employeeId = employeeId;
    if (parallel) where.parallel = parallel;

    return this.assignmentRepository.find({
      where,
      relations: [
        'subject',
        'academicPeriod',
        'employee',
        'employee.persona',
        'enrollments',
      ],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<SubjectAssignment> {
    const assignment = await this.assignmentRepository.findOne({
      where: { id },
      relations: [
        'subject',
        'academicPeriod',
        'employee',
        'employee.persona',
        'enrollments',
        'enrollments.student',
      ],
    });
    if (!assignment) {
      throw new NotFoundException('Asignación no encontrada');
    }
    return assignment;
  }

  async findByEmployee(employeeId: string): Promise<SubjectAssignment[]> {
    return this.assignmentRepository.find({
      where: { employeeId },
      relations: ['subject', 'academicPeriod'],
      order: { createdAt: 'DESC' },
    });
  }

  async update(id: string, updateDto: UpdateSubjectAssignmentDto): Promise<SubjectAssignment> {
    const assignment = await this.findOne(id);
    if (updateDto.employeeId) {
      const employee = await this.employeeRepository.findOne({
        where: { id: updateDto.employeeId },
      });
      if (!employee) {
        throw new BadRequestException('El docente no existe');
      }
    }
    Object.assign(assignment, updateDto);
    return this.assignmentRepository.save(assignment);
  }

  async autoAssignStudents(dto: AutoAssignStudentsDto): Promise<{ assigned: number }> {
    const assignment = await this.assignmentRepository.findOne({
      where: {
        subjectId: dto.subjectId,
        academicPeriodId: dto.academicPeriodId,
      },
    });
    if (!assignment) {
      throw new BadRequestException('No existe una asignación para la materia y gestión indicadas');
    }
    const assignmentId = assignment.id;

    if (dto.studentIds && dto.studentIds.length > 0) {
      const existing = await this.enrollmentRepository.find({
        where: { assignmentId, studentId: In(dto.studentIds) },
      });
      const existingIds = new Set(existing.map((e) => e.studentId));
      for (const studentId of dto.studentIds) {
        if (!existingIds.has(studentId)) {
          await this.enrollmentRepository.save(
            this.enrollmentRepository.create({ studentId, assignmentId }),
          );
        }
      }
      return { assigned: dto.studentIds.length - existingIds.size };
    }

    const enrolled = await this.matriculaRepository.find({
      where: { academicPeriodId: dto.academicPeriodId },
      relations: ['student'],
    });

    let assigned = 0;
    for (const enrollment of enrolled) {
      const existing = await this.enrollmentRepository.findOne({
        where: {
          assignmentId,
          studentId: enrollment.studentId,
        },
      });
      if (!existing) {
        await this.enrollmentRepository.save(
          this.enrollmentRepository.create({
            studentId: enrollment.studentId,
            assignmentId,
          }),
        );
        assigned += 1;
      }
    }

    return { assigned };
  }

  async enrollStudent(assignmentId: string, dto: EnrollStudentInAssignmentDto): Promise<SubjectEnrollment> {
    const assignment = await this.assignmentRepository.findOne({
      where: { id: assignmentId },
    });
    if (!assignment) {
      throw new NotFoundException('Asignación no encontrada');
    }

    const existing = await this.enrollmentRepository.findOne({
      where: {
        assignmentId,
        studentId: dto.studentId,
      },
    });
    if (existing) {
      throw new BadRequestException('El estudiante ya está asignado a esta materia');
    }

    const enrollment = this.enrollmentRepository.create({
      assignmentId,
      studentId: dto.studentId,
    });

    return this.enrollmentRepository.save(enrollment);
  }

  async removeStudent(assignmentId: string, studentId: string): Promise<void> {
    const enrollment = await this.enrollmentRepository.findOne({
      where: { assignmentId, studentId },
    });
    if (!enrollment) {
      throw new NotFoundException('El estudiante no está asignado a esta materia');
    }
    await this.enrollmentRepository.softDelete(enrollment.id);
  }

  async getStudents(assignmentId: string): Promise<SubjectEnrollment[]> {
    return this.enrollmentRepository.find({
      where: { assignmentId },
      relations: ['student', 'student.career'],
      order: { createdAt: 'ASC' },
    });
  }
}