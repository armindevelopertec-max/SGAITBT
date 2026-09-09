import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateInstitutionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  slug: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phoneSecondary?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  rectorName?: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;
}

export class UpdateInstitutionDto extends CreateInstitutionDto {}

export class UpdateInstitutionConfigDto {
  @IsOptional()
  academicRegulation?: string;

  @IsOptional()
  documentConfig?: Record<string, unknown>;
}