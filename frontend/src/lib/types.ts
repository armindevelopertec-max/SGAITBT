export type UserRole = 'ADMIN' | 'SECRETARY' | 'TEACHER' | 'STUDENT';
export type AcademicStatus = 'PRE_ENROLLED' | 'ACTIVE' | 'WITHDRAWN' | 'GRADUATE' | 'TITLED' | 'INACTIVE';
export type DepositStatus = 'PENDING' | 'VERIFIED' | 'APPROVED' | 'REJECTED' | 'OBSERVED';
export type EnrollmentStatus = 'ACTIVE' | 'INACTIVE' | 'CANCELLED';
export type PeriodStatus = 'OPEN' | 'CLOSED';
export type GradeStatus = 'APPROVED' | 'FAILED' | 'PENDING';
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'JUSTIFIED';
export type Sex = 'MALE' | 'FEMALE';
export type PersonStatus = 'ACTIVE' | 'INACTIVE';
export type EmployeeType = 'DIRECTIVO' | 'DOCENTE' | 'ADMINISTRATIVO' | 'APOYO';

export interface Institution {
  id: string;
  name: string;
  slug: string;
  code: string;
  description?: string;
  address?: string;
  phone?: string;
  phoneSecondary?: string;
  email?: string;
  rectorName?: string;
  logoUrl?: string;
  academicRegulation?: string;
  documentConfig?: Record<string, unknown>;
}

export interface Career {
  id: string;
  name: string;
  code: string;
  description?: string;
  durationYears: number;
  numberOfLevels: number;
  state: 'ACTIVE' | 'INACTIVE';
  institutionId?: string;
  studyPlan?: Record<string, unknown>;
  subjects?: Subject[];
}

export interface AcademicPeriod {
  id: string;
  year: string;
  periodName: string;
  sequence: number;
  startDate: string;
  endDate: string;
  status: PeriodStatus;
  careerId: string;
  career?: Career;
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  semester: number;
  weeklyHours: number;
  totalHours: number;
  prerequisites?: string[];
  isElective: boolean;
  careerId: string;
  career?: Career;
}

export interface Student {
  id: string;
  firstName: string;
  paternalSurname?: string;
  maternalSurname?: string;
  lastName: string;
  diplomaNumber?: string;
  ci: string;
  ciExtension?: string;
  birthDate: string;
  sex?: 'MALE' | 'FEMALE';
  phone?: string;
  address?: string;
  email: string;
  photoUrl?: string;
  studentCode: string;
  status: AcademicStatus;
  currentLevel: number;
  careerId?: string;
  career?: Career;
  currentPeriodId?: string;
  currentPeriod?: AcademicPeriod;
  createdAt: string;
}

export interface Deposit {
  id: string;
  depositNumber: string;
  depositDate: string;
  amount: number;
  concept: string;
  voucherUrl?: string;
  status: DepositStatus;
  verificationComment?: string;
  verificationDate?: string;
  verifiedBy?: string;
  studentId: string;
  student?: Student;
}

export interface Enrollment {
  id: string;
  enrollmentNumber: string;
  enrollmentDate: string;
  status: EnrollmentStatus;
  semester: number;
  totalAmount?: number;
  observations?: string;
  studentId: string;
  student?: Student;
  careerId: string;
  career?: Career;
  academicPeriodId: string;
  academicPeriod?: AcademicPeriod;
}

export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: UserRole;
  status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
  studentId?: string;
  student?: Student;
  roles?: string[];
  userRoles?: { role?: { name: string } }[];
}

export interface SubjectAssignment {
  id: string;
  parallel: string;
  classroom?: string;
  schedule?: Record<string, unknown>;
  subjectId: string;
  subject?: Subject;
  employeeId?: string;
  employee?: Employee;
  academicPeriodId: string;
  academicPeriod?: AcademicPeriod;
  semester: number;
  enrollments?: SubjectEnrollment[];
}

export interface SubjectEnrollment {
  id: string;
  studentId: string;
  student?: Student;
  assignmentId: string;
}

export interface Attendance {
  id: string;
  attendanceDate: string;
  status: AttendanceStatus;
  observations?: string;
  studentId: string;
  student?: Student;
  assignmentId: string;
}

export interface Grade {
  id: string;
  firstPartial?: number;
  secondPartial?: number;
  practices?: number;
  finalExam?: number;
  finalGrade?: number;
  status: GradeStatus;
  studentId: string;
  student?: Student;
  assignmentId: string;
  assignment?: SubjectAssignment;
}

export interface AcademicHistoryRecord {
  id: string;
  studentId: string;
  careerId: string;
  career?: Career;
  academicPeriodId: string;
  academicPeriod?: AcademicPeriod;
  subjectId: string;
  subject?: Subject;
  semester: number;
  finalGrade?: number | null;
  status: GradeStatus;
}

export interface DashboardSummary {
  totalStudents: number;
  activeStudents: number;
  newStudents: number;
  teachers: number;
  activeSubjects: number;
  careers: number;
  enrollmentsThisYear: number;
  pendingDeposits: number;
  approved: number;
  failed: number;
  graduates: number;
}

export interface AdminDashboard {
  summary: DashboardSummary;
  studentsByCareer: Array<{ careerName: string; total: string }>;
  studentsByStatus: Array<{ status: string; total: string }>;
  recentStudents: Student[];
}

export interface Person {
  id: string;
  ci: string;
  ciExtension?: string;
  firstName: string;
  paternalSurname?: string;
  maternalSurname?: string;
  lastName: string;
  birthDate?: string;
  sex?: Sex;
  phone?: string;
  email: string;
  address?: string;
  photoUrl?: string;
  status: PersonStatus;
  isActive: boolean;
  user?: User;
  student?: Student;
  employees?: Employee[];
}

export interface Employee {
  id: string;
  employeeCode: string;
  hireDate?: string;
  employeeType: EmployeeType;
  position?: string;
  personId: string;
  isActive: boolean;
  persona?: Person;
}

export interface PermissionInfo {
  id: string;
  key: string;
  module?: string;
  action: string;
  description?: string;
}

export interface RoleItem {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  parentName?: string | null;
  isSystem: boolean;
  isActive: boolean;
  permissions: string[];
}

export interface AuditLog {
  id: string;
  createdAt: string;
  userId?: string;
  username?: string;
  action: string;
  module: string;
  entityType?: string;
  entityId?: string;
  previousValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
  ip?: string;
  description?: string;
}