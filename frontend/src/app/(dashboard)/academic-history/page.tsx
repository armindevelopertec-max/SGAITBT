'use client';

import { useEffect, useState } from 'react';
import { apiGet, extractError } from '@/lib/api';
import { Student, AcademicHistoryRecord } from '@/lib/types';
import { PageHeader } from '@/components/ui/page-header';
import { StatusBadge } from '@/components/ui/badge';
import { LoadingState, ErrorState } from '@/components/ui/state';
import { useAuth } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';

export default function AcademicHistoryPage() {
  const { user } = useAuth();
  const canBrowse = hasPermission(user, 'students.view');
  const [students, setStudents] = useState<Student[]>([]);
  const [history, setHistory] = useState<AcademicHistoryRecord[]>([]);
  const [summary, setSummary] = useState<{
    approved: number;
    failed: number;
    pending: number;
    total: number;
    completedSemesters: number[];
    conclusion: string;
  } | null>(null);
  const [selectedId, setSelectedId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadStudents() {
    try {
      if (!canBrowse) {
        const me = await apiGet<Student>('/students/me');
        setStudents([me]);
        await loadStudent(me.id);
        return;
      }
      setStudents(await apiGet<Student[]>('/students'));
    } catch (err) {
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStudents();
  }, []);

  async function loadStudent(id: string) {
    setSelectedId(id);
    setError('');
    try {
      const [h, s] = await Promise.all([
        apiGet<AcademicHistoryRecord[]>(`/academic-history/student/${id}`),
        apiGet<{ approved: number; failed: number; pending: number; total: number; completedSemesters: number[]; conclusion: string }>(
          `/academic-history/student/${id}/summary`,
        ),
      ]);
      setHistory(h);
      setSummary(s);
    } catch (err) {
      setError(extractError(err));
    }
  }

  if (loading) return <LoadingState />;

  return (
    <div>
      <PageHeader
        title="Historial Académico"
        subtitle="Trayectoria académica completa de cada estudiante"
        actions={
          canBrowse ? (
            <select
              className="select"
              style={{ width: 280 }}
              value={selectedId}
              onChange={(e) => e.target.value && loadStudent(e.target.value)}
            >
              <option value="">Seleccionar estudiante…</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.studentCode} — {s.firstName} {s.lastName}
                </option>
              ))}
            </select>
          ) : undefined
        }
      />

      {!canBrowse && students[0] && (
        <div
          className="card"
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}
        >
          <div>
            <div style={{ fontWeight: 600 }}>
              {students[0].firstName} {students[0].lastName}
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
              {students[0].studentCode}
            </div>
          </div>
        </div>
      )}

      {error && <ErrorState message={error} />}

      {!selectedId && (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">🧾</div>
            Selecciona un estudiante para ver su historial académico.
          </div>
        </div>
      )}

      {selectedId && summary && (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-label">Materias aprobadas</div>
              <div className="stat-value" style={{ color: 'var(--success)' }}>{summary.approved}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Materias reprobadas</div>
              <div className="stat-value" style={{ color: 'var(--danger)' }}>{summary.failed}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Pendientes</div>
              <div className="stat-value">{summary.pending}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Semestres completados</div>
              <div className="stat-value">{summary.completedSemesters.length}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Estado de estudios</div>
              <div className="stat-value" style={{ fontSize: 16 }}>
                <StatusBadge value={summary.conclusion} />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Gestión</th>
                    <th>Semestre</th>
                    <th>Materia</th>
                    <th>Nota final</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {history.length === 0 && (
                    <tr>
                      <td colSpan={5}>
                        <div className="empty-state">El estudiante aún no tiene materias cursadas.</div>
                      </td>
                    </tr>
                  )}
                  {history.map((h) => (
                    <tr key={h.id}>
                      <td>{h.academicPeriod?.periodName ?? h.academicPeriod?.year ?? '—'}</td>
                      <td>{h.semester}º</td>
                      <td>{h.subject?.name ?? '—'}</td>
                      <td><strong>{h.finalGrade ?? '-'}</strong></td>
                      <td><StatusBadge value={h.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}