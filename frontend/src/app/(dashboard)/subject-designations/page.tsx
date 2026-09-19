'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiGet, apiPatch, apiPost, apiDelete, extractError } from '@/lib/api';
import { SubjectAssignment, Subject, AcademicPeriod, Employee, Career } from '@/lib/types';
import { PageHeader } from '@/components/ui/page-header';
import { Modal } from '@/components/ui/modal';
import { LoadingState, ErrorState } from '@/components/ui/state';

interface Parallel {
  id: string;
  code: string;
  shift: 'MANANA' | 'TARDE' | 'NOCHE';
  academicPeriodId: string;
}

interface FormState {
  id?: string;
  subjectId: string;
  academicPeriodId: string;
  employeeId: string;
  parallelId: string;
}

interface ParallelFormState {
  id?: string;
  code: string;
  shift: 'MANANA' | 'TARDE' | 'NOCHE';
}

const SHIFT_LABELS: Record<string, string> = {
  MANANA: 'Mañana',
  TARDE: 'Tarde',
  NOCHE: 'Noche',
};

const SHIFT_COLORS: Record<string, string> = {
  MANANA: 'var(--primary)',
  TARDE: 'var(--warning)',
  NOCHE: 'var(--purple)',
};

function personName(p?: { firstName?: string; paternalSurname?: string; maternalSurname?: string; lastName?: string }): string {
  return p ? [p.firstName, p.paternalSurname, p.maternalSurname].filter(Boolean).join(' ') || p.lastName || '—' : '—';
}

function initialsOf(p?: { firstName?: string; paternalSurname?: string; maternalSurname?: string; lastName?: string }): string {
  return personName(p).split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
}

