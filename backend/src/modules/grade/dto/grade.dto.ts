import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class GradeInputDto {
  @IsNotEmpty()
  studentId: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  firstPartial?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  secondPartial?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  practices?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  finalExam?: number;
}

export class CreateGradeDto {
  @IsNotEmpty()
  assignmentId: string;

  @IsNotEmpty()
  studentId: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  firstPartial?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  secondPartial?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  practices?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  finalExam?: number;
}

export class CreateBulkGradesDto {
  @IsNotEmpty()
  assignmentId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GradeInputDto)
  grades: GradeInputDto[];
}

export class UpdateGradeDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  firstPartial?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  secondPartial?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  practices?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  finalExam?: number;
}

export class GradeQueryDto {
  @IsOptional()
  assignmentId?: string;

  @IsOptional()
  studentId?: string;

  @IsOptional()
  academicPeriodId?: string;
}