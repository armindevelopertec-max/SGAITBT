import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AttendanceStatus } from '@common/enums';

export class AttendanceRecordDto {
  @IsNotEmpty()
  studentId: string;

  @IsEnum(AttendanceStatus)
  status: AttendanceStatus;

  @IsOptional()
  @IsString()
  observations?: string;
}

export class CreateAttendanceDto {
  @IsNotEmpty()
  assignmentId: string;

  @IsDateString()
  attendanceDate: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttendanceRecordDto)
  records: AttendanceRecordDto[];
}

export class UpdateAttendanceDto {
  @IsEnum(AttendanceStatus)
  status: AttendanceStatus;

  @IsOptional()
  @IsString()
  observations?: string;
}

export class AttendanceSummaryDto {
  assignmentId: string;

  @IsOptional()
  studentId?: string;
}

export class AttendanceQueryDto {
  @IsOptional()
  assignmentId?: string;

  @IsOptional()
  studentId?: string;

  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @IsOptional()
  @IsDateString()
  toDate?: string;
}