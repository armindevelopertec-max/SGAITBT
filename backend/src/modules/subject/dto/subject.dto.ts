import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateSubjectDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  code: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @IsInt()
  @Min(1)
  semester: number;

  @IsInt()
  @Min(0)
  weeklyHours: number;

  @IsInt()
  @Min(0)
  totalHours: number;

  @IsOptional()
  @IsArray()
  prerequisites?: string[];

  @IsOptional()
  @IsBoolean()
  isElective?: boolean;

  @IsNotEmpty()
  careerId: string;
}

export class UpdateSubjectDto {
  @IsOptional()
  @IsString()
  @MaxLength(30)
  code?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  semester?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  weeklyHours?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  totalHours?: number;

  @IsOptional()
  @IsArray()
  prerequisites?: string[];

  @IsOptional()
  @IsBoolean()
  isElective?: boolean;
}