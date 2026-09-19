interface BadgeProps {
  label: string;
  color?: 'success' | 'danger' | 'warning' | 'info' | 'purple' | 'neutral';
}

export function Badge({ label, color = 'neutral' }: BadgeProps) {
  return <span className={`badge badge-${color}`}>{label}</span>;
}

const STATUS_MAP: Record<string, { label: string; color: BadgeProps['color'] }> = {
  // Academic / Career states
  PRE_ENROLLED: { label: 'Preinscrito', color: 'info' },
  ACTIVE: { label: 'Activo', color: 'success' },
  WITHDRAWN: { label: 'Retirado', color: 'warning' },
  GRADUATE: { label: 'Egresado', color: 'purple' },
  TITLED: { label: 'Titulado', color: 'purple' },
  INACTIVE: { label: 'Inactivo', color: 'neutral' },

  // Deposits
  PENDING: { label: 'Pendiente', color: 'warning' },
  VERIFIED: { label: 'Verificado', color: 'info' },
  APPROVED: { label: 'Aprobado', color: 'success' },
  REJECTED: { label: 'Rechazado', color: 'danger' },
  OBSERVED: { label: 'Observado', color: 'warning' },

  // Enrollment
  CANCELLED: { label: 'Cancelado', color: 'danger' },

  // Periods
  PLANNED: { label: 'Planificado', color: 'info' },
  OPEN: { label: 'Abierta', color: 'success' },
  CLOSED: { label: 'Cerrada', color: 'neutral' },

  // Calendar categories
  PERIODO: { label: 'Período académico', color: 'info' },
  ACTIVIDAD: { label: 'Actividad académica', color: 'purple' },
  EVALUACION: { label: 'Evaluación', color: 'warning' },
  RECESO: { label: 'Receso / Feriado', color: 'neutral' },
  CIERRE: { label: 'Cierre', color: 'danger' },
  OTHER: { label: 'Otro', color: 'neutral' },

  // Deposit concepts
  MATRICULA: { label: 'Matrícula', color: 'success' },
  EXAMEN: { label: 'Examen', color: 'warning' },
  CERTIFICADO: { label: 'Certificado', color: 'info' },
  OTROS: { label: 'Otros', color: 'neutral' },

  // Study conclusion
  COMPLETED: { label: 'Completado', color: 'success' },
  IN_PROGRESS: { label: 'En curso', color: 'warning' },

  // Grades
  FAILED: { label: 'Reprobado', color: 'danger' },

  // Roles
  ADMIN: { label: 'Administrador', color: 'purple' },
  SECRETARY: { label: 'Secretaría', color: 'info' },
  TEACHER: { label: 'Docente', color: 'warning' },
  STUDENT: { label: 'Estudiante', color: 'neutral' },

  // User status
  BLOCKED: { label: 'Bloqueado', color: 'danger' },

  // Attendance
  PRESENT: { label: 'Presente', color: 'success' },
  ABSENT: { label: 'Falta', color: 'danger' },
  LATE: { label: 'Atraso', color: 'warning' },
  JUSTIFIED: { label: 'Justificado', color: 'info' },

  // Sex
  MALE: { label: 'Masculino', color: 'info' },
  FEMALE: { label: 'Femenino', color: 'purple' },
};

export function StatusBadge({ value }: { value: string }) {
  const mapped = STATUS_MAP[value];
  return <Badge label={mapped?.label ?? value} color={mapped?.color ?? 'neutral'} />;
}