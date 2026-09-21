import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { Certificate } from './entities/certificate.entity';
import {
  CreateCertificateDto,
  RevokeCertificateDto,
  CertificateQueryDto,
  VerifyCertificateResponseDto,
} from './dto/certificate.dto';
import { CertificateType, CertificateStatus } from '@common/enums';
import { Student } from '@modules/student/entities/student.entity';
import { Enrollment } from '@modules/enrollment/entities/enrollment.entity';
import { User } from '@modules/user/entities/user.entity';

@Injectable()
export class CertificateService {
  constructor(
    @InjectRepository(Certificate)
    private readonly repository: Repository<Certificate>,
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    @InjectRepository(Enrollment)
    private readonly enrollmentRepository: Repository<Enrollment>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(
    dto: CreateCertificateDto,
    issuedById: string,
  ): Promise<Certificate> {
    const student = await this.studentRepository.findOne({
      where: { id: dto.studentId },
      relations: ['person', 'career'],
    });
    if (!student) {
      throw new NotFoundException('Estudiante no encontrado');
    }

    const verificationCode = this.generateVerificationCode();
    const documentNumber = await this.generateDocumentNumber(dto.certificateType);

    const certificate = this.repository.create({
      certificateType: dto.certificateType,
      studentId: dto.studentId,
      enrollmentId: dto.enrollmentId,
      verificationCode,
      documentNumber,
      issuedAt: new Date(),
      issuedById,
      validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined,
      status: CertificateStatus.ACTIVE,
      metadata: dto.metadata,
    });

    return this.repository.save(certificate);
  }

  private generateVerificationCode(): string {
    return crypto.randomBytes(16).toString('hex').toUpperCase();
  }

  private async generateDocumentNumber(
    certificateType: CertificateType,
  ): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = this.getPrefix(certificateType);

    const lastCertificate = await this.repository.findOne({
      where: { certificateType },
      order: { createdAt: 'DESC' },
    });

    let nextNumber = 1;
    if (lastCertificate) {
      const lastNumber = lastCertificate.documentNumber.split('-')[2];
      nextNumber = parseInt(lastNumber, 10) + 1;
    }

    return `${prefix}-${year}-${String(nextNumber).padStart(5, '0')}`;
  }

  private getPrefix(certificateType: CertificateType): string {
    const prefixes: Record<CertificateType, string> = {
      [CertificateType.NOTES]: 'CERT-NOT',
      [CertificateType.STUDIES]: 'CERT-EST',
      [CertificateType.REGULAR]: 'CERT-REG',
      [CertificateType.ENROLLMENT]: 'CERT-MAT',
      [CertificateType.HISTORY]: 'CERT-HIS',
      [CertificateType.DIPLOMA]: 'CERT-DIP',
    };
    return prefixes[certificateType];
  }

  async findAll(query?: CertificateQueryDto): Promise<Certificate[]> {
    const where: Record<string, unknown> = {};

    if (query?.certificateType) where.certificateType = query.certificateType;
    if (query?.studentId) where.studentId = query.studentId;
    if (query?.verificationCode)
      where.verificationCode = query.verificationCode;
    if (query?.status) where.status = query.status;

    return this.repository.find({
      where,
      relations: [
        'student',
        'student.person',
        'student.career',
        'enrollment',
        'issuedBy',
      ],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Certificate> {
    const certificate = await this.repository.findOne({
      where: { id },
      relations: [
        'student',
        'student.person',
        'student.career',
        'enrollment',
        'enrollment.academicPeriod',
        'issuedBy',
      ],
    });
    if (!certificate) {
      throw new NotFoundException('Certificado no encontrado');
    }
    return certificate;
  }

  async findByStudent(studentId: string): Promise<Certificate[]> {
    return this.repository.find({
      where: { studentId },
      relations: ['student', 'student.person', 'issuedBy'],
      order: { createdAt: 'DESC' },
    });
  }

  async verify(
    verificationCode: string,
  ): Promise<VerifyCertificateResponseDto> {
    const certificate = await this.repository.findOne({
      where: { verificationCode },
      relations: ['student', 'student.person', 'issuedBy'],
    });

    if (!certificate) {
      return {
        isValid: false,
        message: 'Certificado no encontrado',
      };
    }

    if (certificate.status === CertificateStatus.REVOKED) {
      return {
        isValid: false,
        certificate: {
          documentNumber: certificate.documentNumber,
          certificateType: certificate.certificateType,
          student: {
            firstName: certificate.student.person?.firstName || '',
            lastName: certificate.student.person?.lastName || '',
            studentCode: certificate.student.studentCode,
          },
          issuedAt: certificate.issuedAt,
          issuedBy: `${certificate.issuedBy?.fullName || 'Sistema'}`,
          status: certificate.status,
        },
        message: `Certificado REVOCADO${certificate.revokedReason ? `: ${certificate.revokedReason}` : ''}`,
      };
    }

    if (
      certificate.validUntil &&
      new Date(certificate.validUntil) < new Date()
    ) {
      return {
        isValid: false,
        certificate: {
          documentNumber: certificate.documentNumber,
          certificateType: certificate.certificateType,
          student: {
            firstName: certificate.student.person?.firstName || '',
            lastName: certificate.student.person?.lastName || '',
            studentCode: certificate.student.studentCode,
          },
          issuedAt: certificate.issuedAt,
          issuedBy: `${certificate.issuedBy?.fullName || 'Sistema'}`,
          status: CertificateStatus.EXPIRED,
        },
        message: 'Certificado EXPIRADO',
      };
    }

    return {
      isValid: true,
      certificate: {
        documentNumber: certificate.documentNumber,
        certificateType: certificate.certificateType,
        student: {
          firstName: certificate.student.person?.firstName || '',
          lastName: certificate.student.person?.lastName || '',
          studentCode: certificate.student.studentCode,
        },
        issuedAt: certificate.issuedAt,
        issuedBy: `${certificate.issuedBy?.fullName || 'Sistema'}`,
        status: certificate.status,
      },
      message: 'Certificado VÁLIDO',
    };
  }

  async revoke(
    id: string,
    dto: RevokeCertificateDto,
    revokedById: string,
  ): Promise<Certificate> {
    const certificate = await this.findOne(id);

    if (certificate.status === CertificateStatus.REVOKED) {
      throw new BadRequestException('El certificado ya está revocado');
    }

    certificate.status = CertificateStatus.REVOKED;
    certificate.revokedAt = new Date();
    certificate.revokedReason = dto.reason;
    certificate.revokedById = revokedById;

    return this.repository.save(certificate);
  }

  async updatePdfUrl(id: string, pdfUrl: string): Promise<Certificate> {
    const certificate = await this.findOne(id);
    certificate.pdfUrl = pdfUrl;
    return this.repository.save(certificate);
  }

  async remove(id: string): Promise<void> {
    const certificate = await this.findOne(id);
    await this.repository.remove(certificate);
  }
}
