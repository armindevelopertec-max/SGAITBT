import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { CareerState } from '@common/enums';

export class CreateCareerDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  code: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsInt()
  @Min(1)
  durationYears: number;

  @IsInt()
  @Min(1)
  numberOfLevels: number;

  @IsOptional()
  @IsEnum(CareerState)
  state?: CareerState;

  @IsOptional()
  studyPlan?: Record<string, unknown>;
}

export class UpdateCareerDto extends CreateCareerDto {}

export class CareerQueryDto {
  @IsOptional()
  @IsEnum(CareerState)
  state?: CareerState;
}