export interface NavItem {
  label: string;
  href: string;
  icon: string;
  roles?: string[];
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
        roles: ['ADMIN', 'SECRETARY', 'TEACHER', 'STUDENT'],
      },
      {
        label: 'Institución',
        href: '/institution',
        icon: 'institution',
        roles: ['ADMIN', 'SECRETARY'],
      },
      {
        label: 'Carreras',
        href: '/careers',
        icon: 'career',
        roles: ['ADMIN', 'SECRETARY'],
      },
      {
        label: 'Gestión Académica',
        href: '/academic-periods',
        icon: 'calendar',
        roles: ['ADMIN', 'SECRETARY'],
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
        roles: ['ADMIN', 'SECRETARY', 'TEACHER'],
      },
      {
        label: 'Depósitos',
        href: '/deposits',
        icon: 'deposit',
        roles: ['ADMIN', 'SECRETARY'],
      },
      {
        label: 'Matrículas',
        href: '/enrollments',
        icon: 'enrollment',
        roles: ['ADMIN', 'SECRETARY'],
      },
      {
        label: 'Usuarios',
        href: '/users',
        icon: 'users',
        roles: ['ADMIN'],
      },
      {
        label: 'Materias',
        href: '/subjects',
        icon: 'subjects',
        roles: ['ADMIN', 'SECRETARY'],
      },
      {
        label: 'Asignación de Materias',
        href: '/assignments',
        icon: 'assignment',
        roles: ['ADMIN', 'SECRETARY', 'TEACHER'],
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
        roles: ['ADMIN', 'SECRETARY', 'TEACHER'],
      },
      {
        label: 'Calificaciones',
        href: '/grades',
        icon: 'grades',
        roles: ['ADMIN', 'SECRETARY', 'TEACHER'],
      },
      {
        label: 'Historial Académico',
        href: '/academic-history',
        icon: 'history',
        roles: ['ADMIN', 'SECRETARY', 'TEACHER', 'STUDENT'],
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
        roles: ['ADMIN', 'SECRETARY'],
      },
      {
        label: 'Centralizadores',
        href: '/centralizers',
        icon: 'centralizer',
        roles: ['ADMIN', 'SECRETARY'],
      },
      {
        label: 'Certificados',
        href: '/certificates',
        icon: 'certificate',
        roles: ['ADMIN', 'SECRETARY'],
      },
      {
        label: 'Conclusión de Estudios',
        href: '/graduation',
        icon: 'graduation',
        roles: ['ADMIN', 'SECRETARY'],
      },
    ],
  },
];

export const MICROLEGEND: Record<string, string> = {
  ADMIN: 'Administrador',
  SECRETARY: 'Secretaría',
  TEACHER: 'Docente',
  STUDENT: 'Estudiante',
};