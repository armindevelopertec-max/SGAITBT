'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { apiGet, extractError } from '@/lib/api';
import { AdminDashboard } from '@/lib/types';
import { PageHeader } from '@/components/ui/page-header';
import { Icon } from '@/components/ui/icons';
import { LoadingState, ErrorState } from '@/components/ui/state';
import { StatusBadge } from '@/components/ui/badge';

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
  const [students, setStudents] = useState<AdminDashboard['recentStudents']>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const endpoint =
      user.role === 'TEACHER'
        ? '/dashboard/teacher'
        : user.role === 'STUDENT'
          ? '/dashboard/student'
          : '/dashboard/admin';

    apiGet<AdminDashboard>(endpoint)
      .then((res) => {
        setData({ summary: res.summary });
        if (res.recentStudents) setStudents(res.recentStudents);
      })
      .catch((err) => setError(extractError(err)))
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) return <LoadingState label="Cargando panel principal…" />;
  if (error) return <ErrorState message={error} />;

  if (user?.role === 'TEACHER') {
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

  if (user?.role === 'STUDENT') {
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

      <div className="card">
        <div className="card-header">
          <div className="card-title">Estudiantes recientes</div>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Estudiante</th>
                <th>CI</th>
                <th>Carrera</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 && (
                <tr>
                  <td colSpan={5}>
                    <div className="empty-state">
                      <div className="empty-state-icon">🗂️</div>
                      Sin estudiantes registrados aún.
                    </div>
                  </td>
                </tr>
              )}
              {students.map((s) => (
                <tr key={s.id}>
                  <td>{s.studentCode}</td>
                  <td>{s.firstName} {s.lastName}</td>
                  <td>{s.ci}</td>
                  <td>{s.career?.name ?? '—'}</td>
                  <td><StatusBadge value={s.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}