export default function SubjectDesignationsPage() {
  const [assignments, setAssignments] = useState<SubjectAssignment[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [periods, setPeriods] = useState<AcademicPeriod[]>([]);
  const [teachers, setTeachers] = useState<Employee[]>([]);
  const [parallels, setParalels] = useState<Parallel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [parallelModalOpen, setParallelModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>({ subjectId: '', academicPeriodId: '', employeeId: '', parallelId: '' });
  const [parallelForm, setParallelForm] = useState<ParallelFormState>({ code: '', shift: 'MANANA' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingParallelId, setEditingParallelId] = useState<string | null>(null);
  const [showParallelForm, setShowParallelForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [selectedPeriodId, setSelectedPeriodId] = useState('');
  const [filterCareer, setFilterCareer] = useState('');
  const [filterTeacher, setFilterTeacher] = useState('');
  const [onlyWithoutTeacher, setOnlyWithoutTeacher] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [a, sub, p, t] = await Promise.all([
        apiGet<SubjectAssignment[]>('/subject-assignments'),
        apiGet<Subject[]>('/subjects'),
        apiGet<AcademicPeriod[]>('/academic-periods'),
        apiGet<Employee[]>('/employees?employeeType=DOCENTE'),
      ]);
      setAssignments(a);
      setSubjects(sub);
      setPeriods(p.sort((a, b) => Number(b.year) - Number(a.year) || (b.sequence ?? 0) - (a.sequence ?? 0)));
      setTeachers(t);
      setSelectedPeriodId((prev) => prev || (p.find((x) => x.status === 'OPEN')?.id ?? (p[0]?.id ?? '')));
    } catch (err) {
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  }

  async function loadParalels(periodId: string) {
    try {
      const par = await apiGet<Parallel[]>(`/parallels?academicPeriodId=${periodId}`);
      setParalels(par);
    } catch (err) {
      setError(extractError(err));
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (selectedPeriodId) {
      loadParalels(selectedPeriodId);
    }
  }, [selectedPeriodId]);

  function openCreate(preSubjectId?: string, preParallelId?: string) {
    setEditingId(null);
    const pid = selectedPeriodId || (periods[0]?.id ?? '');
    setForm({
      subjectId: preSubjectId || (subjects[0]?.id ?? ''),
      academicPeriodId: pid,
      employeeId: '',
      parallelId: preParallelId || (parallels[0]?.id ?? ''),
    });
    setModalOpen(true);
  }

  function openEdit(a: SubjectAssignment) {
    setEditingId(a.id);
    setForm({
      id: a.id,
      subjectId: a.subjectId,
      academicPeriodId: a.academicPeriodId,
      employeeId: a.employeeId ?? '',
      parallelId: a.parallelId ?? '',
    });
    setModalOpen(true);
  }

  async function submit() {
    if (!form.subjectId || !form.academicPeriodId || !form.parallelId) return;
    setSaving(true);
    try {
      const parallel = parallels.find((p) => p.id === form.parallelId);
      const payload = {
        subjectId: form.subjectId,
        academicPeriodId: form.academicPeriodId,
        employeeId: form.employeeId || undefined,
        parallelId: form.parallelId,
        parallel: parallel?.code ?? 'A',
      };
      if (editingId) {
        await apiPatch(`/subject-assignments/${editingId}`, payload);
      } else {
        await apiPost('/subject-assignments', payload);
      }
      setModalOpen(false);
      await load();
    } catch (err) {
      setError(extractError(err));
    } finally {
      setSaving(false);
    }
  }

  function openParallelCreate() {
    setEditingParallelId(null);
    setParallelForm({ code: 'A', shift: 'MANANA' });
    setShowParallelForm(true);
  }

  function openParallelEdit(p: Parallel) {
    setEditingParallelId(p.id);
    setParallelForm({ code: p.code, shift: p.shift });
    setShowParallelForm(true);
  }

  async function submitParallel() {
    if (!parallelForm.code || !selectedPeriodId) return;
    setSaving(true);
    try {
      const payload = {
        academicPeriodId: selectedPeriodId,
        code: parallelForm.code.toUpperCase(),
        shift: parallelForm.shift,
      };
      if (editingParallelId) {
        await apiPatch(`/parallels/${editingParallelId}`, payload);
      } else {
        await apiPost('/parallels', payload);
      }
      setParallelModalOpen(false);
      setShowParallelForm(false);
      await loadParalels(selectedPeriodId);
    } catch (err) {
      setError(extractError(err));
    } finally {
      setSaving(false);
    }
  }

  async function removeParallel(p: Parallel) {
    if (!window.confirm(`¿Eliminar el paralelo ${p.code} (${SHIFT_LABELS[p.shift]})?`)) return;
    try {
      await apiDelete(`/parallels/${p.id}`);
      await loadParalels(selectedPeriodId);
    } catch (err) {
      setError(extractError(err));
    }
  }

  const careers = useMemo(() => {
    const map = new Map<string, Career>();
    for (const s of subjects) {
      if (s.career) map.set(s.career.id, s.career);
    }
    return Array.from(map.values());
  }, [subjects]);

  const periodAssignments = useMemo(() => {
    if (!selectedPeriodId) return [];
    return assignments.filter((a) => a.academicPeriodId === selectedPeriodId);
  }, [assignments, selectedPeriodId]);

  const filteredAssignments = useMemo(() => {
    return periodAssignments.filter((a) => {
      if (filterCareer && a.subject?.careerId !== filterCareer) return false;
      if (filterTeacher && a.employeeId !== filterTeacher) return false;
      if (onlyWithoutTeacher && a.employeeId) return false;
      return true;
    });
  }, [periodAssignments, filterCareer, filterTeacher, onlyWithoutTeacher]);

  const allSubjectsWithAssignments = useMemo(() => {
    const careerMap = new Map<string, Map<number, { subject: Subject; assignments: SubjectAssignment[] }[]>>();
    for (const s of subjects) {
      if (filterCareer && s.careerId !== filterCareer) continue;
      const cid = s.careerId ?? 'unknown';
      const sem = s.semester ?? 1;
      if (!careerMap.has(cid)) careerMap.set(cid, new Map());
      const semMap = careerMap.get(cid)!;
      if (!semMap.has(sem)) semMap.set(sem, []);
      const semList = semMap.get(sem)!;
      if (!semList.find((sg) => sg.subject.id === s.id)) {
        semList.push({ subject: s, assignments: [] });
      }
    }
    for (const a of filteredAssignments) {
      const cid = a.subject?.careerId ?? 'unknown';
      const sem = a.semester ?? 1;
      if (!careerMap.has(cid)) continue;
      const semMap = careerMap.get(cid)!;
      if (!semMap.has(sem)) continue;
      const semList = semMap.get(sem)!;
      const entry = semList.find((sg) => sg.subject.id === a.subjectId);
      if (entry && !entry.assignments.find((as) => as.id === a.id)) {
        entry.assignments.push(a);
      }
    }
    return Array.from(careerMap.entries()).map(([careerId, semMap]) => ({
      careerId,
      career: careers.find((c) => c.id === careerId),
      semesters: Array.from(semMap.entries()).sort(([a], [b]) => a - b),
    }));
  }, [subjects, filteredAssignments, careers, filterCareer]);

  const matrixData = useMemo(() => {
    const semesters = [1, 2, 3, 4, 5, 6];
    const rows: { subject: Subject; semester: number; assignments: SubjectAssignment[] }[] = [];
    const filtered = subjects.filter((s) => !filterCareer || s.careerId === filterCareer);
    for (const s of filtered) {
      const sem = s.semester ?? 1;
      const semAssignments = periodAssignments.filter((a) => a.subjectId === s.id);
      rows.push({ subject: s, semester: sem, assignments: semAssignments });
    }
    return { semesters, rows };
  }, [subjects, periodAssignments, filterCareer]);

  const stats = useMemo(() => {
    const total = periodAssignments.length;
    const withTeacher = periodAssignments.filter((a) => a.employeeId).length;
    const withoutTeacher = total - withTeacher;
    const uniqueSubjects = new Set(periodAssignments.map((a) => a.subjectId)).size;
    const uniqueTeachers = new Set(periodAssignments.map((a) => a.employeeId).filter(Boolean)).size;
    return { total, withTeacher, withoutTeacher, uniqueSubjects, uniqueTeachers };
  }, [periodAssignments]);

  const selectedSubject = subjects.find((s) => s.id === form.subjectId);

  if (loading) return <LoadingState />;

  return (
    <div>
      <PageHeader
        title="Designación de Materias"
        subtitle="Asignar docentes por paralelo y turno"
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-outline" onClick={() => setParallelModalOpen(true)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
              Paralelos
            </button>
            <button className="btn btn-primary" onClick={() => openCreate()}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Nueva Designación
            </button>
          </div>
        }
      />

      {error && <ErrorState message={error} />}

      <div style={{ display: 'flex', gap: 6, background: 'var(--bg)', padding: '4px', borderRadius: 10, border: '1px solid var(--border)', width: 'fit-content', marginBottom: 24 }}>
        {periods.map((p) => {
          const dot = p.status === 'OPEN' ? 'var(--success)' : p.status === 'PLANNED' ? 'var(--primary)' : 'var(--text-muted)';
          return (
            <button
              key={p.id}
              onClick={() => setSelectedPeriodId(p.id)}
              style={{
                padding: '8px 16px', borderRadius: 8, border: 'none',
                fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
                background: selectedPeriodId === p.id ? '#fff' : 'transparent',
                color: selectedPeriodId === p.id ? 'var(--primary)' : 'var(--text-muted)',
                boxShadow: selectedPeriodId === p.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: selectedPeriodId === p.id ? 'var(--primary)' : dot, flexShrink: 0 }} />
              {p.periodName}
            </button>
          );
        })}
      </div>

      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card" style={{ borderLeft: '4px solid var(--primary)' }}>
          <div className="stat-label">Total designaciones</div>
          <div className="stat-value" style={{ color: 'var(--primary)' }}>{stats.total}</div>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid var(--success)' }}>
          <div className="stat-label">Con docente asignado</div>
          <div className="stat-value" style={{ color: 'var(--success)' }}>{stats.withTeacher}</div>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid var(--danger)' }}>
          <div className="stat-label">Sin docente</div>
          <div className="stat-value" style={{ color: 'var(--danger)' }}>{stats.withoutTeacher}</div>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid var(--purple)' }}>
          <div className="stat-label">Docentes activos</div>
          <div className="stat-value" style={{ color: 'var(--purple)' }}>{stats.uniqueTeachers}</div>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid var(--warning)' }}>
          <div className="stat-label">Materias con paralelo</div>
          <div className="stat-value" style={{ color: 'var(--warning)' }}>{stats.uniqueSubjects}</div>
        </div>
      </div>

      <div className="card" style={{ padding: '14px 20px', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-muted)' }}>Filtros:</span>
          <select className="select" style={{ width: 180 }} value={filterCareer} onChange={(e) => setFilterCareer(e.target.value)}>
            <option value="">Todas las carreras</option>
            {careers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select className="select" style={{ width: 200 }} value={filterTeacher} onChange={(e) => setFilterTeacher(e.target.value)}>
            <option value="">Todos los docentes</option>
            {teachers.map((t) => <option key={t.id} value={t.id}>{personName(t.persona)}</option>)}
          </select>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, fontWeight: 500, color: onlyWithoutTeacher ? 'var(--danger)' : 'var(--text-muted)' }}>
            <input type="checkbox" checked={onlyWithoutTeacher} onChange={(e) => setOnlyWithoutTeacher(e.target.checked)} />
            Solo sin docente
          </label>
          {(filterCareer || filterTeacher || onlyWithoutTeacher) && (
            <button className="btn btn-outline btn-sm" onClick={() => { setFilterCareer(''); setFilterTeacher(''); setOnlyWithoutTeacher(false); }}>
              Limpiar
            </button>
          )}
        </div>
      </div>

      {!selectedPeriodId && (
        <div className="card" style={{ textAlign: 'center', padding: '60px 40px' }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 16px' }}>
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <h3 style={{ marginBottom: 8, fontWeight: 700 }}>Selecciona un periodo académico</h3>
          <p className="text-muted">Elige el periodo arriba para ver sus designaciones.</p>
        </div>
      )}

      {selectedPeriodId && filteredAssignments.length === 0 && subjects.length > 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '60px 40px' }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 16px' }}>
            <path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
          <h3 style={{ marginBottom: 8, fontWeight: 700 }}>Sin designaciones en este periodo</h3>
          <p className="text-muted">Crea la primera designación de materia para este periodo.</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => openCreate()}>
            Crear primera designación
          </button>
        </div>
      )}

      {selectedPeriodId && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {allSubjectsWithAssignments.map(({ careerId, career }) => {
            const careerSubjects = subjects.filter((s) => s.careerId === careerId);
            const maxSubjectsInSem = Math.max(...matrixData.semesters.map((sem) => careerSubjects.filter((s) => s.semester === sem).length), 1);
            return (
              <div key={careerId} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{
                  padding: '12px 20px',
                  background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>
                      {career?.name ?? 'Sin carrera'} ({career?.code ?? '—'})
                    </div>
                    <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.5)' }}>
                      {career?.durationYears ?? 0} años · {careerSubjects.length} materias · {periods.find((p) => p.id === selectedPeriodId)?.periodName ?? '—'}
                    </div>
                  </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse', fontSize: 12 }}>
                    <colgroup>
                      <col style={{ width: 70 }} />
                      {matrixData.semesters.map((sem) => (
                        <col key={sem} style={{ width: `${100 / matrixData.semesters.length}%` }} />
                      ))}
                    </colgroup>
                    <thead>
                      <tr style={{ background: 'var(--bg)', borderBottom: '2px solid var(--border)' }}>
                        <th style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 700, color: 'var(--text-muted)' }}>
                          Sem
                        </th>
                        {matrixData.semesters.map((sem) => (
                          <th key={sem} style={{ padding: '10px 6px', textAlign: 'center', fontWeight: 700, color: 'var(--primary)' }}>
                            {sem}º Sem
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from({ length: maxSubjectsInSem }).map((_, rowIdx) => (
                        <tr key={rowIdx} style={{ borderBottom: rowIdx < maxSubjectsInSem - 1 ? '1px solid var(--border)' : 'none' }}>
                          <td style={{ padding: '8px 8px', background: 'var(--bg)', borderRight: '1px solid var(--border)' }} />
                          {matrixData.semesters.map((sem) => {
                            const semSubjects = careerSubjects.filter((s) => s.semester === sem);
                            const subject = semSubjects[rowIdx];
                            if (!subject) {
                              return <td key={sem} style={{ padding: '8px 6px', background: 'var(--bg)', opacity: 0.3 }} />;
                            }
                            const sAssignments = periodAssignments.filter((a) => a.subjectId === subject.id);
                            const assignmentByParallelId = (parallelId: string) => sAssignments.find((a) => a.parallelId === parallelId);
                            return (
                              <td
                                key={sem}
                                style={{ padding: '8px 6px', verticalAlign: 'top' }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                                  <span style={{
                                    width: 20, height: 20, borderRadius: 3,
                                    background: 'var(--primary-soft)', color: 'var(--primary)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontWeight: 800, fontSize: 8, flexShrink: 0,
                                  }}>
                                    {subject.code?.slice(0, 2) ?? '—'}
                                  </span>
                                  <span style={{ fontWeight: 600, fontSize: 11, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {subject.name}
                                  </span>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingLeft: 24 }}>
                                  {parallels.length === 0 ? (
                                    <span style={{ fontSize: 10, color: 'var(--warning)', fontStyle: 'italic' }}>
                                      Sin paralelos configurados
                                    </span>
                                  ) : (
                                    parallels.map((p) => {
                                      const assignment = assignmentByParallelId(p.id);
                                      const teacher = assignment?.employee;
                                      const hasAssignment = !!assignment;
                                      const shiftColor = SHIFT_COLORS[p.shift] || 'var(--primary)';
                                      return (
                                        <div
                                          key={p.id}
                                          onClick={() => hasAssignment ? openEdit(assignment) : openCreate(subject.id, p.id)}
                                          style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 6,
                                            padding: '3px 6px',
                                            borderRadius: 4,
                                            background: hasAssignment ? (teacher ? `${shiftColor}10` : 'var(--danger-soft)') : 'var(--bg)',
                                            border: `1px solid ${hasAssignment ? (teacher ? shiftColor : 'var(--danger)') : 'var(--border)'}`,
                                            cursor: 'pointer',
                                            fontSize: 10,
                                          }}
                                        >
                                          <span style={{
                                            fontWeight: 800,
                                            color: hasAssignment ? shiftColor : 'var(--text-muted)',
                                            width: 12,
                                          }}>
                                            {p.code}
                                          </span>
                                          <span style={{ fontSize: 8, color: 'var(--text-muted)', marginLeft: -2 }}>
                                            {SHIFT_LABELS[p.shift]?.slice(0, 3)}
                                          </span>
                                          {teacher ? (
                                            <span style={{ color: 'var(--text)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                                              {personName(teacher.persona)}
                                            </span>
                                          ) : (
                                            <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', flex: 1 }}>
                                              {hasAssignment ? 'Sin docente' : '+ Asignar'}
                                            </span>
                                          )}
                                        </div>
                                      );
                                    })
                                  )}
                                </div>
                              </td>
                            );
                          })}
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

      <Modal
        open={modalOpen}
        title={editingId ? 'Editar designación' : 'Nueva designación'}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            {editingId && (
              <button
                className="btn btn-outline btn-sm"
                style={{ color: 'var(--danger)', marginRight: 'auto' }}
                onClick={async () => {
                  if (!window.confirm('¿Eliminar esta designación?')) return;
                  try {
                    await apiPost(`/subject-assignments/${editingId}/delete`, {});
                    setModalOpen(false);
                    await load();
                  } catch (err) {
                    setError(extractError(err));
                  }
                }}
              >
                Eliminar
              </button>
            )}
            <button className="btn btn-outline" onClick={() => setModalOpen(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={submit} disabled={saving || !form.subjectId || !form.academicPeriodId}>
              {saving ? 'Guardando…' : editingId ? 'Actualizar' : 'Crear'}
            </button>
          </>
        }
      >
        <div className="form-grid">
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Materia</label>
            <select className="select" value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })}>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.code} — {s.name} ({s.career?.name ?? '—'})</option>)}
            </select>
            {selectedSubject && (
              <div style={{ marginTop: 6, fontSize: 12, color: 'var(--text-muted)' }}>
                Semestre: <strong>{selectedSubject.semester}º</strong> · {selectedSubject.weeklyHours}h/semana
              </div>
            )}
          </div>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Periodo académico</label>
            <select className="select" value={form.academicPeriodId} onChange={(e) => setForm({ ...form, academicPeriodId: e.target.value })}>
              {periods.map((p) => <option key={p.id} value={p.id}>{p.periodName}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Paralelo / Turno</label>
            <select
              className="select"
              value={form.parallelId}
              onChange={(e) => setForm({ ...form, parallelId: e.target.value })}
            >
              <option value="">— Seleccionar paralelo —</option>
              {parallels.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} — {SHIFT_LABELS[p.shift]} ({p.shift})
                </option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Docente</label>
            <select className="select" value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })}>
              <option value="">— Sin docente —</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {personName(t.persona)} {t.employeeCode ? `(${t.employeeCode})` : ''}
                </option>
              ))}
            </select>
            {form.employeeId && (() => {
              const t = teachers.find((x) => x.id === form.employeeId);
              return t ? (
                <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'var(--success-soft)', borderRadius: 8 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--success)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13 }}>
                    {initialsOf(t.persona)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{personName(t.persona)}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{t.position ?? t.employeeType}</div>
                  </div>
                </div>
              ) : null;
            })()}
          </div>
        </div>
      </Modal>

      <Modal
        open={parallelModalOpen}
        title="Gestionar Paralelos / Turnos"
        onClose={() => setParallelModalOpen(false)}
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setParallelModalOpen(false)}>Cerrar</button>
          </>
        }
      >
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h4 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
              Paralelos del Periodo
            </h4>
            <button className="btn btn-primary btn-sm" onClick={openParallelCreate}>
              + Nuevo Paralelo
            </button>
          </div>

          {parallels.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', background: 'var(--bg)', borderRadius: 8, border: '1px dashed var(--border)' }}>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 12 }}>
                No hay paralelos configurados. Crea al menos uno.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {parallels.map((p) => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--bg)', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{
                      width: 32, height: 32, borderRadius: 6,
                      background: `${SHIFT_COLORS[p.shift]}20`,
                      color: SHIFT_COLORS[p.shift],
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 800, fontSize: 14,
                    }}>
                      {p.code}
                    </span>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 12 }}>{SHIFT_LABELS[p.shift]}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{p.shift}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button
                      className="btn btn-soft btn-sm"
                      onClick={() => openParallelEdit(p)}
                      style={{ padding: '4px 8px' }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => removeParallel(p)}
                      style={{ padding: '4px 8px', color: 'var(--danger)' }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {showParallelForm && (
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
              {editingParallelId ? 'Editar Paralelo' : 'Nuevo Paralelo'}
            </h4>
            <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>Código</label>
                <input
                  className="form-control"
                  value={parallelForm.code}
                  maxLength={5}
                  onChange={(e) => setParallelForm({ ...parallelForm, code: e.target.value.toUpperCase() })}
                  placeholder="Ej: A, B, C..."
                  style={{ textTransform: 'uppercase' }}
                />
              </div>
              <div style={{ flex: 2 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>Turno</label>
                <select
                  className="select"
                  value={parallelForm.shift}
                  onChange={(e) => setParallelForm({ ...parallelForm, shift: e.target.value as 'MANANA' | 'TARDE' | 'NOCHE' })}
                  style={{ width: '100%' }}
                >
                  <option value="MANANA">Mañana</option>
                  <option value="TARDE">Tarde</option>
                  <option value="NOCHE">Noche</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-outline" onClick={() => { setParallelForm({ code: '', shift: 'MANANA' }); setEditingParallelId(null); setShowParallelForm(false); }}>
                Cancelar
              </button>
              <button className="btn btn-primary" onClick={submitParallel} disabled={saving || !parallelForm.code}>
                {saving ? 'Guardando…' : editingParallelId ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
