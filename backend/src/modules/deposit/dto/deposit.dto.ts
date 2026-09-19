import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { DepositConcept, DepositStatus } from '@common/enums';

export class CreateDepositDto {
  @IsOptional()
  @IsUUID()
  studentId?: string;

  @IsOptional()
  @IsUUID()
  personId?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  depositNumber: string;

  @IsDateString()
  depositDate: string;

  @IsNumber()
  amount: number;

  @IsEnum(DepositConcept)
  concept: DepositConcept;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  conceptDetail?: string;

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
  @IsEnum(DepositConcept)
  concept?: DepositConcept;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  conceptDetail?: string;

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

export class ConvertDepositDto {
  @IsNotEmpty()
  @IsUUID()
  studentId: string;
}

export class DepositQueryDto {
  @IsOptional()
  @IsEnum(DepositStatus)
  status?: DepositStatus;

  @IsOptional()
  studentId?: string;

  @IsOptional()
  personId?: string;

  @IsOptional()
  @IsEnum(DepositConcept)
  concept?: DepositConcept;
}
