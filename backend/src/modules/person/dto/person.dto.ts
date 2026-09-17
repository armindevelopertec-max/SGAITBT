import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { PersonStatus, Sex } from '@common/enums';

export class CreatePersonDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  ci: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  ciExtension?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  firstName: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  paternalSurname?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  maternalSurname?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  lastName: string;

  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @IsOptional()
  @IsEnum(Sex)
  sex?: Sex;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsEmail()
  @IsNotEmpty()
  @MaxLength(150)
  email: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsEnum(PersonStatus)
  status?: PersonStatus;
}

export class UpdatePersonDto {
  @IsOptional()
  @IsString()
  @MaxLength(30)
  ci?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  ciExtension?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  paternalSurname?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  maternalSurname?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  lastName?: string;

  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @IsOptional()
  @IsEnum(Sex)
  sex?: Sex;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(150)
  email?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsEnum(PersonStatus)
  status?: PersonStatus;
}

export class PersonQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(PersonStatus)
  status?: PersonStatus;
}