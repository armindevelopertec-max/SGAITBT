'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { apiGet, extractError } from '@/lib/api';
import { AdminDashboard, Employee } from '@/lib/types';
import { PageHeader } from '@/components/ui/page-header';
import { Icon } from '@/components/ui/icons';
import { LoadingState, ErrorState } from '@/components/ui/state';
import { hasPermission, hasRole } from '@/lib/permissions';

interface Stat {
  label: string;
  value: number | string;
  icon: string;
  color: string;
  bg: string;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<{ summary: AdminDashboard['summary'] } | null>(null);
  const [staff, setStaff] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const isTeacher = hasRole(user, 'TEACHER', 'DOCENTE');
    const isStudent = hasRole(user, 'STUDENT', 'ESTUDIANTE');
    const endpoint = isTeacher
      ? '/dashboard/teacher'
      : isStudent
        ? '/dashboard/student'
        : '/dashboard/admin';

    apiGet<AdminDashboard>(endpoint)
      .then((res) => {
        setData({ summary: res.summary });
      })
      .catch((err) => setError(extractError(err)))
      .finally(() => setLoading(false));

    // Personal para el control de asistencia (vista estática por ahora).
    if (hasPermission(user, 'employees.view')) {
      apiGet<Employee[]>('/employees')
        .then((res) => setStaff(res))
        .catch(() => setStaff([]));
    }
  }, [user]);

  // --- Control de asistencia del personal (ESTÁTICO, demostración) ---
  // Sin backend por ahora: horarios fijos de ejemplo por posición de lista.
  function staffName(e: Employee): string {
    const p = e.persona;
    if (!p) return e.employeeCode;
    return [p.firstName, p.paternalSurname, p.maternalSurname].filter(Boolean).join(' ') || e.employeeCode;
  }
  function staffCheckIn(i: number): string {
    return `08:${String(2 + ((i * 7) % 20)).padStart(2, '0')}`;
  }
  function staffLeft(i: number): boolean {
    return i % 3 === 2; // 1 de cada 3 figura como retirado (estático)
  }
  function staffCheckOut(i: number): string {
    return `1${2 + (i % 4)}:${String((i * 13) % 60).padStart(2, '0')}`;
  }

  if (loading) return <LoadingState label="Cargando panel principal…" />;
  if (error) return <ErrorState message={error} />;

  if (user && hasRole(user, 'TEACHER', 'DOCENTE')) {
    return (
      <div>
        <PageHeader title="Panel del Docente" subtitle={`Bienvenido, ${user.fullName}`} />
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Mis materias asignadas</div>
            <div className="stat-value">—</div>
          </div>
        </div>
      </div>
    );
  }

  if (user && hasRole(user, 'STUDENT', 'ESTUDIANTE')) {
    return (
      <div>
        <PageHeader title="Mi perfil académico" subtitle={`Bienvenido, ${user.fullName}`} />
        <div className="card card-pad">
          Esta sección muestra tu historial académico y calificaciones.
        </div>
      </div>
    );
  }

  const stats: Stat[] = data
    ? [
        { label: 'Total de estudiantes', value: data.summary.totalStudents, icon: 'students', color: 'var(--primary)', bg: 'var(--primary-soft)' },
        { label: 'Estudiantes activos', value: data.summary.activeStudents, icon: 'students', color: 'var(--success)', bg: 'var(--success-soft)' },
        { label: 'Nuevos estudiantes', value: data.summary.newStudents, icon: 'users', color: 'var(--info)', bg: 'var(--info-soft)' },
        { label: 'Matrículas (2026)', value: data.summary.enrollmentsThisYear, icon: 'enrollment', color: 'var(--purple)', bg: 'var(--purple-soft)' },
        { label: 'Depósitos pendientes', value: data.summary.pendingDeposits, icon: 'deposit', color: 'var(--warning)', bg: 'var(--warning-soft)' },
        { label: 'Docentes', value: data.summary.teachers, icon: 'users', color: 'var(--primary)', bg: 'var(--primary-soft)' },
        { label: 'Materias activas', value: data.summary.activeSubjects, icon: 'subjects', color: 'var(--info)', bg: 'var(--info-soft)' },
        { label: 'Carreras', value: data.summary.careers, icon: 'career', color: 'var(--purple)', bg: 'var(--purple-soft)' },
        { label: 'Aprobados', value: data.summary.approved, icon: 'grades', color: 'var(--success)', bg: 'var(--success-soft)' },
        { label: 'Reprobados', value: data.summary.failed, icon: 'grades', color: 'var(--danger)', bg: 'var(--danger-soft)' },
        { label: 'Egresados', value: data.summary.graduates, icon: 'graduation', color: 'var(--purple)', bg: 'var(--purple-soft)' },
      ]
    : [];

  return (
    <div>
      <PageHeader
        title="Panel principal"
        subtitle={`Bienvenido, ${user?.fullName} — resumen general del instituto`}
      />

      <div className="stats-grid">
        {stats.map((s) => (
          <div className="stat-card" key={s.label}>
            <div className="stat-icon" style={{ background: s.bg, color: s.color }}>
              <Icon name={s.icon} />
            </div>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value">{s.value}</div>
          </div>
        ))}
      </div>

      {staff.length > 0 && (
        <div className="card card-pad mt-4">
          <div className="flex justify-between items-center mb-2" style={{ flexWrap: 'wrap', gap: 8 }}>
            <div>
              <h3 style={{ fontWeight: 700, fontSize: 16, margin: 0 }}>
                Control de asistencia del personal
              </h3>
              <div className="text-muted text-sm">Hoy · vista estática de demostración</div>
            </div>
            <div className="flex gap-3 text-sm">
              <span>
                <Dot color="var(--success)" /> Presente
              </span>
              <span>
                <Dot color="var(--danger)" /> Se retiró
              </span>
            </div>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
              gap: 12,
            }}
          >
            {staff.map((e, i) => {
              const left = staffLeft(i);
              const name = staffName(e);
              const initials = name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase();
              const photo = e.persona?.photoUrl;
              return (
                <div
                  key={e.id}
                  className="card-pad"
                  style={{
                    border: '1px solid var(--border)',
                    borderRadius: 12,
                    background: 'var(--bg-card)',
                    borderTop: `4px solid ${left ? 'var(--danger)' : 'var(--success)'}`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    gap: 4,
                  }}
                >
                  {photo ? (
                    <img
                      src={photo}
                      alt={name}
                      style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 72,
                        height: 72,
                        borderRadius: '50%',
                        background: 'var(--primary-soft)',
                        color: 'var(--primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: 22,
                      }}
                    >
                      {initials}
                    </div>
                  )}
                  <strong style={{ fontSize: 14 }}>{name}</strong>
                  <span className="text-muted text-sm">
                    {e.position ?? e.employeeType}
                  </span>
                  <span className="text-muted text-sm">
                    Ingreso {staffCheckIn(i)} · Salida {left ? staffCheckOut(i) : '—'}
                  </span>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      fontWeight: 700,
                      fontSize: 13,
                      color: left ? 'var(--danger)' : 'var(--success)',
                    }}
                  >
                    <Dot color={left ? 'var(--danger)' : 'var(--success)'} />
                    {left ? 'Se retiró' : 'Presente'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function Dot({ color }: { color: string }) {
  return (
    <span
      style={{
        width: 10,
        height: 10,
        borderRadius: '50%',
        background: color,
        display: 'inline-block',
      }}
    />
  );
}