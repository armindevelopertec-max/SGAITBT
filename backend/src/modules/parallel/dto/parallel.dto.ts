import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ShiftType } from '@common/enums';

export class CreateParallelDto {
  @IsNotEmpty()
  academicPeriodId: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(10)
  code: string;

  @IsEnum(ShiftType)
  shift: ShiftType;
}

export class UpdateParallelDto {
  @IsOptional()
  @IsString()
  @MaxLength(10)
  code?: string;

  @IsOptional()
  @IsEnum(ShiftType)
  shift?: ShiftType;
}
