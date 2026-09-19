import { IsDateString, IsEnum, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { PeriodStatus } from '@common/enums';

export class CreateAcademicPeriodDto {
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
  @Min(1)
  sequence?: number;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsEnum(PeriodStatus)
  status?: PeriodStatus;
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
  @Min(1)
  sequence?: number;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsEnum(PeriodStatus)
  status?: PeriodStatus;
}

export class AcademicPeriodQueryDto {
  @IsOptional()
  @IsEnum(PeriodStatus)
  status?: PeriodStatus;

  @IsOptional()
  year?: string;
}