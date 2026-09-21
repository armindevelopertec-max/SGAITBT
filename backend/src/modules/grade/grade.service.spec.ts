import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { GradeService, MIN_PASSING_GRADE } from './grade.service';
import { Grade } from './entities/grade.entity';
import { SubjectAssignment } from '@modules/subject-assignment/entities/subject-assignment.entity';
import { SubjectEnrollment } from '@modules/subject-assignment/entities/subject-enrollment.entity';
import { AcademicHistory } from '@modules/academic-history/entities/academic-history.entity';
import { Student } from '@modules/student/entities/student.entity';
import { Career } from '@modules/career/entities/career.entity';
import { GradeStatus } from '@common/enums';
import { GradeHistoryService } from '@modules/grade-history/grade-history.service';

const assignment = {
  id: 'a-1',
  subjectId: 's-1',
  academicPeriodId: 'p-1',
  subject: { semester: 1 },
} as SubjectAssignment;

function createMocks(overrides: Record<string, unknown> = {}) {
  const repos = {
    gradeRepository: {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      createQueryBuilder: jest.fn(),
      remove: jest.fn(),
      delete: jest.fn(),
    },
    assignmentRepository: {
      findOne: jest.fn(),
    },
    subjectEnrollmentRepository: {
      findOne: jest.fn(),
    },
    historyRepository: {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    },
    studentRepository: {
      findOne: jest.fn(),
    },
    careerRepository: {
      findOne: jest.fn(),
    },
    gradeHistoryService: {
      create: jest.fn().mockResolvedValue({}),
    },
    ...overrides,
  };
  return repos;
}

describe('GradeService', () => {
  let service: GradeService;
  let mocks: ReturnType<typeof createMocks>;

  beforeEach(async () => {
    mocks = createMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GradeService,
        { provide: getRepositoryToken(Grade), useValue: mocks.gradeRepository },
        { provide: getRepositoryToken(SubjectAssignment), useValue: mocks.assignmentRepository },
        { provide: getRepositoryToken(SubjectEnrollment), useValue: mocks.subjectEnrollmentRepository },
        { provide: getRepositoryToken(AcademicHistory), useValue: mocks.historyRepository },
        { provide: getRepositoryToken(Student), useValue: mocks.studentRepository },
        { provide: getRepositoryToken(Career), useValue: mocks.careerRepository },
        { provide: GradeHistoryService, useValue: mocks.gradeHistoryService },
      ],
    }).compile();

    service = module.get<GradeService>(GradeService);
  });

  describe('create', () => {
    it('lanza NotFoundException si la asignación no existe', async () => {
      mocks.assignmentRepository.findOne.mockResolvedValue(null);

      await expect(
        service.create({ assignmentId: 'a-1', studentId: 'st-1' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('lanza BadRequestException si el estudiante no está matriculado', async () => {
      mocks.assignmentRepository.findOne.mockResolvedValue(assignment);
      mocks.subjectEnrollmentRepository.findOne.mockResolvedValue(null);

      await expect(
        service.create({ assignmentId: 'a-1', studentId: 'st-1' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('lanza BadRequestException si ya existen calificaciones', async () => {
      mocks.assignmentRepository.findOne.mockResolvedValue(assignment);
      mocks.subjectEnrollmentRepository.findOne.mockResolvedValue({ id: 'se-1' });
      mocks.gradeRepository.findOne.mockResolvedValue({ id: 'gr-1' });

      await expect(
        service.create({ assignmentId: 'a-1', studentId: 'st-1' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('calcula la nota final con ponderación 25/25/20/30 y aprueba con >= 51', async () => {
      mocks.assignmentRepository.findOne.mockResolvedValue(assignment);
      mocks.subjectEnrollmentRepository.findOne.mockResolvedValue({ id: 'se-1' });
      mocks.gradeRepository.findOne.mockResolvedValue(null);
      mocks.gradeRepository.create.mockImplementation((dto) => ({ ...dto }));
      mocks.gradeRepository.save.mockImplementation((g) => Promise.resolve(g));

      const grade = await service.create({
        assignmentId: 'a-1',
        studentId: 'st-1',
        firstPartial: 60,
        secondPartial: 60,
        practices: 60,
        finalExam: 60,
      });

      expect(grade.finalGrade).toBe(60);
      expect(grade.status).toBe(GradeStatus.APPROVED);
    });

    it('marca FAILED cuando la nota final es menor a 51', async () => {
      mocks.assignmentRepository.findOne.mockResolvedValue(assignment);
      mocks.subjectEnrollmentRepository.findOne.mockResolvedValue({ id: 'se-1' });
      mocks.gradeRepository.findOne.mockResolvedValue(null);
      mocks.gradeRepository.create.mockImplementation((dto) => ({ ...dto }));
      mocks.gradeRepository.save.mockImplementation((g) => Promise.resolve(g));

      const grade = await service.create({
        assignmentId: 'a-1',
        studentId: 'st-1',
        firstPartial: 50,
        secondPartial: 50,
        practices: 50,
        finalExam: 50,
      });

      expect(grade.finalGrade).toBe(50);
      expect(grade.status).toBe(GradeStatus.FAILED);
    });

    it(`aprueba exactamente con la nota mínima ${MIN_PASSING_GRADE}`, async () => {
      mocks.assignmentRepository.findOne.mockResolvedValue(assignment);
      mocks.subjectEnrollmentRepository.findOne.mockResolvedValue({ id: 'se-1' });
      mocks.gradeRepository.findOne.mockResolvedValue(null);
      mocks.gradeRepository.create.mockImplementation((dto) => ({ ...dto }));
      mocks.gradeRepository.save.mockImplementation((g) => Promise.resolve(g));

      const grade = await service.create({
        assignmentId: 'a-1',
        studentId: 'st-1',
        firstPartial: 51,
        secondPartial: 51,
        practices: 51,
        finalExam: 51,
      });

      expect(grade.finalGrade).toBe(51);
      expect(grade.status).toBe(GradeStatus.APPROVED);
    });
  });

  describe('findOne', () => {
    it('lanza NotFoundException si la calificación no existe', async () => {
      mocks.gradeRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('gr-1')).rejects.toThrow(NotFoundException);
    });
  });
});