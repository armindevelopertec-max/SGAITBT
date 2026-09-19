export const PERMISSIONS = {
  DASHBOARD_VIEW: 'dashboard.view',
  STUDENTS_VIEW: 'students.view',
  STUDENTS_CREATE: 'students.create',
  STUDENTS_UPDATE: 'students.update',
  STUDENTS_DELETE: 'students.delete',
  CAREERS_VIEW: 'careers.view',
  CAREERS_CREATE: 'careers.create',
  CAREERS_UPDATE: 'careers.update',
  CAREERS_DELETE: 'careers.delete',
  SUBJECTS_VIEW: 'subjects.view',
  SUBJECTS_CREATE: 'subjects.create',
  SUBJECTS_UPDATE: 'subjects.update',
  SUBJECTS_DELETE: 'subjects.delete',
  PERIODS_VIEW: 'periods.view',
  PERIODS_CREATE: 'periods.create',
  PERIODS_UPDATE: 'periods.update',
  PERIODS_DELETE: 'periods.delete',
  PARALLELS_VIEW: 'parallels.view',
  PARALLELS_CREATE: 'parallels.create',
  PARALLELS_UPDATE: 'parallels.update',
  PARALLELS_DELETE: 'parallels.delete',
  CALENDAR_VIEW: 'calendar.view',
  CALENDAR_CREATE: 'calendar.create',
  CALENDAR_UPDATE: 'calendar.update',
  CALENDAR_DELETE: 'calendar.delete',
  ENROLLMENTS_VIEW: 'enrollments.view',
  ENROLLMENTS_CREATE: 'enrollments.create',
  ENROLLMENTS_UPDATE: 'enrollments.update',
  ENROLLMENTS_DELETE: 'enrollments.delete',
  DEPOSITS_VIEW: 'deposits.view',
  DEPOSITS_CREATE: 'deposits.create',
  DEPOSITS_UPDATE: 'deposits.update',
  DEPOSITS_DELETE: 'deposits.delete',
  USERS_VIEW: 'users.view',
  USERS_CREATE: 'users.create',
  USERS_UPDATE: 'users.update',
  USERS_DELETE: 'users.delete',
  ASSIGNMENTS_VIEW: 'assignments.view',
  ASSIGNMENTS_CREATE: 'assignments.create',
  ASSIGNMENTS_UPDATE: 'assignments.update',
  ASSIGNMENTS_DELETE: 'assignments.delete',
  ATTENDANCE_VIEW: 'attendance.view',
  ATTENDANCE_CREATE: 'attendance.create',
  ATTENDANCE_UPDATE: 'attendance.update',
  ATTENDANCE_DELETE: 'attendance.delete',
  GRADES_VIEW: 'grades.view',
  GRADES_CREATE: 'grades.create',
  GRADES_UPDATE: 'grades.update',
  GRADES_DELETE: 'grades.delete',
  GRADES_VERIFY: 'grades.verify',
  HISTORY_VIEW: 'history.view',
  REPORTS_VIEW: 'reports.view',
  INSTITUTION_VIEW: 'institution.view',
  INSTITUTION_UPDATE: 'institution.update',
  PERSONS_VIEW: 'persons.view',
  PERSONS_CREATE: 'persons.create',
  PERSONS_UPDATE: 'persons.update',
  PERSONS_DELETE: 'persons.delete',
  EMPLOYEES_VIEW: 'employees.view',
  EMPLOYEES_CREATE: 'employees.create',
  EMPLOYEES_UPDATE: 'employees.update',
  EMPLOYEES_DELETE: 'employees.delete',
  ROLES_VIEW: 'roles.view',
  ROLES_MANAGE: 'roles.manage',
  AUDIT_VIEW: 'audit.view',
  FILES_UPLOAD: 'files.upload',
  FILES_DELETE: 'files.delete',
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ALL_PERMISSIONS: readonly string[] = Object.values(PERMISSIONS);

export const ALL_MODULES: readonly string[] = Array.from(
  new Set(
    Object.values(PERMISSIONS).map((key) => {
      const module = key.split('.')[0];
      return module;
    }),
  ),
);

export function isPermissionKey(value: string): value is PermissionKey {
  return ALL_PERMISSIONS.includes(value);
}