import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateSubjectAssignmentDto {
  @IsNotEmpty()
  subjectId: string;

  @IsNotEmpty()
  academicPeriodId: string;

  @IsOptional()
  teacherId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  parallel?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  classroom?: string;

  @IsOptional()
  @IsObject()
  schedule?: Record<string, unknown>;

  @IsOptional()
  @IsInt()
  semester?: number;
}

export class UpdateSubjectAssignmentDto {
  @IsOptional()
  teacherId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  parallel?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  classroom?: string;

  @IsOptional()
  @IsObject()
  schedule?: Record<string, unknown>;
}

export class AutoAssignStudentsDto {
  @IsNotEmpty()
  academicPeriodId: string;

  @IsNotEmpty()
  subjectId: string;

  @IsOptional()
  @IsArray()
  studentIds?: string[];

  @IsOptional()
  @IsString()
  parallel?: string;
}

export class EnrollStudentInAssignmentDto {
  @IsNotEmpty()
  studentId: string;

  @IsOptional()
  @IsString()
  assignmentId?: string;

  @IsOptional()
  @IsInt()
  semester?: number;
}

export class AssignmentQueryDto {
  @IsOptional()
  subjectId?: string;

  @IsOptional()
  academicPeriodId?: string;

  @IsOptional()
  teacherId?: string;

  @IsOptional()
  parallel?: string;
}