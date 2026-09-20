'use client';

import { useEffect, useMemo, useState } from 'react';
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

const CONCLUSION_META: Record<Conclusion, { label: string; color: string; bg: string; icon: string }> = {
  COMPLETED: { label: 'Completado', color: 'var(--success)', bg: 'var(--success-soft)', icon: '✓' },
  GRADUATE: { label: 'Egresado', color: 'var(--purple)', bg: 'var(--purple-soft)', icon: '🎓' },
  IN_PROGRESS: { label: 'En curso', color: 'var(--warning)', bg: 'var(--warning-soft)', icon: '📚' },
};

function initialsOf(firstName?: string, lastName?: string): string {
  return `${firstName ?? ''} ${lastName ?? ''}`
    .trim()
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function fullName(s: Student): string {
  const name = `${s.person?.firstName || ''} ${s.person?.paternalSurname ?? ''} ${s.person?.maternalSurname ?? ''}`.trim();
  return name || (s.person?.lastName ?? '');
}

export default function GraduationPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [results, setResults] = useState<Record<string, ConclusionSummary>>({});
  const [search, setSearch] = useState('');
  const [filterConclusion, setFilterConclusion] = useState<Conclusion | ''>('');

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

  const filteredStudents = useMemo(() => {
    const q = search.trim().toLowerCase();
    return students.filter((s) => {
      const matchSearch =
        !q ||
        s.studentCode?.toLowerCase().includes(q) ||
        s.person?.ci?.toLowerCase().includes(q) ||
        fullName(s).toLowerCase().includes(q);
      const r = results[s.id];
      const matchFilter = !filterConclusion || r?.conclusion === filterConclusion;
      return matchSearch && matchFilter;
    });
  }, [students, results, search, filterConclusion]);

  const stats = useMemo(() => {
    const all = Object.values(results);
    const completed = all.filter((r) => r.conclusion === 'COMPLETED').length;
    const graduate = all.filter((r) => r.conclusion === 'GRADUATE').length;
    const inProgress = all.filter((r) => r.conclusion === 'IN_PROGRESS').length;
    const totalApproved = all.reduce((sum, r) => sum + r.approved, 0);
    const totalFailed = all.reduce((sum, r) => sum + r.failed, 0);
    return { completed, graduate, inProgress, total: students.length, totalApproved, totalFailed };
  }, [results, students.length]);

  if (loading) return <LoadingState />;

  return (
    <div>
      <PageHeader
        title="Conclusión de Estudios"
        subtitle="Estado académico y progreso de todos los estudiantes"
      />

      {error && <ErrorState message={error} />}

      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card" style={{ borderLeft: '4px solid var(--primary)' }}>
          <div className="stat-label">Total estudiantes</div>
          <div className="stat-value" style={{ color: 'var(--primary)' }}>{stats.total}</div>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid var(--success)' }}>
          <div className="stat-label">Completados</div>
          <div className="stat-value" style={{ color: 'var(--success)' }}>{stats.completed}</div>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid var(--purple)' }}>
          <div className="stat-label">Egresados</div>
          <div className="stat-value" style={{ color: 'var(--purple)' }}>{stats.graduate}</div>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid var(--warning)' }}>
          <div className="stat-label">En curso</div>
          <div className="stat-value" style={{ color: 'var(--warning)' }}>{stats.inProgress}</div>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid var(--success)' }}>
          <div className="stat-label">Materias aprobadas (total)</div>
          <div className="stat-value" style={{ color: 'var(--success)' }}>{stats.totalApproved}</div>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid var(--danger)' }}>
          <div className="stat-label">Materias reprobadas (total)</div>
          <div className="stat-value" style={{ color: 'var(--danger)' }}>{stats.totalFailed}</div>
        </div>
      </div>

      <div className="card" style={{ padding: '14px 20px', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <input
              className="form-control"
              placeholder="Buscar por matrícula, CI o nombre…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {['', 'COMPLETED', 'GRADUATE', 'IN_PROGRESS'].map((f) => {
              const label =
                f === '' ? 'Todos' :
                f === 'COMPLETED' ? 'Completados' :
                f === 'GRADUATE' ? 'Egresados' :
                'En curso';
              const active = f === '' ? !filterConclusion : filterConclusion === f;
              return (
                <button
                  key={f}
                  onClick={() => setFilterConclusion(f === '' ? '' : f as Conclusion)}
                  style={{
                    padding: '6px 14px', borderRadius: 6, border: '1px solid',
                    borderColor: active ? 'var(--primary)' : 'var(--border)',
                    background: active ? 'var(--primary-soft)' : 'transparent',
                    color: active ? 'var(--primary)' : 'var(--text-muted)',
                    fontSize: 12.5, fontWeight: 600, cursor: 'pointer', transition: 'all 0.12s',
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {filteredStudents.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '60px 40px' }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 16px' }}>
            <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
            <path d="M6 12v5c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2v-5" />
          </svg>
          <h3 style={{ marginBottom: 8, fontWeight: 700 }}>Sin resultados</h3>
          <p className="text-muted">No hay estudiantes que coincidan con la búsqueda o el filtro.</p>
        </div>
      )}

      {filteredStudents.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
          {filteredStudents.map((s) => {
            const r = results[s.id];
            const meta = CONCLUSION_META[r?.conclusion ?? 'IN_PROGRESS'];
            const semestersDone = r?.completedSemesters ?? [];
            const maxSemester = s.career?.numberOfLevels ?? 6;
            const progressPct = maxSemester > 0 ? Math.round((semestersDone.length / maxSemester) * 100) : 0;

            return (
              <div
                key={s.id}
                className="card"
                style={{
                  padding: 0, overflow: 'hidden',
                  borderTop: `4px solid ${meta.color}`,
                  transition: 'box-shadow 0.15s ease',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-lg)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow)'; }}
              >
                <div style={{ padding: '16px 18px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
                    {s.person?.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={s.person.photoUrl} alt="" style={{ width: 48, height: 48, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
                    ) : (
                      <div style={{
                        width: 48, height: 48, borderRadius: 10,
                        background: `linear-gradient(135deg, ${meta.color}, ${meta.bg})`,
                        color: meta.color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 800, fontSize: 16, flexShrink: 0,
                      }}>
                        {initialsOf(s.person?.firstName, s.person?.lastName)}
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 3 }}>
                        <span style={{ fontWeight: 700, fontSize: 14 }}>{fullName(s)}</span>
                        <StatusBadge value={r?.conclusion ?? 'IN_PROGRESS'} />
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{s.studentCode}</span>
                        <span style={{ margin: '0 6px' }}>·</span>
                        CI {s.person?.ci}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                        {s.career?.name ?? '—'} · {s.currentLevel}º semestre
                      </div>
                    </div>
                  </div>

                  <div style={{
                    background: meta.bg,
                    borderRadius: 8,
                    padding: '10px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 12,
                  }}>
                    <span style={{ fontSize: 18 }}>{meta.icon}</span>
                    <div>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: meta.color }}>{meta.label}</div>
                      <div style={{ fontSize: 11.5, color: meta.color, opacity: 0.8 }}>
                        {r?.conclusion === 'COMPLETED'
                          ? 'Todas las materias aprobadas'
                          : r?.conclusion === 'GRADUATE'
                            ? 'Egresado de la carrera'
                            : `${semestersDone.length} semestre${semestersDone.length !== 1 ? 's' : ''} completado${semestersDone.length !== 1 ? 's' : ''}`}
                      </div>
                    </div>
                  </div>

                  <div style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, fontWeight: 600, marginBottom: 5, color: 'var(--text-muted)' }}>
                      <span>Progreso de la carrera</span>
                      <span>{progressPct}%</span>
                    </div>
                    <div style={{ background: 'var(--border)', borderRadius: 4, height: 6, overflow: 'hidden' }}>
                      <div style={{
                        width: `${progressPct}%`,
                        height: '100%',
                        background: meta.color,
                        borderRadius: 4,
                        transition: 'width 0.3s ease',
                      }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3, fontSize: 11, color: 'var(--text-muted)' }}>
                      <span>{semestersDone.length} semestres completados</span>
                      <span>{maxSemester} total</span>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                    <div style={{ textAlign: 'center', background: 'var(--success-soft)', borderRadius: 8, padding: '8px 6px' }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--success)' }}>{r?.approved ?? 0}</div>
                      <div style={{ fontSize: 10.5, color: 'var(--success)', fontWeight: 600 }}>Aprobadas</div>
                    </div>
                    <div style={{ textAlign: 'center', background: 'var(--danger-soft)', borderRadius: 8, padding: '8px 6px' }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--danger)' }}>{r?.failed ?? 0}</div>
                      <div style={{ fontSize: 10.5, color: 'var(--danger)', fontWeight: 600 }}>Reprobadas</div>
                    </div>
                    <div style={{ textAlign: 'center', background: 'var(--warning-soft)', borderRadius: 8, padding: '8px 6px' }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--warning)' }}>{r?.pending ?? 0}</div>
                      <div style={{ fontSize: 10.5, color: 'var(--warning)', fontWeight: 600 }}>Pendientes</div>
                    </div>
                  </div>
                </div>

                {semestersDone.length > 0 && (
                  <div style={{ padding: '10px 18px 14px' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Semestres completados
                    </div>
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                      {Array.from({ length: maxSemester }, (_, i) => i + 1).map((sem) => {
                        const done = semestersDone.includes(sem);
                        return (
                          <span
                            key={sem}
                            style={{
                              width: 28, height: 28, borderRadius: 6,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 11.5, fontWeight: 700,
                              background: done ? 'var(--success)' : 'var(--border)',
                              color: done ? '#fff' : 'var(--text-muted)',
                            }}
                          >
                            {sem}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
