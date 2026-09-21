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

export enum DepositConcept {
  MATRICULA = 'MATRICULA',
  EXAMEN = 'EXAMEN',
  CERTIFICADO = 'CERTIFICADO',
  OTROS = 'OTROS',
}

export enum EnrollmentStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  CANCELLED = 'CANCELLED',
}

export enum EnrollmentType {
  REGULAR = 'REGULAR',
  COMPLEMENTARIA = 'COMPLEMENTARIA',
  EXTRAORDINARIA = 'EXTRAORDINARIA',
}

export enum PeriodStatus {
  PLANNED = 'PLANNED',
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
}

export enum CalendarEventCategory {
  PERIODO = 'PERIODO',
  MATRICULA = 'MATRICULA',
  ACTIVIDAD = 'ACTIVIDAD',
  EVALUACION = 'EVALUACION',
  RECESO = 'RECESO',
  CIERRE = 'CIERRE',
  OTHER = 'OTHER',
}

export enum CalendarEventStatus {
  ACTIVE = 'ACTIVE',
  CANCELLED = 'CANCELLED',
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

export enum ShiftType {
  MANANA = 'MANANA',
  TARDE = 'TARDE',
  NOCHE = 'NOCHE',
}

export enum OfficialType {
  RECTOR = 'RECTOR',
  VICE_RECTOR = 'VICE_RECTOR',
  SECRETARY = 'SECRETARY',
  ACCOUNTANT = 'ACCOUNTANT',
  CAREER_DIRECTOR = 'CAREER_DIRECTOR',
  VOCATIONAL_DIRECTOR = 'VOCATIONAL_DIRECTOR',
  ACADEMIC_DIRECTOR = 'ACADEMIC_DIRECTOR',
}

export enum CertificateType {
  NOTES = 'NOTES',
  STUDIES = 'STUDIES',
  REGULAR = 'REGULAR',
  ENROLLMENT = 'ENROLLMENT',
  HISTORY = 'HISTORY',
  DIPLOMA = 'DIPLOMA',
}

export enum CertificateStatus {
  ACTIVE = 'ACTIVE',
  REVOKED = 'REVOKED',
  EXPIRED = 'EXPIRED',
}