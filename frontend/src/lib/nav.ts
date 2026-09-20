export interface NavItem {
  label: string;
  href: string;
  icon: string;
  permissions?: string[];
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    title: 'General',
    items: [
      {
        label: 'Dashboard',
        href: '/',
        icon: 'dashboard',
        permissions: ['dashboard.view'],
      },
      {
        label: 'Institución',
        href: '/institution',
        icon: 'institution',
        permissions: ['institution.view'],
      },
      {
        label: 'Carreras',
        href: '/careers',
        icon: 'career',
        permissions: ['careers.view'],
      },
      {
        label: 'Materias',
        href: '/subjects',
        icon: 'subjects',
        permissions: ['subjects.view'],
      },
      {
        label: 'Gestión Académica',
        href: '/academic-management',
        icon: 'calendar',
        permissions: ['periods.view'],
      },
      {
        label: 'Designación de Materias',
        href: '/subject-designations',
        icon: 'assignment',
        permissions: ['assignments.view'],
      },
    ],
  },
  {
    title: 'Académica',
    items: [
      {
        label: 'Estudiantes',
        href: '/students',
        icon: 'students',
        permissions: ['students.view'],
      },
      {
        label: 'Depósitos',
        href: '/deposits',
        icon: 'deposit',
        permissions: ['deposits.view'],
      },
      {
        label: 'Matrículas',
        href: '/enrollments',
        icon: 'enrollment',
        permissions: ['enrollments.view'],
      },
      {
        label: 'Asignación de Materias (Boletas)',
        href: '/student-subject-assignments',
        icon: 'student-assignment',
        permissions: ['assignments.view', 'students.view'],
      },
      {
        label: 'Empleados',
        href: '/employees',
        icon: 'employee',
        permissions: ['employees.view'],
      },
      {
        label: 'Roles',
        href: '/roles',
        icon: 'role',
        permissions: ['roles.view'],
      },
      {
        label: 'Auditoría',
        href: '/audit',
        icon: 'audit',
        permissions: ['audit.view'],
      },
    ],
  },
  {
    title: 'Evaluación',
    items: [
      {
        label: 'Asistencia',
        href: '/attendance',
        icon: 'attendance',
        permissions: ['attendance.view', 'attendance.create'],
      },
      {
        label: 'Calificaciones',
        href: '/grades',
        icon: 'grades',
        permissions: ['grades.view'],
      },
      {
        label: 'Historial Académico',
        href: '/academic-history',
        icon: 'history',
        permissions: ['history.view'],
      },
    ],
  },
  {
    title: 'Gestión',
    items: [
      {
        label: 'Reportes',
        href: '/reports',
        icon: 'reports',
        permissions: ['reports.view'],
      },
      {
        label: 'Centralizadores',
        href: '/centralizers',
        icon: 'centralizer',
        permissions: ['grades.view', 'reports.view'],
      },
      {
        label: 'Certificados',
        href: '/certificates',
        icon: 'certificate',
        permissions: ['reports.view'],
      },
      {
        label: 'Conclusión de Estudios',
        href: '/graduation',
        icon: 'graduation',
        permissions: ['reports.view'],
      },
    ],
  },
];

export const MICROLEGEND: Record<string, string> = {
  ADMIN: 'Administrador',
  SECRETARY: 'Secretaría',
  TEACHER: 'Docente',
  STUDENT: 'Estudiante',
  RECTOR: 'Rector',
  DIRECTIVO: 'Directivo',
  COORDINADOR: 'Coordinador académico',
  DOCENTE: 'Docente',
  ADMINISTRATIVO: 'Administrativo',
  SECRETARIA: 'Secretaría',
  APOYO: 'Empleado',
  ESTUDIANTE: 'Estudiante',
};