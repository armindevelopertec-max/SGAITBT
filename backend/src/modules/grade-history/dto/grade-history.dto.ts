import {
  IsOptional,
  IsUUID,
  IsString,
  IsEnum,
  IsNumber,
} from 'class-validator';
import { GradeStatus } from '@common/enums';

export class GradeHistoryQueryDto {
  @IsOptional()
  @IsUUID()
  gradeId?: string;

  @IsOptional()
  @IsUUID()
  studentId?: string;

  @IsOptional()
  @IsUUID()
  changedById?: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;
}

export class CreateGradeHistoryDto {
  @IsOptional()
  @IsNumber()
  previousFirstPartial?: number | null;

  @IsOptional()
  @IsNumber()
  previousSecondPartial?: number | null;

  @IsOptional()
  @IsNumber()
  previousPractices?: number | null;

  @IsOptional()
  @IsNumber()
  previousFinalExam?: number | null;

  @IsOptional()
  @IsNumber()
  previousFinalGrade?: number | null;

  @IsOptional()
  @IsEnum(GradeStatus)
  previousStatus?: GradeStatus | null;

  @IsOptional()
  @IsNumber()
  newFirstPartial?: number | null;

  @IsOptional()
  @IsNumber()
  newSecondPartial?: number | null;

  @IsOptional()
  @IsNumber()
  newPractices?: number | null;

  @IsOptional()
  @IsNumber()
  newFinalExam?: number | null;

  @IsOptional()
  @IsNumber()
  newFinalGrade?: number | null;

  @IsOptional()
  @IsEnum(GradeStatus)
  newStatus?: GradeStatus | null;

  @IsOptional()
  @IsString()
  changeReason?: string;

  @IsOptional()
  @IsString()
  clientIp?: string;
}
