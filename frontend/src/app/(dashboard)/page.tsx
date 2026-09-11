'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { apiGet, extractError } from '@/lib/api';
import { AdminDashboard } from '@/lib/types';
import { PageHeader } from '@/components/ui/page-header';
import { MICROLEGEND } from '@/lib/nav';
import { Icon } from '@/components/ui/icons';
import { LoadingState, ErrorState } from '@/components/ui/state';

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

  const initials = user?.fullName
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const photo = user?.photoUrl;

  const today = new Date();
  const todayDate = today.toLocaleDateString('es-BO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const todayTime = today.toLocaleTimeString('es-BO', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const actions = data?.summary
    ? [
        `Gestionó ${data.summary.totalStudents} estudiantes en el sistema`,
        `Procesó ${data.summary.enrollmentsThisYear} matrículas de la gestión`,
        `Administró ${data.summary.activeSubjects} materias y ${data.summary.careers} carreras`,
      ]
    : [`Ingresó al sistema de gestión académica como ${MICROLEGEND[user?.role ?? ''] ?? user?.role}`];

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

      <div className="operator-card">
        <div className="card-title" style={{ textAlign: 'center' }}>
          Operador del sistema
        </div>

        <div className="operator-avatar">
          {photo ? (
            <img
              src={photo}
              alt={user?.fullName}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            initials
          )}
        </div>

        <div className="operator-name">{user?.fullName}</div>
        <div className="operator-role">
          {MICROLEGEND[user?.role ?? ''] ?? user?.role}
        </div>
        <div className="text-muted text-sm">{user?.email}</div>

        <div className="operator-section">
          <div className="operator-label">Fecha de operación</div>
          <div className="operator-value">
            {todayDate} · {todayTime}
          </div>
        </div>

        <div className="operator-section">
          <div className="operator-label">¿Qué hizo?</div>
          <ul className="operator-list">
            {actions.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}