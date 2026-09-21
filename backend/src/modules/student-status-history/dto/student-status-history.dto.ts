import {
  IsOptional,
  IsUUID,
  IsString,
  IsEnum,
  IsInt,
} from 'class-validator';
import { AcademicStatus } from '@common/enums';

export class StudentStatusHistoryQueryDto {
  @IsOptional()
  @IsUUID()
  studentId?: string;

  @IsOptional()
  @IsUUID()
  academicPeriodId?: string;

  @IsOptional()
  @IsUUID()
  changedById?: string;

  @IsOptional()
  @IsEnum(AcademicStatus)
  status?: AcademicStatus;
}

export class CreateStudentStatusHistoryDto {
  @IsOptional()
  @IsEnum(AcademicStatus)
  previousStatus?: AcademicStatus | null;

  @IsOptional()
  @IsEnum(AcademicStatus)
  newStatus?: AcademicStatus | null;

  @IsOptional()
  @IsUUID()
  previousCareerId?: string;

  @IsOptional()
  @IsUUID()
  newCareerId?: string;

  @IsOptional()
  @IsInt()
  previousLevel?: number | null;

  @IsOptional()
  @IsInt()
  newLevel?: number | null;

  @IsOptional()
  @IsUUID()
  academicPeriodId?: string;

  @IsOptional()
  @IsString()
  changeReason?: string;

  @IsOptional()
  @IsString()
  clientIp?: string;
}
