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
        label: 'Periodos Académicos',
        href: '/academic-periods',
        icon: 'calendar',
        permissions: ['periods.view'],
      },
      {
        label: 'Calendario Institucional',
        href: '/calendar',
        icon: 'calendar',
        permissions: ['calendar.view'],
      },
      {
        label: 'Docentes por Materia',
        href: '/subject-designations',
        icon: 'assignment',
        permissions: ['assignments.view'],
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
    ],
  },
  {
    title: 'Académica',
    items: [
      {
        label: 'Depósitos',
        href: '/deposits',
        icon: 'deposit',
        permissions: ['deposits.view'],
      },
      {
        label: 'Estudiantes',
        href: '/students',
        icon: 'students',
        permissions: ['students.view'],
      },
      {
        label: 'Credencial',
        href: '/enrollments',
        icon: 'enrollment',
        permissions: ['enrollments.view'],
      },
      {
        label: 'Boleta de Asignación',
        href: '/student-subject-assignments',
        icon: 'student-assignment',
        permissions: ['assignments.view', 'students.view'],
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
    title: 'Gestión',
    items: [
      {
        label: 'Reportes',
        href: '/reports',
        icon: 'reports',
        permissions: ['reports.view'],
      },
      {
        label: 'Certificados',
        href: '/certificates',
        icon: 'certificate',
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