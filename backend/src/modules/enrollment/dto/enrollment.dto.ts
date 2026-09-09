import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { EnrollmentStatus } from '@common/enums';

export class CreateEnrollmentDto {
  @IsNotEmpty()
  studentId: string;

  @IsNotEmpty()
  careerId: string;

  @IsNotEmpty()
  academicPeriodId: string;

  @IsDateString()
  enrollmentDate: Date;

  @IsInt()
  semester: number;

  @IsOptional()
  @IsNumber()
  totalAmount?: number;

  @IsOptional()
  @IsString()
  observations?: string;
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
}