import {
  IsOptional,
  IsUUID,
  IsString,
} from 'class-validator';

export class PersonHistoryQueryDto {
  @IsOptional()
  @IsUUID()
  personId?: string;

  @IsOptional()
  @IsString()
  fieldChanged?: string;

  @IsOptional()
  @IsUUID()
  changedById?: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;
}

export class CreatePersonHistoryDto {
  @IsString()
  fieldChanged: string;

  @IsOptional()
  @IsString()
  previousValue?: string | null;

  @IsOptional()
  @IsString()
  newValue?: string | null;

  @IsOptional()
  @IsString()
  clientIp?: string;
}

export const PERSON_TRACKED_FIELDS = [
  'firstName',
  'lastName',
  'paternalSurname',
  'maternalSurname',
  'ci',
  'ciExtension',
  'phone',
  'email',
  'address',
  'photoUrl',
] as const;

export type PersonTrackedField = (typeof PERSON_TRACKED_FIELDS)[number];
