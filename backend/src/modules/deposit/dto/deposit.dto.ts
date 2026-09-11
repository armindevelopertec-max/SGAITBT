import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { DepositStatus } from '@common/enums';

export class CreateDepositDto {
  @IsNotEmpty()
  studentId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  depositNumber: string;

  @IsDateString()
  depositDate: string;

  @IsNumber()
  amount: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  concept: string;

  @IsOptional()
  @IsString()
  voucherUrl?: string;
}

export class UpdateDepositDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  depositNumber?: string;

  @IsOptional()
  @IsDateString()
  depositDate?: string;

  @IsOptional()
  @IsNumber()
  amount?: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  concept?: string;

  @IsOptional()
  @IsString()
  voucherUrl?: string;
}

export class VerifyDepositDto {
  @IsEnum(DepositStatus)
  status: DepositStatus;

  @IsOptional()
  @IsString()
  verificationComment?: string;
}

export class DepositQueryDto {
  @IsOptional()
  @IsEnum(DepositStatus)
  status?: DepositStatus;

  @IsOptional()
  studentId?: string;
}