import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { AcademicStatus, EnrollmentStatus, EnrollmentType } from '@common/enums';

export class CreateEnrollmentDto {
  @IsNotEmpty()
  studentId: string;

  @IsNotEmpty()
  careerId: string;

  @IsNotEmpty()
  academicPeriodId: string;

  @IsDateString()
  enrollmentDate: string;

  @IsOptional()
  @IsNumber()
  totalAmount?: number;

  @IsOptional()
  @IsString()
  observations?: string;

  @IsOptional()
  @IsEnum(EnrollmentType)
  enrollmentType?: EnrollmentType;

  @IsOptional()
  @IsEnum(AcademicStatus)
  studentStatus?: AcademicStatus;
}

export class UpdateEnrollmentDto {
  @IsOptional()
  @IsEnum(EnrollmentStatus)
  status?: EnrollmentStatus;

  @IsOptional()
  @IsString()
  observations?: string;

  @IsOptional()
  @IsNumber()
  totalAmount?: number;

  @IsOptional()
  @IsEnum(EnrollmentType)
  enrollmentType?: EnrollmentType;

  @IsOptional()
  @IsEnum(AcademicStatus)
  studentStatus?: AcademicStatus;
}

export class EnrollStudentDto {
  @IsNotEmpty()
  studentId: string;

  @IsNotEmpty()
  academicPeriodId: string;

  @IsOptional()
  @IsInt()
  semester?: number;
}

export class EnrollmentQueryDto {
  @IsOptional()
  @IsEnum(EnrollmentStatus)
  status?: EnrollmentStatus;

  @IsOptional()
  studentId?: string;

  @IsOptional()
  academicPeriodId?: string;

  @IsOptional()
  careerId?: string;

  @IsOptional()
  @IsEnum(EnrollmentType)
  enrollmentType?: EnrollmentType;
}