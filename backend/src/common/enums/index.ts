export enum UserRole {
  ADMIN = 'ADMIN',
  SECRETARY = 'SECRETARY',
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT',
}

export enum AcademicStatus {
  PRE_ENROLLED = 'PRE_ENROLLED',
  ACTIVE = 'ACTIVE',
  WITHDRAWN = 'WITHDRAWN',
  GRADUATE = 'GRADUATE',
  TITLED = 'TITLED',
  INACTIVE = 'INACTIVE',
}

export enum DepositStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  OBSERVED = 'OBSERVED',
}

export enum EnrollmentStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  CANCELLED = 'CANCELLED',
}

export enum PeriodStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
}

export enum AttendanceStatus {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  LATE = 'LATE',
  JUSTIFIED = 'JUSTIFIED',
}

export enum GradeStatus {
  APPROVED = 'APPROVED',
  FAILED = 'FAILED',
  PENDING = 'PENDING',
}

export enum StudyConclusionStatus {
  COMPLETED = 'COMPLETED',
  IN_PROGRESS = 'IN_PROGRESS',
  GRADUATE = 'GRADUATE',
}

export enum CareerState {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum Sex {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  BLOCKED = 'BLOCKED',
}

export enum EmployeeType {
  DIRECTIVO = 'DIRECTIVO',
  DOCENTE = 'DOCENTE',
  ADMINISTRATIVO = 'ADMINISTRATIVO',
  APOYO = 'APOYO',
}

export enum PersonStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum PermissionAction {
  ALL = 'ALL',
  VIEW = 'VIEW',
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  OTHER = 'OTHER',
}