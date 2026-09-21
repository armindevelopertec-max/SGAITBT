import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsDateString,
  IsObject,
} from 'class-validator';
import { CertificateType, CertificateStatus } from '@common/enums';

export class CreateCertificateDto {
  @IsNotEmpty()
  @IsEnum(CertificateType)
  certificateType: CertificateType;

  @IsNotEmpty()
  @IsUUID()
  studentId: string;

  @IsOptional()
  @IsUUID()
  enrollmentId?: string;

  @IsOptional()
  @IsDateString()
  validUntil?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class RevokeCertificateDto {
  @IsNotEmpty()
  @IsString()
  reason: string;
}

export class CertificateQueryDto {
  @IsOptional()
  @IsEnum(CertificateType)
  certificateType?: CertificateType;

  @IsOptional()
  @IsUUID()
  studentId?: string;

  @IsOptional()
  @IsString()
  verificationCode?: string;

  @IsOptional()
  @IsString()
  status?: string;
}

export class VerifyCertificateResponseDto {
  isValid: boolean;
  certificate?: {
    documentNumber: string;
    certificateType: CertificateType;
    student: {
      firstName: string;
      lastName: string;
      studentCode: string;
    };
    issuedAt: Date;
    issuedBy: string;
    status: CertificateStatus;
  };
  message: string;
}
