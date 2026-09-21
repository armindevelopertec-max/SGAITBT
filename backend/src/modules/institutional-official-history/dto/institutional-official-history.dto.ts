import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsBoolean,
} from 'class-validator';
import { OfficialType } from '@common/enums';

export class CreateInstitutionalOfficialHistoryDto {
  @IsNotEmpty()
  @IsEnum(OfficialType)
  officialType: OfficialType;

  @IsOptional()
  @IsUUID()
  personId?: string;

  @IsOptional()
  @IsUUID()
  employeeId?: string;

  @IsOptional()
  @IsUUID()
  careerId?: string;

  @IsNotEmpty()
  @IsString()
  fullName: string;

  @IsNotEmpty()
  @IsDateString()
  startDate: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsNotEmpty()
  @IsString()
  startGestion: string;

  @IsOptional()
  @IsString()
  endGestion?: string;

  @IsOptional()
  @IsString()
  observations?: string;

  @IsOptional()
  @IsBoolean()
  isVacant?: boolean;
}

export class UpdateInstitutionalOfficialHistoryDto {
  @IsOptional()
  @IsEnum(OfficialType)
  officialType?: OfficialType;

  @IsOptional()
  @IsUUID()
  personId?: string;

  @IsOptional()
  @IsUUID()
  employeeId?: string;

  @IsOptional()
  @IsUUID()
  careerId?: string;

  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  startGestion?: string;

  @IsOptional()
  @IsString()
  endGestion?: string;

  @IsOptional()
  @IsString()
  observations?: string;

  @IsOptional()
  @IsBoolean()
  isVacant?: boolean;
}

export class InstitutionalOfficialHistoryQueryDto {
  @IsOptional()
  @IsEnum(OfficialType)
  officialType?: OfficialType;

  @IsOptional()
  @IsUUID()
  careerId?: string;

  @IsOptional()
  @IsString()
  startGestion?: string;

  @IsOptional()
  @IsString()
  endGestion?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
