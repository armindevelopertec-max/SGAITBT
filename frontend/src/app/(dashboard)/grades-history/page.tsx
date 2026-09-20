'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiGet, extractError } from '@/lib/api';
import { AcademicPeriod, Career, Grade, Parallel, Student, SubjectAssignment, Subject } from '@/lib/types';
import { PageHeader } from '@/components/ui/page-header';
import { LoadingState, ErrorState } from '@/components/ui/state';

type GradeStatus = 'APPROVED' | 'FAILED' | 'PENDING';

export default function GradesHistoryPage() {
  const [periods, setPeriods] = useState<AcademicPeriod[]>([]);
  const [careers, setCareers] = useState<Career[]>([]);
  const [parallels, setParallels] = useState<Parallel[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [assignments, setAssignments] = useState<SubjectAssignment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [periodId, setPeriodId] = useState('');
  const [careerId, setCareerId] = useState('');
  const [parallelId, setParallelId] = useState('');
  const [shift, setShift] = useState('');
  const [semester, setSemester] = useState('');

  async function load() {
    setLoading(true);
    try {
      const [p, c, pa, s, a, st, g] = await Promise.all([
        apiGet<AcademicPeriod[]>('/academic-periods'),
        apiGet<Career[]>('/careers'),
        apiGet<Parallel[]>('/parallels'),
        apiGet<Subject[]>('/subjects'),
        apiGet<SubjectAssignment[]>('/subject-assignments'),
        apiGet<Student[]>('/students'),
        apiGet<Grade[]>('/grades'),
      ]);
      setPeriods(p);
      setCareers(c);
      setParallels(pa);
      setSubjects(s);
      setAssignments(a);
      setStudents(st);
      setGrades(g);
      if (p.length > 0) {
        const open = p.find((x) => x.status === 'OPEN');
        setPeriodId(open?.id ?? p[0].id);
      }
    } catch (err) {
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const selectedPeriod = useMemo(
    () => periods.find((p) => p.id === periodId) ?? null,
    [periods, periodId]
  );

  const filteredAssignments = useMemo(() => {
    return assignments.filter((a) => {
      if (a.academicPeriodId !== periodId) return false;
      if (careerId && a.subject?.careerId !== careerId) return false;
      if (parallelId && a.parallelId !== parallelId) return false;
      if (shift && a.parallelEntity?.shift !== shift) return false;
      if (semester && a.semester.toString() !== semester) return false;
      return true;
    });
  }, [assignments, periodId, careerId, parallelId, shift, semester]);

  const assignmentsWithStats = useMemo(() => {
    return filteredAssignments.map((a) => {
      const gradeRecords = grades.filter((g) => g.assignmentId === a.id);
      const enrolled = (a.enrollments ?? []).length;
      const graded = gradeRecords.length;
      const approved = gradeRecords.filter((g) => g.status === 'APPROVED').length;
      const failed = gradeRecords.filter((g) => g.status === 'FAILED').length;
      const pending = gradeRecords.filter((g) => g.status === 'PENDING').length;

      const avgGrade =
        graded > 0
          ? gradeRecords.reduce((sum, g) => sum + (g.finalGrade ?? 0), 0) / graded
          : 0;

      return {
        ...a,
        enrolled,
        graded,
        approved,
        failed,
        pending,
        avgGrade: Math.round(avgGrade * 10) / 10,
      };
    });
  }, [filteredAssignments, grades]);

  const uniqueSemesters = useMemo(() => {
    const set = new Set<number>();
    filteredAssignments.forEach((a) => set.add(a.semester));
    return Array.from(set).sort((a, b) => a - b);
  }, [filteredAssignments]);

  const uniqueCareers = useMemo(() => {
    const map = new Map<string, Career>();
    filteredAssignments.forEach((a) => {
      if (a.subject?.careerId) map.set(a.subject.careerId, a.subject.career!);
    });
    return Array.from(map.values());
  }, [filteredAssignments]);

  const uniqueParallels = useMemo(() => {
    return parallels.filter((p) => p.academicPeriodId === periodId);
  }, [parallels, periodId]);

  const uniqueShifts = useMemo(() => {
    const set = new Set<string>();
    filteredAssignments.forEach((a) => {
      if (a.parallelEntity?.shift) set.add(a.parallelEntity.shift);
    });
    return Array.from(set);
  }, [filteredAssignments]);

  function getStudentGrades(studentId: string, assignmentId: string) {
    return grades.find((g) => g.studentId === studentId && g.assignmentId === assignmentId);
  }

  if (loading) return <LoadingState />;

  return (
    <div>
      <PageHeader
        title="Historial de Calificaciones"
        subtitle="Ver calificaciones por paralelo, turno y semestre"
      />

      {error && <ErrorState message={error} />}

      <div className="card card-pad mb-3">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          <div className="form-group">
            <label className="form-label">Gestión académica</label>
            <select
              className="form-control"
              value={periodId}
              onChange={(e) => {
                setPeriodId(e.target.value);
                setParallelId('');
                setShift('');
              }}
            >
              <option value="">Todas</option>
              {periods.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.periodName}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Carrera</label>
            <select
              className="form-control"
              value={careerId}
              onChange={(e) => setCareerId(e.target.value)}
            >
              <option value="">Todas</option>
              {uniqueCareers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Paralelo</label>
            <select
              className="form-control"
              value={parallelId}
              onChange={(e) => setParallelId(e.target.value)}
            >
              <option value="">Todos</option>
              {uniqueParallels.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Turno</label>
            <select
              className="form-control"
              value={shift}
              onChange={(e) => setShift(e.target.value)}
            >
              <option value="">Todos</option>
              <option value="MANANA">Mañana</option>
              <option value="TARDE">Tarde</option>
              <option value="NOCHE">Noche</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Semestre</label>
            <select
              className="form-control"
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
            >
              <option value="">Todos</option>
              {uniqueSemesters.map((s) => (
                <option key={s} value={s}>
                  {s}º
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {assignmentsWithStats.length === 0 ? (
        <div className="card card-pad">
          <div className="empty-state">
            <div className="empty-state-icon">📝</div>
            No hay registros de calificaciones para los filtros seleccionados.
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
          {assignmentsWithStats.map((a) => {
            const shiftLabel =
              a.parallelEntity?.shift === 'MANANA'
                ? 'Mañana'
                : a.parallelEntity?.shift === 'TARDE'
                  ? 'Tarde'
                  : a.parallelEntity?.shift === 'NOCHE'
                    ? 'Noche'
                    : '—';
            const statusColor =
              a.graded === a.enrolled
                ? 'var(--success)'
                : a.graded > 0
                  ? 'var(--warning)'
                  : 'var(--text-muted)';
            return (
              <div key={a.id} className="card card-pad">
                <div className="flex justify-between items-center" style={{ marginBottom: 8 }}>
                  <strong style={{ fontSize: 14 }}>{a.subject?.name ?? '—'}</strong>
                  <span className="badge badge-info">{a.parallelEntity?.code ?? '—'}</span>
                </div>
                <div className="text-muted text-sm" style={{ marginBottom: 8 }}>
                  {a.subject?.career?.name ?? '—'} · {a.semester}º semestre · {shiftLabel}
                </div>
                <div className="text-muted text-sm" style={{ marginBottom: 8 }}>
                  {selectedPeriod?.periodName ?? '—'} · {a.enrolled} estudiantes
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: 8,
                    marginTop: 12,
                    padding: 12,
                    background: 'var(--bg-secondary)',
                    borderRadius: 8,
                  }}
                >
                  <div style={{ textAlign: 'center' }}>
                    <div
                      style={{ fontSize: 18, fontWeight: 700, color: statusColor }}
                    >
                      {a.graded}/{a.enrolled}
                    </div>
                    <div className="text-muted text-sm">Calificados</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--success)' }}>
                      {a.approved}
                    </div>
                    <div className="text-muted text-sm">Aprobados</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--danger)' }}>
                      {a.failed}
                    </div>
                    <div className="text-muted text-sm">Reprobados</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 18, fontWeight: 700 }}>{a.avgGrade}</div>
                    <div className="text-muted text-sm">Promedio</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
