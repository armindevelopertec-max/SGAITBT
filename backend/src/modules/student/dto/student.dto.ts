import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { AcademicStatus } from '@common/enums';

export class CreateStudentDto {
  @IsNotEmpty()
  @IsUUID()
  personId: string;

  @IsOptional()
  @IsString()
  diplomaNumber?: string;

  @IsOptional()
  @IsEnum(AcademicStatus)
  status?: AcademicStatus;

  @IsOptional()
  @IsInt()
  currentLevel?: number;

  @IsOptional()
  @IsUUID()
  careerId?: string;
}

export class UpdateStudentDto {
  @IsOptional()
  @IsString()
  diplomaNumber?: string;

  @IsOptional()
  @IsEnum(AcademicStatus)
  status?: AcademicStatus;

  @IsOptional()
  @IsInt()
  currentLevel?: number;

  @IsOptional()
  @IsUUID()
  careerId?: string;
}

export class StudentQueryDto {
  @IsOptional()
  @IsEnum(AcademicStatus)
  status?: AcademicStatus;

  @IsOptional()
  careerId?: string;

  @IsOptional()
  search?: string;
}
