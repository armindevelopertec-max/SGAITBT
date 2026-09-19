'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiGet, extractError } from '@/lib/api';
import { Student, AcademicHistoryRecord, AcademicPeriod, Subject } from '@/lib/types';
import { PageHeader } from '@/components/ui/page-header';
import { StatusBadge } from '@/components/ui/badge';
import { LoadingState, ErrorState } from '@/components/ui/state';
import { useAuth } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';

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
  const name = `${s.firstName} ${s.paternalSurname ?? ''} ${s.maternalSurname ?? ''}`.trim();
  return name || (s.lastName ?? '');
}

export default function AcademicHistoryPage() {
  const { user } = useAuth();
  const canBrowse = hasPermission(user, 'students.view');

  const [students, setStudents] = useState<Student[]>([]);
  const [history, setHistory] = useState<AcademicHistoryRecord[]>([]);
  const [periods, setPeriods] = useState<AcademicPeriod[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [selectedPeriodIds, setSelectedPeriodIds] = useState<string[]>([]);
  const [studentQuery, setStudentQuery] = useState('');

  async function load() {
    setLoading(true);
    try {
      const stuList = canBrowse
        ? await apiGet<Student[]>('/students')
        : [await apiGet<Student>('/students/me')];
      const [ps] = await Promise.all([apiGet<AcademicPeriod[]>('/academic-periods')]);
      setStudents(stuList as Student[]);
      setPeriods(ps.sort((a, b) => Number(b.year) - Number(a.year) || ((b.sequence ?? 0) - (a.sequence ?? 0))));
    } catch (err) {
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function loadStudent(id: string) {
    setSelectedId(id);
    setError('');
    try {
      const [h, stu] = await Promise.all([
        apiGet<AcademicHistoryRecord[]>(`/academic-history/student/${id}`),
        Promise.resolve(students.find((s) => s.id === id)),
      ]);
      setHistory(h);
      if (stu?.careerId) {
        const subs = await apiGet<Subject[]>(`/subjects/career/${stu.careerId}`);
        setSubjects(subs);
      } else {
        setSubjects([]);
      }
    } catch (err) {
      setError(extractError(err));
    }
  }

  function selectStudent(id: string) {
    setSelectedId(id);
    loadStudent(id);
    setStudentQuery('');
  }

  const student = students.find((s) => s.id === selectedId);

  const studentMatches = (() => {
    const q = studentQuery.trim().toLowerCase();
    if (!q) return students.slice(0, 8);
    return students
      .filter(
        (s) =>
          s.studentCode?.toLowerCase().includes(q) ||
          s.ci?.toLowerCase().includes(q) ||
          `${s.firstName} ${s.lastName}`.toLowerCase().includes(q),
      )
      .slice(0, 8);
  })();

  const filteredHistory = useMemo(() => {
    if (selectedPeriodIds.length === 0) return history;
    return history.filter((h) => selectedPeriodIds.includes(h.academicPeriodId));
  }, [history, selectedPeriodIds]);

  const approved = filteredHistory.filter((h) => h.status === 'APPROVED').length;
  const failed = filteredHistory.filter((h) => h.status === 'FAILED').length;
  const pending = filteredHistory.filter((h) => h.status === 'PENDING').length;
  const avg =
    filteredHistory.length > 0
      ? (filteredHistory.reduce((acc, h) => acc + (h.finalGrade ?? 0), 0) / filteredHistory.length).toFixed(1)
      : '—';

  const completedSemesters = useMemo(() => {
    const semSet = new Set<number>();
    for (const h of history) {
      if (h.status === 'APPROVED') semSet.add(h.semester);
    }
    return Array.from(semSet).sort((a, b) => a - b);
  }, [history]);

  const semestersPresent = useMemo(() => {
    const semSet = new Set<number>();
    for (const h of history) semSet.add(h.semester);
    return Array.from(semSet).sort((a, b) => a - b);
  }, [history]);

  const allSubjectsPassedInSemester = useMemo(() => {
    const result = new Map<number, boolean>();
    for (const sem of semestersPresent) {
      const semSubjects = subjects.filter((s) => s.semester === sem);
      if (semSubjects.length === 0) { result.set(sem, false); continue; }
      const approvedInSem = new Set(
        history.filter((h) => h.semester === sem && h.status === 'APPROVED').map((h) => h.subjectId),
      );
      result.set(sem, semSubjects.every((s) => approvedInSem.has(s.id)));
    }
    return result;
  }, [history, subjects, semestersPresent]);

  function isHabilitadoForSemester(sem: number): boolean {
    return allSubjectsPassedInSemester.get(sem - 1) ?? false;
  }

  const historyBySemester = useMemo(() => {
    const map = new Map<number, AcademicHistoryRecord[]>();
    for (const h of filteredHistory) {
      if (!map.has(h.semester)) map.set(h.semester, []);
      map.get(h.semester)!.push(h);
    }
    return map;
  }, [filteredHistory]);

  if (loading) return <LoadingState />;

  const stepStudent = !!selectedId;
  const stepPeriod = stepStudent && selectedPeriodIds.length > 0;
  const stepHistory = stepStudent;

  return (
    <div>
      <PageHeader
        title="Historial Académico"
        subtitle="Trayectoria académica completa por estudiante"
      />

      {error && <ErrorState message={error} />}

      <div className="card" style={{ padding: '14px 20px', marginBottom: 16 }}>
        <div className="flex gap-2 items-center" style={{ flexWrap: 'wrap' }}>
          {[
            { n: 1, label: 'Estudiante', done: stepStudent },
            { n: 2, label: 'Filtrar', done: stepPeriod },
            { n: 3, label: 'Historial', done: stepHistory },
          ].map((s, i, arr) => (
            <span key={s.n} className="flex gap-2 items-center">
              <span
                style={{
                  width: 26, height: 26, borderRadius: '50%',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: 13,
                  background: s.done ? 'var(--success)' : 'var(--primary-soft)',
                  color: s.done ? '#fff' : 'var(--primary)',
                }}
              >
                {s.done ? '✓' : s.n}
              </span>
              <span className="text-sm" style={{ fontWeight: 600 }}>{s.label}</span>
              {i < arr.length - 1 && (
                <span style={{ width: 24, height: 2, background: 'var(--border)', borderRadius: 2 }} />
              )}
            </span>
          ))}
        </div>
      </div>

      {canBrowse && (
        <div className="card" style={{ padding: '16px 20px', marginBottom: 16 }}>
          <div className="form-label" style={{ marginBottom: 10, fontWeight: 700 }}>Buscar estudiante</div>
          {student ? (
            <div
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: 'var(--primary-soft)', border: 'none', borderRadius: 10,
                padding: '10px 14px', gap: 10, flexWrap: 'wrap',
              }}
            >
              <div className="flex items-center" style={{ gap: 12 }}>
                {student.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={student.photoUrl} alt="" style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 16 }}>
                    {initialsOf(student.firstName, student.lastName)}
                  </div>
                )}
                <div>
                  <strong style={{ fontSize: 14 }}>{student.studentCode} — {fullName(student)}</strong>
                  <div className="text-muted text-sm">CI {student.ci} · {student.career?.name ?? '—'} · {student.currentLevel}º semestre</div>
                </div>
              </div>
              <button className="btn btn-outline btn-sm" onClick={() => { setSelectedId(''); setHistory([]); setSubjects([]); setSelectedPeriodIds([]); }}>
                Cambiar
              </button>
            </div>
          ) : (
            <>
              <input
                className="form-control"
                placeholder="Buscar por matrícula, CI o nombre…"
                value={studentQuery}
                onChange={(e) => setStudentQuery(e.target.value)}
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8, maxHeight: 260, overflowY: 'auto' }}>
                {studentMatches.map((s) => (
                  <button
                    key={s.id}
                    className="btn btn-outline btn-sm"
                    style={{ justifyContent: 'flex-start', textAlign: 'left' }}
                    onClick={() => selectStudent(s.id)}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {s.photoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={s.photoUrl} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary-soft)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12 }}>
                          {initialsOf(s.firstName, s.lastName)}
                        </div>
                      )}
                      <span>
                        <strong>{s.studentCode}</strong> — {fullName(s)} · CI {s.ci}
                      </span>
                    </span>
                  </button>
                ))}
                {studentMatches.length === 0 && studentQuery && (
                  <span className="text-muted text-sm">Sin estudiantes con ese criterio.</span>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {!canBrowse && students[0] && !selectedId && (
        <div style={{ marginBottom: 16 }}>
          {(() => { const s = students[0]; return (
            <div
              className="card"
              style={{ padding: '14px 20px', cursor: 'pointer', border: '2px solid var(--primary)', background: 'var(--primary-soft)' }}
              onClick={() => selectStudent(s.id)}
            >
              <div className="flex items-center" style={{ gap: 12 }}>
                {s.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={s.photoUrl} alt="" style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                    {initialsOf(s.firstName, s.lastName)}
                  </div>
                )}
                <div>
                  <strong>{s.studentCode} — {fullName(s)}</strong>
                  <div className="text-muted text-sm">CI {s.ci} · {s.career?.name ?? '—'}</div>
                </div>
              </div>
            </div>
          ); })()}
        </div>
      )}

      {selectedId && (
        <>
          <div className="stats-grid" style={{ marginBottom: 16 }}>
            <div className="stat-card" style={{ borderLeft: '4px solid var(--success)' }}>
              <div className="stat-label">Aprobadas</div>
              <div className="stat-value" style={{ color: 'var(--success)' }}>{approved}</div>
            </div>
            <div className="stat-card" style={{ borderLeft: '4px solid var(--danger)' }}>
              <div className="stat-label">Reprobadas</div>
              <div className="stat-value" style={{ color: 'var(--danger)' }}>{failed}</div>
            </div>
            <div className="stat-card" style={{ borderLeft: '4px solid var(--warning)' }}>
              <div className="stat-label">Pendientes</div>
              <div className="stat-value" style={{ color: 'var(--warning)' }}>{pending}</div>
            </div>
            <div className="stat-card" style={{ borderLeft: '4px solid var(--primary)' }}>
              <div className="stat-label">Promedio</div>
              <div className="stat-value" style={{ color: 'var(--primary)' }}>{avg}</div>
            </div>
            <div className="stat-card" style={{ borderLeft: '4px solid var(--purple)' }}>
              <div className="stat-label">Semestres con aprobación</div>
              <div className="stat-value" style={{ color: 'var(--purple)' }}>{completedSemesters.length}</div>
            </div>
          </div>

          <div className="card" style={{ padding: '14px 20px', marginBottom: 16 }}>
            <div className="form-label" style={{ marginBottom: 10, fontWeight: 700 }}>Filtrar por periodo</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <button
                onClick={() => setSelectedPeriodIds([])}
                style={{
                  padding: '5px 14px', borderRadius: 6, border: '1px solid',
                  borderColor: selectedPeriodIds.length === 0 ? 'var(--primary)' : 'var(--border)',
                  background: selectedPeriodIds.length === 0 ? 'var(--primary-soft)' : 'transparent',
                  color: selectedPeriodIds.length === 0 ? 'var(--primary)' : 'var(--text-muted)',
                  fontSize: 12.5, fontWeight: 600, cursor: 'pointer', transition: 'all 0.12s',
                }}
              >
                Todos los periodos
              </button>
              {periods.map((p) => {
                const active = selectedPeriodIds.includes(p.id);
                const dot = p.status === 'OPEN' ? 'var(--success)' : p.status === 'PLANNED' ? 'var(--primary)' : 'var(--text-muted)';
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      setSelectedPeriodIds((prev) =>
                        prev.includes(p.id) ? prev.filter((id) => id !== p.id) : [...prev, p.id],
                      );
                    }}
                    style={{
                      padding: '5px 14px', borderRadius: 6, border: '1px solid',
                      borderColor: active ? 'var(--primary)' : 'var(--border)',
                      background: active ? 'var(--primary-soft)' : 'transparent',
                      color: active ? 'var(--primary)' : 'var(--text-muted)',
                      fontSize: 12.5, fontWeight: 600, cursor: 'pointer', transition: 'all 0.12s',
                      display: 'flex', alignItems: 'center', gap: 6,
                    }}
                  >
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: active ? 'var(--primary)' : dot, flexShrink: 0 }} />
                    {p.periodName}
                  </button>
                );
              })}
            </div>
            {selectedPeriodIds.length > 0 && (
              <button
                className="btn btn-outline btn-sm"
                style={{ marginTop: 10 }}
                onClick={() => setSelectedPeriodIds([])}
              >
                Limpiar filtro
              </button>
            )}
          </div>

          {filteredHistory.length === 0 && (
            <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 12px' }}>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
              <h3 style={{ marginBottom: 8, fontWeight: 700 }}>Sin registros</h3>
              <p className="text-muted">Este estudiante no tiene materias registradas en los periodos seleccionados.</p>
            </div>
          )}

          {filteredHistory.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {Array.from(historyBySemester.entries())
                .sort(([a], [b]) => a - b)
                .map(([sem, records]) => {
                  const passed = allSubjectsPassedInSemester.get(sem);
                  const nextHabilitado = isHabilitadoForSemester(sem + 1);
                  return (
                    <div key={sem} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                      <div style={{
                        padding: '12px 20px',
                        borderBottom: '1px solid var(--border)',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        background: passed ? 'var(--success-soft)' : 'var(--bg)',
                        gap: 10, flexWrap: 'wrap',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{
                            width: 32, height: 32, borderRadius: 8,
                            background: passed ? 'var(--success)' : 'var(--border)',
                            color: passed ? '#fff' : 'var(--text-muted)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 800, fontSize: 13,
                          }}>
                            {sem}º
                          </span>
                          <div>
                            <span style={{ fontWeight: 700, fontSize: 14 }}>Semestre {sem}</span>
                            <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--text-muted)' }}>
                              {records.length} materia{records.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          {passed ? (
                            <span className="badge badge-success">✓ Semestre aprobado</span>
                          ) : (
                            <span className="badge badge-warning">En curso</span>
                          )}
                          {nextHabilitado && (
                            <span className="badge badge-info">Habilitado para sem. {sem + 1}</span>
                          )}
                        </div>
                      </div>

                      <div className="table-wrap">
                        <table className="table">
                          <thead>
                            <tr>
                              <th>Materia</th>
                              <th>Código</th>
                              <th>Periodo</th>
                              <th>Nota</th>
                              <th>Estado</th>
                            </tr>
                          </thead>
                          <tbody>
                            {records.sort((a, b) => (a.subject?.code ?? '').localeCompare(b.subject?.code ?? '')).map((h) => (
                              <tr key={h.id} style={h.status === 'PENDING' ? { opacity: 0.6 } : undefined}>
                                <td style={{ fontWeight: 600 }}>{h.subject?.name ?? '—'}</td>
                                <td><span className="badge badge-neutral">{h.subject?.code ?? '—'}</span></td>
                                <td style={{ color: 'var(--text-muted)', fontSize: 12.5 }}>{h.academicPeriod?.periodName ?? '—'}</td>
                                <td>
                                  <strong style={{
                                    fontSize: 15,
                                    color: h.finalGrade != null
                                      ? h.finalGrade >= 51 ? 'var(--success)' : 'var(--danger)'
                                      : 'var(--text-muted)',
                                  }}>
                                    {h.finalGrade ?? '—'}
                                  </strong>
                                </td>
                                <td><StatusBadge value={h.status} /></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </>
      )}

      {!selectedId && (
        <div className="card" style={{ textAlign: 'center', padding: '60px 40px' }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 16px' }}>
            <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
            <path d="M6 12v5c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2v-5" />
          </svg>
          <h3 style={{ marginBottom: 8, fontWeight: 700 }}>Selecciona un estudiante</h3>
          <p className="text-muted">Busca por nombre, CI o número de matrícula para ver su historial académico.</p>
        </div>
      )}
    </div>
  );
}
