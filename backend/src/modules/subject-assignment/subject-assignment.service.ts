import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { SubjectAssignment } from './entities/subject-assignment.entity';
import { SubjectEnrollment } from './entities/subject-enrollment.entity';
import {
  AutoAssignStudentsDto,
  AutoEnrollStudentDto,
  CreateSubjectAssignmentDto,
  EnrollStudentInAssignmentDto,
  UpdateSubjectAssignmentDto,
  AssignmentQueryDto,
} from './dto/subject-assignment.dto';
import { Subject } from '@modules/subject/entities/subject.entity';
import { AcademicPeriod } from '@modules/academic-period/entities/academic-period.entity';
import { Enrollment } from '@modules/enrollment/entities/enrollment.entity';
import { Employee } from '@modules/employee/entities/employee.entity';
import { EmployeeType } from '@common/enums';
import { Parallel } from '@modules/parallel/entities/parallel.entity';
import { Student } from '@modules/student/entities/student.entity';

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
    @InjectRepository(Parallel)
    private readonly parallelRepository: Repository<Parallel>,
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
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

    if (createDto.parallelId) {
      const parallel = await this.parallelRepository.findOne({
        where: { id: createDto.parallelId },
      });
      if (!parallel) {
        throw new BadRequestException('El paralelo no existe');
      }
    }

    const existing = await this.assignmentRepository.findOne({
      where: {
        subjectId: createDto.subjectId,
        academicPeriodId: createDto.academicPeriodId,
        parallelId: createDto.parallelId ?? undefined,
      },
    });
    if (existing) {
      throw new BadRequestException('Ya existe una asignación para esa materia y paralelo');
    }

    const assignment = this.assignmentRepository.create({
      ...createDto,
      semester: createDto.semester ?? subject.semester,
    });

    return this.assignmentRepository.save(assignment);
  }

  async findAll(query?: AssignmentQueryDto): Promise<SubjectAssignment[]> {
    const { subjectId, academicPeriodId, employeeId, parallelId } = query || {};
    const where: Record<string, unknown> = {};
    if (subjectId) where.subjectId = subjectId;
    if (academicPeriodId) where.academicPeriodId = academicPeriodId;
    if (employeeId) where.employeeId = employeeId;
    if (parallelId) where.parallelId = parallelId;

    return this.assignmentRepository.find({
      where,
      relations: [
        'subject',
        'subject.career',
        'academicPeriod',
        'employee',
        'employee.person',
        'parallelEntity',
        'enrollments',
        'enrollments.student',
        'enrollments.student.person',
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
        'employee.person',
        'parallelEntity',
        'enrollments',
        'enrollments.student',
        'enrollments.student.person',
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
      relations: ['student', 'student.person'],
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
        academicPeriodId: assignment.academicPeriodId,
      },
    });
    if (existing) {
      throw new BadRequestException('El estudiante ya está asignado a esta materia');
    }

    const enrollment = this.enrollmentRepository.create({
      assignmentId,
      studentId: dto.studentId,
      academicPeriodId: assignment.academicPeriodId,
    });

    return this.enrollmentRepository.save(enrollment);
  }

  async removeStudent(assignmentId: string, studentId: string): Promise<void> {
    const assignment = await this.assignmentRepository.findOne({ where: { id: assignmentId } });
    if (!assignment) {
      throw new NotFoundException('Asignación no encontrada');
    }
    const enrollment = await this.enrollmentRepository.findOne({
      where: { assignmentId, studentId, academicPeriodId: assignment.academicPeriodId },
    });
    if (!enrollment) {
      throw new NotFoundException('El estudiante no está asignado a esta materia');
    }
    await this.enrollmentRepository.softDelete(enrollment.id);
  }

  async getStudents(assignmentId: string): Promise<SubjectEnrollment[]> {
    return this.enrollmentRepository.find({
      where: { assignmentId },
      relations: ['student', 'student.person', 'student.career'],
      order: { createdAt: 'ASC' },
    });
  }

  async delete(id: string): Promise<void> {
    const assignment = await this.findOne(id);
    await this.assignmentRepository.softDelete(assignment.id);
  }

  async autoEnrollStudent(dto: AutoEnrollStudentDto): Promise<{ assigned: number; subjects: string[] }> {
    const student = await this.studentRepository.findOne({ where: { id: dto.studentId } });
    if (!student) {
      throw new NotFoundException('Estudiante no encontrado');
    }

    const period = await this.periodRepository.findOne({ where: { id: dto.academicPeriodId } });
    if (!period) {
      throw new NotFoundException('Gestión académica no encontrada');
    }

    const currentLevel = student.currentLevel || 1;

    const subjects = await this.subjectRepository.find({
      where: { careerId: student.careerId, semester: currentLevel },
    });

    if (subjects.length === 0) {
      return { assigned: 0, subjects: [] };
    }

    const parallelA = await this.parallelRepository.findOne({
      where: { code: 'A' },
    });
    if (!parallelA) {
      throw new BadRequestException('No existe paralelo A en el sistema');
    }

    const teachers = await this.employeeRepository.find({
      where: { employeeType: EmployeeType.DOCENTE },
      take: 1,
    });
    const teacher = teachers[0];
    if (!teacher) {
      throw new BadRequestException('No hay docentes disponibles');
    }

    let assigned = 0;
    const assignedSubjects: string[] = [];

    for (const subject of subjects) {
      let assignment = await this.assignmentRepository.findOne({
        where: {
          subjectId: subject.id,
          academicPeriodId: dto.academicPeriodId,
          parallelId: parallelA.id,
        },
      });

      if (!assignment) {
        assignment = await this.assignmentRepository.save(
          this.assignmentRepository.create({
            subjectId: subject.id,
            academicPeriodId: dto.academicPeriodId,
            parallelId: parallelA.id,
            employeeId: teacher.id,
            semester: subject.semester,
            schedule: { day: 'LUN', start: '18:00', end: '21:00' },
          }),
        );
      }

      const existing = await this.enrollmentRepository.findOne({
        where: {
          studentId: dto.studentId,
          assignmentId: assignment.id,
          academicPeriodId: dto.academicPeriodId,
        },
      });

      if (!existing) {
        await this.enrollmentRepository.save(
          this.enrollmentRepository.create({
            studentId: dto.studentId,
            assignmentId: assignment.id,
            academicPeriodId: dto.academicPeriodId,
          }),
        );
        assigned++;
        assignedSubjects.push(subject.name);
      }
    }

    return { assigned, subjects: assignedSubjects };
  }
}