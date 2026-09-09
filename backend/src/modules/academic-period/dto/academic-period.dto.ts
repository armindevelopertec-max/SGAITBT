import { IsDateString, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { PeriodStatus } from '@common/enums';

export class CreateAcademicPeriodDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(4)
  year: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  periodName: string;

  @IsInt()
  semester: number;

  @IsDateString()
  startDate: Date;

  @IsDateString()
  endDate: Date;

  @IsOptional()
  @IsEnum(PeriodStatus)
  status?: PeriodStatus;

  @IsNotEmpty()
  careerId: string;
}

export class UpdateAcademicPeriodDto {
  @IsOptional()
  @IsString()
  @MaxLength(4)
  year?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  periodName?: string;

  @IsOptional()
  @IsInt()
  semester?: number;

  @IsOptional()
  @IsDateString()
  startDate?: Date;

  @IsOptional()
  @IsDateString()
  endDate?: Date;

  @IsOptional()
  @IsEnum(PeriodStatus)
  status?: PeriodStatus;
}

export class AcademicPeriodQueryDto {
  @IsOptional()
  @IsEnum(PeriodStatus)
  status?: PeriodStatus;

  @IsOptional()
  careerId?: string;

  @IsOptional()
  year?: string;
}