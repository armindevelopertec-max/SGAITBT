'use client';

import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { apiGet, apiPost, extractError } from '@/lib/api';
import { Student, AcademicPeriod, Institution, Enrollment, SubjectAssignment, Subject, AcademicHistoryRecord, Employee, Parallel } from '@/lib/types';
import { PageHeader } from '@/components/ui/page-header';
import { LoadingState, ErrorState } from '@/components/ui/state';
import { Modal } from '@/components/ui/modal';
import { captureElementToPdf } from '@/lib/pdf-utils';
import { initialsOf, fullName } from '@/lib/utils';
import { useStudentAssignments } from '@/hooks/useStudentAssignments';

export default function StudentSubjectAssignmentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [assignments, setAssignments] = useState<SubjectAssignment[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [periods, setPeriods] = useState<AcademicPeriod[]>([]);
  const [institution, setInstitution] = useState<Institution | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [periodId, setPeriodId] = useState('');
  const [studentId, setStudentId] = useState('');
  const [generating, setGenerating] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  const [selectedParallelId, setSelectedParallelId] = useState<string>('');

  const [previewData, setPreviewData] = useState<{
    assignments: SubjectAssignment[];
    history: AcademicHistoryRecord[];
    credentials?: { username: string };
  } | null>(null);
  const boletaRef = useRef<HTMLDivElement>(null);
  const [previewZoom] = useState(1.3);

  const parallelCache = useRef<Record<string, Parallel[]>>({});
  const historyCache = useRef<Record<string, AcademicHistoryRecord[]>>({});
  const credentialsCache = useRef<Record<string, { username: string }>>({});

  async function load() {
    setLoading(true);
    try {
      const [st, ens, ass, sub, ps, inst] = await Promise.all([
        apiGet<Student[]>('/students'),
        apiGet<Enrollment[]>('/enrollments'),
        apiGet<SubjectAssignment[]>('/subject-assignments'),
        apiGet<Subject[]>('/subjects'),
        apiGet<AcademicPeriod[]>('/academic-periods'),
        apiGet<Institution[]>('/institutions'),
      ]);
      setStudents(st);
      setEnrollments(ens);
      setAssignments(ass);
      setSubjects(sub);
      setPeriods(ps);
      setInstitution(inst[0]);
      setPeriodId((prev) => prev || selectedPeriodId(ps));
    } catch (err) {
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  }

  function selectedPeriodId(ps: AcademicPeriod[]): string {
    const open = ps.find((p) => p.status === 'OPEN');
    return (open ?? ps[0])?.id ?? '';
  }

  const getParallels = useCallback(async (pid: string): Promise<Parallel[]> => {
    if (parallelCache.current[pid]) return parallelCache.current[pid];
    try {
      const data = await apiGet<Parallel[]>(`/parallels?academicPeriodId=${pid}`);
      parallelCache.current[pid] = data;
      return data;
    } catch {
      return [];
    }
  }, []);

  const getStudentHistory = useCallback(async (sid: string): Promise<AcademicHistoryRecord[]> => {
    if (historyCache.current[sid]) return historyCache.current[sid];
    try {
      const data = await apiGet<AcademicHistoryRecord[]>(`/academic-history/student/${sid}`);
      historyCache.current[sid] = data;
      return data;
    } catch {
      return [];
    }
  }, []);

  const getStudentCredentials = useCallback(async (sid: string): Promise<{ username: string } | undefined> => {
    if (credentialsCache.current[sid]) return credentialsCache.current[sid];
    try {
      const data = await apiGet<{ username: string }>(`/users/student/${sid}`);
      credentialsCache.current[sid] = data;
      return data;
    } catch {
      return undefined;
    }
  }, []);

  const [parallels, setParalells] = useState<Parallel[]>([]);
  const [studentHistory, setStudentHistory] = useState<AcademicHistoryRecord[]>([]);

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    setStudentId('');
    setSelectedSubjectIds([]);
    setShowAssignModal(false);
    setStudentHistory([]);
    setPreviewData(null);
  }, [periodId]);

  useEffect(() => {
    if (periodId) {
      getParallels(periodId).then(setParalells).catch(() => setParalells([]));
    } else {
      setParalells([]);
    }
  }, [periodId, getParallels]);

  useEffect(() => {
    if (!showAssignModal) {
      setSelectedParallelId('');
      setSelectedSubjectIds([]);
    }
  }, [showAssignModal]);

  const student = useMemo(() => students.find((s) => s.id === studentId) ?? null, [students, studentId]);

  const enrolledStudentIds = useMemo(
    () =>
      new Set(
        enrollments
          .filter((e) => e.academicPeriodId === periodId)
          .map((e) => e.studentId),
      ),
    [enrollments, periodId],
  );

  const periodAssignments = useMemo(
    () => assignments.filter((a) => a.academicPeriodId === periodId),
    [assignments, periodId],
  );

  const studentAssignments = useMemo(
    () =>
      student
        ? periodAssignments.filter((a) =>
            a.enrollments?.some(
              (e) => e.studentId === student.id && e.academicPeriodId === periodId,
            ),
          )
        : [],
    [student, periodAssignments, periodId],
  );

  const studentCareerSubjects = useMemo(
    () => (student?.careerId ? subjects.filter((s) => s.careerId === student.careerId) : []),
    [student, subjects],
  );

  useStudentAssignments(assignments, studentId, periodId, studentHistory);

  const { semesterSubjects, previousSubjects, targetSemester } = useMemo(() => {
    if (!student) return { semesterSubjects: [] as Subject[], previousSubjects: [] as Subject[], targetSemester: 1 };
    const ts = student.currentLevel || 1;
    const failedSubjectIds = new Set(
      studentHistory.filter((h) => h.status === 'FAILED').map((h) => h.subjectId),
    );
    return {
      targetSemester: ts,
      semesterSubjects: studentCareerSubjects.filter((s) => s.semester === ts),
      previousSubjects: studentCareerSubjects.filter((s) => s.semester < ts && failedSubjectIds.has(s.id)),
    };
  }, [student, studentCareerSubjects, studentHistory]);

  const eligibleStudents = useMemo(
    () => students.filter((s) => enrolledStudentIds.has(s.id)),
    [students, enrolledStudentIds],
  );

  const selectedPeriod = useMemo(
    () => periods.find((p) => p.id === periodId) ?? null,
    [periods, periodId],
  );

  async function openAssignModal() {
    if (!student) return;
    setShowAssignModal(true);
    const history = await getStudentHistory(student.id);
    setStudentHistory(history);
    if (periodId) {
      const parallelData = await getParallels(periodId);
      setParalells(parallelData);
    }
  }

  async function assignSelectedSubjects() {
    if (!student || !institution || selectedSubjectIds.length === 0 || !selectedParallelId) return;
    setAssigning(true);
    try {
      const teachers = await apiGet<Employee[]>(`/employees?employeeType=DOCENTE`);
      const selectedParallel = parallels.find((p) => p.id === selectedParallelId);
      const currentPeriodAssignments = [...periodAssignments];

      for (const subjectId of selectedSubjectIds) {
        const subject = subjects.find((s) => s.id === subjectId);
        if (!subject) continue;

        let assignment = currentPeriodAssignments.find(
          (a) => a.subjectId === subjectId && a.parallelEntity?.id === selectedParallelId,
        );

        if (!assignment) {
          const teacher = teachers[0];
          if (!teacher) {
            setError(`No hay docentes disponibles para crear la designación de ${subject.name}`);
            continue;
          }

          const created = await apiPost<SubjectAssignment>('/subject-assignments', {
            subjectId: subject.id,
            academicPeriodId: periodId,
            employeeId: teacher.id,
            parallelId: selectedParallelId,
            parallel: selectedParallel?.code ?? 'A',
          });

          assignment = created;
          currentPeriodAssignments.push(assignment);
        }

        const alreadyEnrolled = assignment.enrollments?.some((e) => e.studentId === student.id);
        if (!alreadyEnrolled) {
          await apiPost(`/subject-assignments/${assignment.id}/enroll-student`, {
            studentId: student.id,
          });
        }
      }

      setShowAssignModal(false);
      setSelectedSubjectIds([]);
      setSelectedParallelId('');
      await load();

      const academicHistory = await getStudentHistory(student.id);
      const historyApprovedIds = new Set(
        academicHistory.filter((h) => h.status === 'APPROVED').map((h) => h.subjectId),
      );
      const updatedAssignments = currentPeriodAssignments
        .filter((a) => a.enrollments?.some((e) => e.studentId === student.id && e.academicPeriodId === periodId))
        .filter((a) => !historyApprovedIds.has(a.subjectId))
        .filter((a, idx, self) => idx === self.findIndex((t) => t.subjectId === a.subjectId));

      setPreviewData({
        assignments: updatedAssignments.length > 0 ? updatedAssignments : studentAssignments,
        history: academicHistory,
      });
    } catch (err) {
      setError(extractError(err));
    } finally {
      setAssigning(false);
    }
  }

  async function generateAndPrint() {
    if (!student || !institution) return;
    setGenerating(true);
    try {
      const [academicHistory, credentials] = await Promise.all([
        getStudentHistory(student.id),
        getStudentCredentials(student.id),
      ]);

      const approvedIds = new Set(
        academicHistory.filter((h) => h.status === 'APPROVED').map((h) => h.subjectId),
      );
      const newAssignments = studentAssignments.filter((a) => !approvedIds.has(a.subjectId));

      setPreviewData({ assignments: newAssignments, history: academicHistory, credentials });

      await new Promise((r) => setTimeout(r, 100));

      const el = boletaRef.current;
      if (el) {
        await captureElementToPdf(el, `Boleta-Asignacion-${student.studentCode}.pdf`);
      }
    } catch (err) {
      setError(extractError(err));
    } finally {
      setGenerating(false);
    }
  }

  async function previewAssignment() {
    if (!student || !institution) return;
    setGenerating(true);
    try {
      const [academicHistory, credentials] = await Promise.all([
        getStudentHistory(student.id),
        getStudentCredentials(student.id),
      ]);

      const approvedIds = new Set(
        academicHistory.filter((h) => h.status === 'APPROVED').map((h) => h.subjectId),
      );
      const newAssignments = studentAssignments.filter((a) => !approvedIds.has(a.subjectId));

      setPreviewData({ assignments: newAssignments, history: academicHistory, credentials });
    } catch (err) {
      setError(extractError(err));
    } finally {
      setGenerating(false);
    }
  }

  async function downloadPreviewPdf() {
    const el = boletaRef.current;
    if (!el || !student) return;
    try {
      await captureElementToPdf(el, `Boleta-Asignacion-${student.studentCode}.pdf`);
    } catch (err) {
      setError(extractError(err));
    }
  }

  async function selectStudent(id: string) {
    setStudentId(id);
    const s = students.find((st) => st.id === id);
    if (s) {
      const history = await getStudentHistory(s.id);
      setStudentHistory(history);
    }
  }

  function toggleSubject(subjectId: string) {
    setSelectedSubjectIds((prev) =>
      prev.includes(subjectId) ? prev.filter((id) => id !== subjectId) : [...prev, subjectId],
    );
  }

  if (loading) return <LoadingState />;

  return (
    <div>
      <PageHeader
        title="Boleta de Asignación de Materias"
        subtitle="Asignar materias habilitadas según semestre e historial académico, luego generar boleta"
        actions={
          <>
            <button
              className="btn btn-outline"
              onClick={previewAssignment}
              disabled={!student || generating}
            >
              Previsualizar
            </button>
            <button
              className="btn btn-primary"
              onClick={generateAndPrint}
              disabled={!student || generating}
            >
              {generating ? 'Generando…' : 'Generar PDF Boleta'}
            </button>
            <button
              className="btn btn-outline"
              onClick={() => window.print()}
              disabled={!student}
            >
              Imprimir
            </button>
          </>
        }
      />

      {error && <ErrorState message={error} />}

      <div className="card card-pad mb-3">
        <div className="flex gap-2 items-center" style={{ flexWrap: 'wrap' }}>
          {[
            { n: 1, label: 'Gestión', done: !!periodId },
            { n: 2, label: 'Estudiante', done: !!student },
            { n: 3, label: 'Asignar', done: studentAssignments.length > 0 },
            { n: 4, label: 'Boleta', done: !!student },
          ].map((s, i, arr) => (
            <span key={s.n} className="flex gap-2 items-center">
              <span
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: '50%',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: 13,
                  background: s.done ? 'var(--success)' : 'var(--primary-soft)',
                  color: s.done ? '#fff' : 'var(--primary)',
                }}
              >
                {s.done ? '✓' : s.n}
              </span>
              <span className="text-sm" style={{ fontWeight: 600 }}>
                {s.label}
              </span>
              {i < arr.length - 1 && (
                <span style={{ width: 24, height: 2, background: 'var(--border)', borderRadius: 2 }} />
              )}
            </span>
          ))}
        </div>
      </div>

      <div
        className="mb-3"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}
      >
        <div className="stat-card">
          <div className="stat-value">{enrolledStudentIds.size}</div>
          <div className="stat-label">Matriculados en gestión</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{studentAssignments.length}</div>
          <div className="stat-label">Materias asignadas</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{selectedPeriod?.periodName ?? '—'}</div>
          <div className="stat-label">Gestión seleccionada</div>
        </div>
      </div>

      <div className="card card-pad mb-3">
        <div className="form-label" style={{ marginBottom: 8 }}>
          Gestión académica
        </div>
        <div className="flex gap-2 mb-3" style={{ flexWrap: 'wrap' }}>
          {periods.map((p) => {
            const dot =
              p.status === 'OPEN'
                ? 'var(--success)'
                : p.status === 'PLANNED'
                  ? 'var(--primary)'
                  : 'var(--text-muted)';
            return (
              <button
                key={p.id}
                className={`btn btn-sm ${periodId === p.id ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setPeriodId(p.id)}
                title={`${p.startDate ?? ''} al ${p.endDate ?? ''}`}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: periodId === p.id ? '#fff' : dot,
                  }}
                />
                {p.periodName}
                <span style={{ fontWeight: 400, opacity: 0.85, fontSize: 12 }}>
                  {p.status === 'OPEN' ? 'Abierta' : p.status === 'PLANNED' ? 'Planificada' : 'Cerrada'}
                </span>
              </button>
            );
          })}
        </div>

        <div className="form-label" style={{ marginBottom: 8 }}>
          Estudiante matriculado
        </div>
        {student ? (
          <div
            className="card card-pad"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'var(--primary-soft)',
              border: 'none',
              padding: '8px 12px',
              gap: 8,
              flexWrap: 'wrap',
            }}
          >
            <div className="flex items-center" style={{ gap: 10 }}>
              {student.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={student.photoUrl}
                  alt=""
                  style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }}
                />
              ) : (
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    background: 'var(--primary)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: 15,
                  }}
                >
                  {initialsOf(student.firstName, student.lastName)}
                </div>
              )}
              <div>
                <strong style={{ fontSize: 14 }}>
                  {student.studentCode} — {fullName(student)}
                </strong>
                <div className="text-muted text-sm">
                  CI {student.ci} · {student.currentLevel}º semestre ·{' '}
                  {student.career?.name ?? '—'}
                </div>
              </div>
            </div>
            <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
              <button
                className="btn btn-primary btn-sm"
                onClick={openAssignModal}
                disabled={!student || !periodId || assigning}
              >
                {assigning ? 'Asignando…' : 'Asignar materias'}
              </button>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => {
                  setStudentId('');
                }}
              >
                Cambiar
              </button>
            </div>
          </div>
        ) : (
          <>
            <input
              className="form-control"
              placeholder="Seleccione una gestión para ver estudiantes matriculados"
              disabled
              style={{ maxWidth: 360, marginBottom: 8 }}
            />
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                marginTop: 6,
                maxHeight: 240,
                overflowY: 'auto',
              }}
            >
              {eligibleStudents.slice(0, 10).map((s) => (
                <button
                  key={s.id}
                  className="btn btn-outline btn-sm"
                  style={{ justifyContent: 'flex-start', textAlign: 'left' }}
                  onClick={() => selectStudent(s.id)}
                >
                  {s.studentCode} — {fullName(s)} · CI {s.ci} · {s.currentLevel}º semestre ·{' '}
                  {s.career?.name ?? '—'}
                </button>
              ))}
              {eligibleStudents.length === 0 && (
                <span className="text-muted text-sm">
                  Sin estudiantes matriculados en esta gestión.
                </span>
              )}
              {eligibleStudents.length > 10 && (
                <span className="text-muted text-sm">
                  Mostrando 10 de {eligibleStudents.length} estudiantes.
                </span>
              )}
            </div>
          </>
        )}

        {student && (
          <div className="flex gap-3 items-center mt-3" style={{ flexWrap: 'wrap' }}>
            <span className="text-muted text-sm">
              Semestre actual: <strong>{student.currentLevel ?? 1}º</strong>
            </span>
            <span className="text-muted text-sm">
              Carrera: <strong>{student.career?.name ?? '—'}</strong>
            </span>
            <span className="text-muted text-sm">
              Materias del plan: <strong>{studentCareerSubjects.length}</strong>
            </span>
            <span className="text-muted text-sm">
              Materias asignadas: <strong>{studentAssignments.length}</strong>
            </span>
            <span className="text-muted text-sm">
              Matrícula: <strong>{student.studentCode}</strong>
            </span>
          </div>
        )}
      </div>

      {student && studentAssignments.length > 0 && (
        <div
          className="card card-pad mb-3"
          style={{ background: 'var(--success-soft)', borderColor: 'var(--success)' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 20 }}>✅</span>
            <div>
              <strong>Estudiante con materias asignadas</strong>
              <div className="text-sm text-muted">
                {studentAssignments.length} materia(s) en {selectedPeriod?.periodName} — lista para
                generar boleta
              </div>
            </div>
          </div>
        </div>
      )}

      {student && studentAssignments.length === 0 && studentCareerSubjects.length > 0 && (
        <div
          className="card card-pad mb-3"
          style={{ background: 'var(--warning-soft)', borderColor: 'var(--warning)' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 20 }}>⚠️</span>
            <div>
              <strong>Sin materias asignadas</strong>
              <div className="text-sm text-muted">
                El estudiante está matriculado en {student.career?.name} ({student.currentLevel}º
                semestre). Pulse <strong>Asignar materias</strong> para asignar según su historial.
              </div>
            </div>
          </div>
        </div>
      )}

      {student && previewData && (
        <div className="card mb-3" style={{ background: '#fff', padding: 24 }}>
          <div className="flex justify-between items-center mb-3">
            <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>Vista previa de Boleta</h3>
            <div className="flex gap-2">
              <button className="btn btn-primary btn-sm" onClick={downloadPreviewPdf}>
                Descargar PDF
              </button>
              <button className="btn btn-outline btn-sm" onClick={() => setPreviewData(null)}>
                Cerrar
              </button>
            </div>
          </div>
          <div style={{ overflow: 'auto', maxHeight: '75vh', display: 'flex', justifyContent: 'center' }}>
            <div
              ref={boletaRef}
              style={{
                background: '#fff',
                width: 210 * previewZoom + 'mm',
                padding: '20px 25px',
                fontFamily: 'Arial, Helvetica, sans-serif',
                fontSize: 9 * previewZoom + 'px',
                color: '#141414',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                border: '1px solid #ddd',
              }}
            >
              <div style={{ textAlign: 'center', marginBottom: 8 }}>
                <div
                  style={{
                    fontSize: 11.5 * previewZoom,
                    fontWeight: 'bold',
                    color: '#14213d',
                    marginBottom: 2,
                  }}
                >
                  {institution?.name?.toUpperCase() ||
                    'INSTITUTO TECNOLÓGICO "BOLIVIANA DE TECNOLOGÍA"'}
                </div>
                <div
                  style={{
                    fontSize: 7 * previewZoom,
                    color: '#5a5a5a',
                  }}
                >
                  Sistema de Gestión Académica ·{' '}
                  {new Date().toLocaleDateString('es-BO', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })}
                </div>
              </div>

              <div style={{ textAlign: 'center', marginBottom: 10 }}>
                <div
                  style={{
                    fontSize: 13.5 * previewZoom,
                    fontWeight: 'bold',
                    color: '#0a0a0a',
                    marginBottom: 4,
                  }}
                >
                  BOLETA DE ASIGNACIÓN {selectedPeriod?.periodName || ''}
                </div>
                <div style={{ fontSize: 8.5 * previewZoom, color: '#505050', marginBottom: 4 }}>
                  SISTEMA DE GESTIÓN ACADÉMICA INSTITUCIONAL – SIGAI
                </div>
                <div
                  style={{
                    fontSize: 8.5 * previewZoom,
                    color: '#5a5a5a',
                    fontWeight: 'bold',
                  }}
                >
                  ORIGINAL PARA ESTUDIANTE
                </div>
              </div>

              <div style={{ marginBottom: 10 }}>
                <div
                  style={{
                    fontSize: 10 * previewZoom,
                    fontWeight: 'bold',
                    color: '#14213d',
                    borderBottom: '1px solid #14213d',
                    paddingBottom: 3,
                    marginBottom: 5,
                  }}
                >
                  DATOS DEL ESTUDIANTE
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '3px 20px',
                    fontSize: 8.5 * previewZoom,
                  }}
                >
                  <div>
                    <span style={{ color: '#5a5a5a' }}>C.I.:</span>{' '}
                    <strong style={{ color: '#141414' }}>{student.ci || '—'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#5a5a5a' }}>FILIAL:</span>{' '}
                    <strong style={{ color: '#141414' }}>Central El Alto</strong>
                  </div>
                  <div>
                    <span style={{ color: '#5a5a5a' }}>APELLIDO PATERNO:</span>{' '}
                    <strong style={{ color: '#141414' }}>{student.paternalSurname || '—'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#5a5a5a' }}>APELLIDO MATERNO:</span>{' '}
                    <strong style={{ color: '#141414' }}>{student.maternalSurname || '—'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#5a5a5a' }}>NOMBRES:</span>{' '}
                    <strong style={{ color: '#141414' }}>{student.firstName || '—'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#5a5a5a' }}>NRO. FOLDER:</span>{' '}
                    <strong style={{ color: '#141414' }}>{student.studentCode || '—'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#5a5a5a' }}>CARRERA:</span>{' '}
                    <strong style={{ color: '#141414' }}>{student.career?.name || '—'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#5a5a5a' }}>GESTIÓN DE INGRESO:</span>{' '}
                    <strong style={{ color: '#141414' }}>
                      {previewData.history && previewData.history.length > 0
                        ? previewData.history[0]?.academicPeriod?.periodName || '—'
                        : '—'}
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: '#5a5a5a' }}>NRO. TIT. BACHILLER:</span>{' '}
                    <strong style={{ color: '#141414' }}>{student.diplomaNumber || '—'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#5a5a5a' }}>PLAN:</span>{' '}
                    <strong style={{ color: '#141414' }}>{student.career?.code || '—'}</strong>
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: 10 }}>
                <div
                  style={{
                    fontSize: 10 * previewZoom,
                    fontWeight: 'bold',
                    color: '#14213d',
                    borderBottom: '1px solid #14213d',
                    paddingBottom: 3,
                    marginBottom: 5,
                  }}
                >
                  DATOS DE ACCESO POR SISTEMA
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '3px 20px',
                    fontSize: 8.5 * previewZoom,
                  }}
                >
                  <div>
                    <span style={{ color: '#5a5a5a' }}>CUENTA:</span>{' '}
                    <strong style={{ color: '#141414' }}>
                      {previewData.credentials?.username || `AUT${student.ci || '—'}`}
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: '#5a5a5a' }}>CONTRASEÑA:</span>{' '}
                    <strong style={{ color: '#141414' }}>Consultar en secretaría</strong>
                  </div>
                </div>
                <div
                  style={{
                    fontSize: 7.5 * previewZoom,
                    color: '#6e6e6e',
                    fontStyle: 'italic',
                    marginTop: 4,
                  }}
                >
                  La contraseña es personal e intransferible. Cámbiela en su primer ingreso al sistema.
                </div>
              </div>

              <div style={{ marginBottom: 10 }}>
                <div
                  style={{
                    fontSize: 10 * previewZoom,
                    fontWeight: 'bold',
                    color: '#14213d',
                    borderBottom: '1px solid #14213d',
                    paddingBottom: 3,
                    marginBottom: 5,
                  }}
                >
                  MATERIAS INSCRITAS
                </div>
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: 8.5 * previewZoom,
                  }}
                >
                  <thead>
                    <tr style={{ background: '#f0f2f6' }}>
                      <th
                        style={{
                          padding: '3px 6px',
                          textAlign: 'center',
                          border: '1px solid #a0a0a0',
                          color: '#14213d',
                          fontWeight: 'bold',
                        }}
                      >
                        N.º
                      </th>
                      <th
                        style={{
                          padding: '3px 6px',
                          textAlign: 'left',
                          border: '1px solid #a0a0a0',
                          color: '#14213d',
                          fontWeight: 'bold',
                        }}
                      >
                        CÓDIGO
                      </th>
                      <th
                        style={{
                          padding: '3px 6px',
                          textAlign: 'left',
                          border: '1px solid #a0a0a0',
                          color: '#14213d',
                          fontWeight: 'bold',
                        }}
                      >
                        MATERIA
                      </th>
                      <th
                        style={{
                          padding: '3px 6px',
                          textAlign: 'center',
                          border: '1px solid #a0a0a0',
                          color: '#14213d',
                          fontWeight: 'bold',
                        }}
                      >
                        SEM
                      </th>
                      <th
                        style={{
                          padding: '3px 6px',
                          textAlign: 'center',
                          border: '1px solid #a0a0a0',
                          color: '#14213d',
                          fontWeight: 'bold',
                        }}
                      >
                        PAR
                      </th>
                      <th
                        style={{
                          padding: '3px 6px',
                          textAlign: 'center',
                          border: '1px solid #a0a0a0',
                          color: '#14213d',
                          fontWeight: 'bold',
                        }}
                      >
                        TUR
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.assignments
                      .sort(
                        (a, b) =>
                          a.semester - b.semester ||
                          (a.subject?.code ?? '').localeCompare(b.subject?.code ?? ''),
                      )
                      .map((a, i) => {
                        const shiftLabel =
                          a.parallelEntity?.shift === 'MANANA'
                            ? 'M'
                            : a.parallelEntity?.shift === 'TARDE'
                              ? 'T'
                              : a.parallelEntity?.shift === 'NOCHE'
                                ? 'N'
                                : '—';
                        return (
                          <tr key={a.id}>
                            <td
                              style={{
                                padding: '2px 6px',
                                textAlign: 'center',
                                border: '1px solid #a0a0a0',
                              }}
                            >
                              {i + 1}
                            </td>
                            <td
                              style={{
                                padding: '2px 6px',
                                border: '1px solid #a0a0a0',
                                fontWeight: 'bold',
                              }}
                            >
                              {a.subject?.code || '—'}
                            </td>
                            <td style={{ padding: '2px 6px', border: '1px solid #a0a0a0' }}>
                              {a.subject?.name || '—'}
                            </td>
                            <td
                              style={{
                                padding: '2px 6px',
                                textAlign: 'center',
                                border: '1px solid #a0a0a0',
                              }}
                            >
                              {a.semester}
                            </td>
                            <td
                              style={{
                                padding: '2px 6px',
                                textAlign: 'center',
                                border: '1px solid #a0a0a0',
                              }}
                            >
                              {a.parallel || 'A'}
                            </td>
                            <td
                              style={{
                                padding: '2px 6px',
                                textAlign: 'center',
                                border: '1px solid #a0a0a0',
                              }}
                            >
                              {shiftLabel}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
                <div style={{ fontSize: 7.5 * previewZoom, color: '#6e6e6e', marginTop: 4 }}>
                  PAR: Paralelo · TUR: Turno
                </div>
              </div>

              <div
                style={{
                  fontSize: 7.5 * previewZoom,
                  color: '#6e6e6e',
                  fontStyle: 'italic',
                  marginBottom: 12,
                }}
              >
                El interesado debe verificar que todos los datos sean correctos antes de firmar. La
                institución no se hará responsable por datos incorrectos para trámites posteriores.
              </div>

              <div
                style={{
                  fontSize: 7 * previewZoom,
                  color: '#464646',
                  marginBottom: 8,
                  borderBottom: '1px solid #5a5a5a',
                  paddingBottom: 4,
                }}
              >
                <strong style={{ color: '#14213d', fontSize: 8 * previewZoom }}>
                  {institution?.name || 'Instituto Tecnológico "Boliviana de Tecnología"'}
                </strong>
                <br />
                <span style={{ color: '#828282' }}>R.M. 1049/2023</span>
                <br />
                Dirección: El Alto, Av. de los Héroes, Z. Ferropetrol N.º 11 · Teléfono: 75252479
              </div>

              <div
                style={{
                  fontSize: 9 * previewZoom,
                  color: '#282828',
                  marginBottom: 15,
                  marginTop: 8,
                }}
              >
                Lugar y fecha: El Alto, ____ de ____________ de {new Date().getFullYear()}.
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: 10 }}>
                <div style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      borderTop: '1px solid #3c3c3c',
                      paddingTop: 5,
                      width: 150,
                      margin: '0 auto',
                      fontSize: 9 * previewZoom,
                    }}
                  >
                    Firma del estudiante
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      borderTop: '1px solid #3c3c3c',
                      paddingTop: 5,
                      width: 150,
                      margin: '0 auto',
                      fontSize: 9 * previewZoom,
                    }}
                  >
                    Sello de la institución
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {!student && (
        <div className="card card-pad">
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            Elige la gestión y selecciona un estudiante matriculado para gestionar su asignación de
            materias.
            <div className="text-muted text-sm mt-2">
              Nota: El formato completo de boleta (con QR, firma, etc.) está disponible en
              <strong>Certificados → Boleta de Asignación</strong>.
            </div>
          </div>
        </div>
      )}

      <Modal
        open={showAssignModal}
        title={
          student
            ? `Asignar materias — ${fullName(student)} (${student.currentLevel ?? 1}º semestre)`
            : 'Asignar materias'
        }
        onClose={() => {
          setShowAssignModal(false);
          setSelectedSubjectIds([]);
          setSelectedParallelId('');
        }}
        footer={
          <>
            <button
              className="btn btn-outline"
              onClick={() => {
                setShowAssignModal(false);
                setSelectedSubjectIds([]);
                setSelectedParallelId('');
              }}
            >
              Cancelar
            </button>
            <button
              className="btn btn-primary"
              onClick={assignSelectedSubjects}
              disabled={selectedSubjectIds.length === 0 || !selectedParallelId || assigning}
            >
              {assigning ? 'Asignando…' : `Asignar ${selectedSubjectIds.length} materia(s)`}
            </button>
          </>
        }
      >
        {student && (
          <>
            <div className="mb-3">
              <div className="text-muted text-sm mb-2">
                Semestre objetivo: <strong>{targetSemester}º</strong> · Carrera:{' '}
                <strong>{student.career?.name ?? '—'}</strong>
              </div>
              <div className="form-label mb-2">Paralelo:</div>
              <select
                className="form-control"
                value={selectedParallelId}
                onChange={(e) => setSelectedParallelId(e.target.value)}
                style={{ maxWidth: 200 }}
              >
                <option value="">Seleccione un paralelo</option>
                {parallels.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} -{' '}
                    {p.shift === 'MANANA'
                      ? 'Mañana'
                      : p.shift === 'TARDE'
                        ? 'Tarde'
                        : 'Noche'}
                  </option>
                ))}
              </select>
            </div>
            {(() => {
              const allSubjects = [...semesterSubjects, ...previousSubjects];
              return (
                <div className="mb-3">
                  <label className="form-label">
                    <input
                      type="checkbox"
                      checked={
                        selectedSubjectIds.length === allSubjects.length && allSubjects.length > 0
                      }
                      onChange={() => {
                        if (selectedSubjectIds.length === allSubjects.length) {
                          setSelectedSubjectIds([]);
                        } else {
                          setSelectedSubjectIds(allSubjects.map((s) => s.id));
                        }
                      }}
                    />
                    Seleccionar todas ({allSubjects.length})
                  </label>
                </div>
              );
            })()}
            {(() => {
              if (!student) return <span className="text-muted">Seleccione un estudiante</span>;

              return (
                <div style={{ maxHeight: '50vh', overflow: 'auto' }}>
                  {semesterSubjects.length > 0 && (
                    <div className="mb-3">
                      <h4
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          marginBottom: 8,
                          color: 'var(--primary)',
                        }}
                      >
                        Materias del semestre actual ({targetSemester}º)
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {semesterSubjects.map((s) => (
                          <label
                            key={s.id}
                            className="flex items-center gap-3 p-2"
                            style={{
                              border: '1px solid var(--border)',
                              borderRadius: 8,
                              cursor: 'pointer',
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={selectedSubjectIds.includes(s.id)}
                              onChange={() => toggleSubject(s.id)}
                            />
                            <span className="font-medium" style={{ minWidth: 80 }}>
                              {s.code}
                            </span>
                            <span style={{ flex: 1 }}>{s.name}</span>
                            <span className="badge badge-primary">{s.semester}º sem</span>
                            <span className="badge badge-soft">{s.weeklyHours}h/sem</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {previousSubjects.length > 0 && (
                    <div className="mb-3">
                      <h4
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          marginBottom: 8,
                          color: 'var(--warning)',
                        }}
                      >
                        Materias de semestres anteriores (posibles retakes)
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {previousSubjects.map((s) => (
                          <label
                            key={s.id}
                            className="flex items-center gap-3 p-2"
                            style={{
                              border: '1px solid var(--border)',
                              borderRadius: 8,
                              cursor: 'pointer',
                              opacity: 0.7,
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={selectedSubjectIds.includes(s.id)}
                              onChange={() => toggleSubject(s.id)}
                            />
                            <span className="font-medium" style={{ minWidth: 80 }}>
                              {s.code}
                            </span>
                            <span style={{ flex: 1 }}>{s.name}</span>
                            <span className="badge badge-soft">{s.semester}º sem</span>
                            <span className="text-muted text-xs">Retake manual</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {semesterSubjects.length === 0 && previousSubjects.length === 0 && (
                    <div className="text-muted text-center py-8">
                      No hay materias en el plan de estudios para esta carrera.
                    </div>
                  )}
                </div>
              );
            })()}
          </>
        )}
      </Modal>
    </div>
  );
}
