import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsInt,
  IsBoolean,
} from 'class-validator';
import { EmployeeType } from '@common/enums';

export class CreateEmployeeHistoryDto {
  @IsNotEmpty()
  @IsUUID()
  employeeId: string;

  @IsOptional()
  @IsUUID()
  careerId?: string;

  @IsNotEmpty()
  @IsUUID()
  academicPeriodId: string;

  @IsNotEmpty()
  @IsEnum(EmployeeType)
  employeeType: EmployeeType;

  @IsOptional()
  @IsString()
  position?: string;

  @IsOptional()
  @IsInt()
  subjectsTaught?: number;

  @IsOptional()
  @IsInt()
  parallelsTaught?: number;

  @IsOptional()
  @IsInt()
  totalHours?: number;

  @IsOptional()
  @IsString()
  observations?: string;
}

export class UpdateEmployeeHistoryDto {
  @IsOptional()
  @IsEnum(EmployeeType)
  employeeType?: EmployeeType;

  @IsOptional()
  @IsString()
  position?: string;

  @IsOptional()
  @IsInt()
  subjectsTaught?: number;

  @IsOptional()
  @IsInt()
  parallelsTaught?: number;

  @IsOptional()
  @IsInt()
  totalHours?: number;

  @IsOptional()
  @IsString()
  observations?: string;
}

export class EmployeeHistoryQueryDto {
  @IsOptional()
  @IsUUID()
  employeeId?: string;

  @IsOptional()
  @IsUUID()
  careerId?: string;

  @IsOptional()
  @IsUUID()
  academicPeriodId?: string;

  @IsOptional()
  @IsEnum(EmployeeType)
  employeeType?: EmployeeType;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
