import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { AcademicStatus, Sex, UserRole } from '@common/enums';

export class CreateStudentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  firstName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  lastName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  ci: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  ciExtension?: string;

  @IsDateString()
  birthDate: Date;

  @IsOptional()
  @IsEnum(Sex)
  sex?: Sex;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsOptional()
  @IsString()
  photoUrl?: string;

  @IsOptional()
  @IsEnum(AcademicStatus)
  status?: AcademicStatus;

  @IsOptional()
  @IsInt()
  currentLevel?: number;

  @IsOptional()
  careerId?: string;
}

export class UpdateStudentDto {
  @IsOptional()
  @IsString()
  @MaxLength(150)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  lastName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  ci?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  ciExtension?: string;

  @IsOptional()
  @IsDateString()
  birthDate?: Date;

  @IsOptional()
  @IsEnum(Sex)
  sex?: Sex;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  photoUrl?: string;

  @IsOptional()
  @IsEnum(AcademicStatus)
  status?: AcademicStatus;

  @IsOptional()
  @IsInt()
  currentLevel?: number;

  @IsOptional()
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

export class CreateStudentUserDto {
  @IsOptional()
  role?: UserRole = UserRole.STUDENT;
}