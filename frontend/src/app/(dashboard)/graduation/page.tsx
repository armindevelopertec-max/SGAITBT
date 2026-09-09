'use client';

import { useEffect, useState } from 'react';
import { apiGet, extractError } from '@/lib/api';
import { Student } from '@/lib/types';
import { PageHeader } from '@/components/ui/page-header';
import { StatusBadge } from '@/components/ui/badge';
import { LoadingState, ErrorState } from '@/components/ui/state';

type Conclusion = 'COMPLETED' | 'IN_PROGRESS' | 'GRADUATE';

interface ConclusionSummary {
  approved: number;
  failed: number;
  pending: number;
  total: number;
  completedSemesters: number[];
  conclusion: Conclusion;
}

export default function GraduationPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [results, setResults] = useState<Record<string, ConclusionSummary>>({});

  async function load() {
    setLoading(true);
    try {
      const s = await apiGet<Student[]>('/students');
      setStudents(s);
      const summaries: Record<string, ConclusionSummary> = {};
      await Promise.all(
        s.map(async (student) => {
          try {
            const summary = await apiGet<ConclusionSummary>(
              `/academic-history/student/${student.id}/summary`,
            );
            summaries[student.id] = summary;
          } catch {
            summaries[student.id] = {
              approved: 0,
              failed: 0,
              pending: 0,
              total: 0,
              completedSemesters: [],
              conclusion: 'IN_PROGRESS',
            };
          }
        }),
      );
      setResults(summaries);
    } catch (err) {
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (loading) return <LoadingState />;

  return (
    <div>
      <PageHeader
        title="Conclusión de Estudios"
        subtitle="Verificación de la situación académica de cada estudiante"
      />

      {error && <ErrorState message={error} />}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Estudiantes con estudios completos</div>
          <div className="stat-value">
            {Object.values(results).filter((r) => r.conclusion === 'COMPLETED' || r.conclusion === 'GRADUATE').length}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">En curso</div>
          <div className="stat-value">
            {Object.values(results).filter((r) => r.conclusion === 'IN_PROGRESS').length}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Estudiante</th>
                <th>Carrera</th>
                <th>Aprobadas</th>
                <th>Reprobadas</th>
                <th>Pendientes</th>
                <th>Semestres completados</th>
                <th>Conclusión</th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 && (
                <tr>
                  <td colSpan={8}>
                    <div className="empty-state">No hay estudiantes registrados.</div>
                  </td>
                </tr>
              )}
              {students.map((s) => {
                const r = results[s.id];
                const conclusionLabel =
                  r?.conclusion === 'COMPLETED'
                    ? 'Carrera concluida'
                    : r?.conclusion === 'GRADUATE'
                      ? 'Egresado'
                      : 'Carrera pendiente';
                return (
                  <tr key={s.id}>
                    <td>{s.studentCode}</td>
                    <td>{s.firstName} {s.lastName}</td>
                    <td>{s.career?.name ?? '—'}</td>
                    <td style={{ color: 'var(--success)', fontWeight: 600 }}>{r?.approved ?? 0}</td>
                    <td style={{ color: 'var(--danger)', fontWeight: 600 }}>{r?.failed ?? 0}</td>
                    <td>{r?.pending ?? 0}</td>
                    <td>{(r?.completedSemesters ?? []).join(', ') || '—'}</td>
                    <td>
                      <StatusBadge value={r?.conclusion ?? 'IN_PROGRESS'} />
                      <div className="text-muted text-sm">{conclusionLabel}</div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}