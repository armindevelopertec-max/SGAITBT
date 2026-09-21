import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { EnrollmentService } from './enrollment.service';
import { Enrollment } from './entities/enrollment.entity';
import { Student } from '@modules/student/entities/student.entity';
import { Career } from '@modules/career/entities/career.entity';
import { AcademicPeriod } from '@modules/academic-period/entities/academic-period.entity';
import { DepositService } from '@modules/deposit/deposit.service';
import { DepositStatus, EnrollmentStatus } from '@common/enums';

function createMocks(overrides: Record<string, unknown> = {}) {
  const repos = {
    enrollmentRepository: {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      createQueryBuilder: jest.fn(),
    },
    studentRepository: {
      findOne: jest.fn(),
      update: jest.fn(),
    },
    careerRepository: {
      findOne: jest.fn(),
    },
    periodRepository: {
      findOne: jest.fn(),
    },
    depositService: {
      findAll: jest.fn(),
    },
    ...overrides,
  };
  return repos;
}

describe('EnrollmentService', () => {
  let service: EnrollmentService;
  let mocks: ReturnType<typeof createMocks>;

  beforeEach(async () => {
    mocks = createMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EnrollmentService,
        { provide: getRepositoryToken(Enrollment), useValue: mocks.enrollmentRepository },
        { provide: getRepositoryToken(Student), useValue: mocks.studentRepository },
        { provide: getRepositoryToken(Career), useValue: mocks.careerRepository },
        { provide: getRepositoryToken(AcademicPeriod), useValue: mocks.periodRepository },
        { provide: DepositService, useValue: mocks.depositService },
      ],
    }).compile();

    service = module.get<EnrollmentService>(EnrollmentService);
  });

  describe('create', () => {
    beforeEach(() => {
      mocks.enrollmentRepository.create.mockImplementation((dto) => ({ ...dto }));
      mocks.enrollmentRepository.save.mockImplementation((e) => Promise.resolve(e));
    });

    it('requiere un depósito verificado o aprobado', async () => {
      mocks.enrollmentRepository.findOne.mockResolvedValue(null);
      mocks.studentRepository.findOne.mockResolvedValue({ id: 'st-1' });
      mocks.careerRepository.findOne.mockResolvedValue({ id: 'c-1' });
      mocks.periodRepository.findOne.mockResolvedValue({ id: 'p-1', year: '2026' });
      mocks.depositService.findAll.mockResolvedValue([]);

      await expect(
        service.create({
          studentId: 'st-1',
          careerId: 'c-1',
          academicPeriodId: 'p-1',
          enrollmentDate: '2026-02-02',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('matricula cuando existe un depósito aprobado', async () => {
      mocks.enrollmentRepository.findOne.mockResolvedValue(null);
      mocks.studentRepository.findOne.mockResolvedValue({ id: 'st-1' });
      mocks.careerRepository.findOne.mockResolvedValue({ id: 'c-1' });
      mocks.periodRepository.findOne.mockResolvedValue({ id: 'p-1', year: '2026' });
      mocks.depositService.findAll.mockResolvedValue([
        { id: 'd-1', status: DepositStatus.APPROVED },
      ]);
      mocks.enrollmentRepository.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      });

      const enrollment = await service.create({
        studentId: 'st-1',
        careerId: 'c-1',
        academicPeriodId: 'p-1',
        enrollmentDate: '2026-02-02',
      });

      expect(enrollment.status).toBe(EnrollmentStatus.ACTIVE);
      expect(enrollment.enrollmentNumber).toMatch(/^MAT-2026-\d{5}$/);
      expect(mocks.studentRepository.update).toHaveBeenCalledWith('st-1', expect.anything());
    });

    it('lanza ConflictException si ya está matriculado en la gestión', async () => {
      mocks.enrollmentRepository.findOne.mockResolvedValue({ id: 'e-1' });

      await expect(
        service.create({
          studentId: 'st-1',
          careerId: 'c-1',
          academicPeriodId: 'p-1',
          enrollmentDate: '2026-02-02',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('generateEnrollmentNumber', () => {
    it('continúa la secuencia por año', async () => {
      mocks.periodRepository.findOne.mockResolvedValue({ id: 'p-1', year: '2026' });
      mocks.enrollmentRepository.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue({ enrollmentNumber: 'MAT-2026-00042' }),
      });

      const number = await service.generateEnrollmentNumber('p-1');

      expect(number).toBe('MAT-2026-00043');
    });

    it('lanza NotFoundException si no existe la gestión', async () => {
      mocks.periodRepository.findOne.mockResolvedValue(null);

      await expect(service.generateEnrollmentNumber('p-404')).rejects.toThrow(NotFoundException);
    });
  });

  describe('cancel', () => {
    it('cancela la matrícula y marca al estudiante inactivo', async () => {
      mocks.enrollmentRepository.findOne.mockResolvedValue({
        id: 'e-1',
        studentId: 'st-1',
        status: EnrollmentStatus.ACTIVE,
      });
      mocks.enrollmentRepository.save.mockImplementation((e) => Promise.resolve(e));

      const enrollment = await service.cancel('e-1');

      expect(enrollment.status).toBe(EnrollmentStatus.CANCELLED);
      expect(mocks.studentRepository.update).toHaveBeenCalledWith('st-1', {
        status: expect.anything(),
      });
    });
  });
});