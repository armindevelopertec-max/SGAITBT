'use client';

import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { apiGet, apiPost, extractError } from '@/lib/api';
import { Student, AcademicPeriod, Institution, Enrollment, SubjectAssignment, Subject, AcademicHistoryRecord, Employee, Parallel } from '@/lib/types';
import { PageHeader } from '@/components/ui/page-header';
import { LoadingState, ErrorState } from '@/components/ui/state';
import { fullName, initialsOf, fullSurname } from '@/lib/utils';

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
  const [searchQuery, setSearchQuery] = useState('');

  const [previewData, setPreviewData] = useState<{
    assignments: SubjectAssignment[];
    history: AcademicHistoryRecord[];
    credentials?: { username: string; password?: string };
  } | null>(null);
  const boletaRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    setStudentId('');
    setPreviewData(null);
    setSearchQuery('');
  }, [periodId]);

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

  const eligibleStudents = useMemo(
    () => students.filter((s) => enrolledStudentIds.has(s.id)),
    [students, enrolledStudentIds],
  );

  const studentAssignStatus = useMemo(() => {
    const map: Record<string, { assigned: boolean; count: number }> = {};
    for (const s of eligibleStudents) {
      const count = periodAssignments.filter(
        (a) =>
          a.academicPeriodId === periodId &&
          a.enrollments?.some((e) => e.studentId === s.id),
      ).length;
      map[s.id] = { assigned: count > 0, count };
    }
    return map;
  }, [eligibleStudents, periodAssignments, periodId]);

  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return eligibleStudents.slice(0, 5);
    const q = searchQuery.toLowerCase();
    return eligibleStudents.filter(
      (s) =>
        fullName(s.person).toLowerCase().includes(q) ||
        s.person?.ci?.toLowerCase().includes(q) ||
        s.studentCode.toLowerCase().includes(q),
    ).slice(0, 5);
  }, [searchQuery, eligibleStudents]);

  const selectedPeriod = useMemo(
    () => periods.find((p) => p.id === periodId) ?? null,
    [periods, periodId],
  );

  async function selectStudent(id: string) {
    setStudentId(id);
    const s = students.find((st) => st.id === id);
    if (!s) return;

    try {
      const [academicHistory, credentials, entryData] = await Promise.all([
        getStudentHistory(s.id),
        getStudentCredentials(s.id),
        apiGet<{ periodName: string; year: string } | null>(`/students/${s.id}/entry-year`),
      ]);

      const entryYearFormatted = entryData?.periodName || undefined;
      const studentWithEntryYear = { ...s, entryYear: entryYearFormatted };
      setStudents((prev) => prev.map((st) => (st.id === id ? studentWithEntryYear : st)));

      const approvedIds = new Set(
        academicHistory.filter((h) => h.status === 'APPROVED').map((h) => h.subjectId),
      );
      const existingAssignments = periodAssignments.filter(
        (a) =>
          a.enrollments?.some((e) => e.studentId === s.id && e.academicPeriodId === periodId) &&
          !approvedIds.has(a.subjectId),
      );

      if (existingAssignments.length > 0) {
        setPreviewData({ assignments: existingAssignments, history: academicHistory, credentials });
        return;
      }

      const ps = await getParallels(periodId);
      const defaultParallel = ps.find((p) => p.code === 'A') ?? ps[0];
      if (!defaultParallel) {
        setError('No hay paralelos disponibles en esta gestión');
        return;
      }

      const teachers = await apiGet<Employee[]>(`/employees?employeeType=DOCENTE`);
      if (teachers.length === 0) {
        setError('No hay docentes disponibles');
        return;
      }

      const targetSemester = s.currentLevel || 1;
      const careerSubjects = s.careerId ? subjects.filter((sub) => sub.careerId === s.careerId) : [];
      const semesterSubjects = careerSubjects.filter((sub) => sub.semester === targetSemester);
      const failedSubjectIds = new Set(
        academicHistory.filter((h) => h.status === 'FAILED').map((h) => h.subjectId),
      );
      const previousSubjects = careerSubjects.filter((sub) => sub.semester < targetSemester && failedSubjectIds.has(sub.id));

      const allSubjectsToAssign = [...semesterSubjects, ...previousSubjects];

      const passReset = await apiPost<{ username: string; password: string }>(`/users/student/${s.id}/reset-password`);

      for (const subject of allSubjectsToAssign) {
        let assignment = periodAssignments.find(
          (a) => a.subjectId === subject.id && a.parallelId === defaultParallel.id,
        );

        if (!assignment) {
          const created = await apiPost<SubjectAssignment>('/subject-assignments', {
            subjectId: subject.id,
            academicPeriodId: periodId,
            employeeId: teachers[0].id,
            parallelId: defaultParallel.id,
            parallel: defaultParallel.code,
          });
          assignment = created;
        }

        const alreadyEnrolled = assignment.enrollments?.some((e) => e.studentId === s.id);
        if (!alreadyEnrolled) {
          await apiPost(`/subject-assignments/${assignment.id}/enroll-student`, {
            studentId: s.id,
          });
        }
      }

      const [reloadedAss, finalHistory] = await Promise.all([
        apiGet<SubjectAssignment[]>('/subject-assignments'),
        getStudentHistory(s.id),
      ]);
      setAssignments(reloadedAss);

      const finalApprovedIds = new Set(
        finalHistory.filter((h) => h.status === 'APPROVED').map((h) => h.subjectId),
      );
      const finalAssignments = reloadedAss
        .filter((a) => a.academicPeriodId === periodId)
        .filter((a) =>
          a.enrollments?.some((e) => e.studentId === s.id && e.academicPeriodId === periodId),
        )
        .filter((a) => !finalApprovedIds.has(a.subjectId))
        .filter((a, idx, self) => idx === self.findIndex((t) => t.subjectId === a.subjectId));

      setPreviewData({
        assignments: finalAssignments,
        history: finalHistory,
        credentials: passReset,
      });
    } catch (err) {
      setError(extractError(err));
    }
  }

  if (loading) return <LoadingState />;

  return (
    <div>
      <PageHeader
        title="Boleta de Asignación de Materias"
        subtitle="Asignar materias habilitadas según semestre e historial académico"
        actions={
          <button
            className="btn btn-outline"
            onClick={() => window.print()}
            disabled={!student}
          >
            Imprimir
          </button>
        }
      />

      {error && <ErrorState message={error} />}

      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              body * { visibility: hidden; }
              #boleta-document, #boleta-document * { visibility: visible; }
              #boleta-document {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                zoom: 1 !important;
                background: #fff !important;
              }
            }
          `,
        }}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: 16, alignItems: 'stretch', minHeight: 'calc(100vh - 180px)' }}>
        <div className="card" style={{ background: '#fff', padding: 24, display: 'flex', flexDirection: 'column' }}>
          {student && previewData ? (
            <>
              <div className="flex justify-between items-center mb-3">
                <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>Vista previa de Boleta</h3>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => setPreviewData(null)}
                  style={{ padding: '2px 8px', fontSize: 12 }}
                >
                  ✕
                </button>
              </div>
              <div style={{ overflow: 'hidden', maxHeight: '529px', display: 'flex', justifyContent: 'center' }}>
                <div
                  id="boleta-document"
                  ref={boletaRef}
                  style={{
                    background: '#fff',
                    width: '216mm',
                    height: '140mm',
                    maxHeight: '140mm',
                    padding: '10mm 20mm',
                    fontFamily: 'Arial, Helvetica, sans-serif',
                    fontSize: '9px',
                    color: '#333',
                    boxSizing: 'border-box',
                    border: '1px solid #333',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    overflow: 'hidden',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', marginBottom: 8, position: 'relative' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#14213d', marginBottom: 4 }}>
                        BOLETA DE ASIGNACIÓN {selectedPeriod?.periodName || ''}
                      </div>
                      <div style={{ fontSize: '9px', color: '#666', marginBottom: 2 }}>
                        SISTEMA DE GESTIÓN ACADÉMICA INSTITUCIONAL – SIGAI
                      </div>
                      <div style={{ fontSize: '9px', color: '#666', fontWeight: 'bold' }}>
                        ORIGINAL PARA ESTUDIANTE
                      </div>
                    </div>
                    <div style={{ position: 'absolute', right: 0, top: 0, width: '60px', height: '60px' }}>
                      {institution?.logoUrl ? (
                        <img src={institution.logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      ) : (
                        <span style={{ fontSize: '10px', color: '#999' }}>ITBT</span>
                      )}
                    </div>
                  </div>

                  <div style={{ borderBottom: '1px solid #333', marginBottom: 8 }} />

                  <div style={{ display: 'flex', gap: 8 }}>
                    <div style={{ width: '35mm', height: '35mm', border: '1px solid #999', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f8f8', flexShrink: 0 }}>
                      {student.person?.photoUrl ? (
                        <img src={student.person.photoUrl} alt="Foto" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <svg width="30" height="30" viewBox="0 0 24 24" fill="#ccc">
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                        </svg>
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8px' }}>
                        <tbody>
                          <tr>
                            <td style={{ fontWeight: 'bold', color: '#333', padding: '2px 8px 2px 0', width: '35%', borderBottom: '1px solid #ddd' }}>CI:</td>
                            <td style={{ color: '#333', padding: '2px 0', borderBottom: '1px solid #ddd' }}>{(student.person?.ci || '—').toUpperCase()}</td>
                            <td style={{ fontWeight: 'bold', color: '#333', padding: '2px 8px 2px 16px', width: '25%', borderBottom: '1px solid #ddd' }}>FILIAL:</td>
                            <td style={{ color: '#333', padding: '2px 0', borderBottom: '1px solid #ddd' }}>CENTRAL EL ALTO</td>
                          </tr>
                          <tr>
                            <td style={{ fontWeight: 'bold', color: '#333', padding: '2px 8px 2px 0', borderBottom: '1px solid #ddd' }}>AP. PATERNO:</td>
                            <td style={{ color: '#333', padding: '2px 0', borderBottom: '1px solid #ddd' }}>{(student.person?.paternalSurname || '—').toUpperCase()}</td>
                            <td style={{ fontWeight: 'bold', color: '#333', padding: '2px 8px 2px 16px', borderBottom: '1px solid #ddd' }}>CARRERA:</td>
                            <td style={{ color: '#333', padding: '2px 0', borderBottom: '1px solid #ddd' }}>{(student.career?.name || '—').toUpperCase()}</td>
                          </tr>
                          <tr>
                            <td style={{ fontWeight: 'bold', color: '#333', padding: '2px 8px 2px 0', borderBottom: '1px solid #ddd' }}>AP. MATERNO:</td>
                            <td style={{ color: '#333', padding: '2px 0', borderBottom: '1px solid #ddd' }}>{(student.person?.maternalSurname || '—').toUpperCase()}</td>
                            <td style={{ fontWeight: 'bold', color: '#333', padding: '2px 8px 2px 16px', borderBottom: '1px solid #ddd' }}>NRO. FOLDER:</td>
                            <td style={{ color: '#333', padding: '2px 0', borderBottom: '1px solid #ddd' }}>{(student.studentCode || '—').toUpperCase()}</td>
                          </tr>
                          <tr>
                            <td style={{ fontWeight: 'bold', color: '#333', padding: '2px 8px 2px 0', borderBottom: '1px solid #ddd' }}>NOMBRES:</td>
                            <td style={{ color: '#333', padding: '2px 0', borderBottom: '1px solid #ddd' }}>{(student.person?.firstName || '—').toUpperCase()}</td>
                            <td style={{ fontWeight: 'bold', color: '#333', padding: '2px 8px 2px 16px', borderBottom: '1px solid #ddd' }}>GESTIÓN INGRESO:</td>
                            <td style={{ color: '#333', padding: '2px 0', borderBottom: '1px solid #ddd' }}>{(student.entryYear || '—').toUpperCase()}</td>
                          </tr>
                          <tr>
                            <td style={{ fontWeight: 'bold', color: '#333', padding: '2px 8px 2px 0', borderBottom: '1px solid #ddd' }}>NRO. TIT. BACHILLER:</td>
                            <td style={{ color: '#333', padding: '2px 0', borderBottom: '1px solid #ddd' }}>{(student.diplomaNumber || '—').toUpperCase()}</td>
                            <td style={{ fontWeight: 'bold', color: '#333', padding: '2px 8px 2px 16px', borderBottom: '1px solid #ddd' }}>PLAN:</td>
                            <td style={{ color: '#333', padding: '2px 0', borderBottom: '1px solid #ddd' }}>{(student.diplomaNumber ? 'R.M. 1049/2023' : 'R.M. 1049/2023').toUpperCase()}</td>
                          </tr>
                        </tbody>
                      </table>

                      <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
                        <div style={{ flex: 1, border: '1px solid #999', padding: 4, background: '#f8f8f8', textAlign: 'center' }}>
                          <div style={{ fontSize: '6px', color: '#666', marginBottom: 2 }}>CUENTA</div>
                          <strong style={{ fontSize: '9px', color: '#333' }}>
                            {previewData.credentials?.username || `AUT${student.person?.ci || '—'}`}
                          </strong>
                        </div>
                        <div style={{ flex: 1, border: '1px solid #999', padding: 4, background: '#f8f8f8', textAlign: 'center' }}>
                          <div style={{ fontSize: '6px', color: '#666', marginBottom: 2 }}>CONTRASEÑA</div>
                          <strong style={{ fontSize: '9px', color: '#333' }}>
                            {previewData.credentials?.password || 'N/A'}
                          </strong>
                        </div>
                        <div style={{ flex: 1, border: '1px solid #999', padding: 4, background: '#f8f8f8', textAlign: 'center' }}>
                          <div style={{ fontSize: '6px', color: '#666', marginBottom: 2 }}>FECHA INSCRIPCIÓN</div>
                          <strong style={{ fontSize: '9px', color: '#333' }}>
                            {new Date().toLocaleDateString('es-BO')}
                          </strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ marginBottom: 8, marginTop: 10 }}>
                    <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#14213d', borderBottom: '1px solid #14213d', paddingBottom: 2, marginBottom: 4 }}>
                      MATERIAS INSCRITAS
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8px' }}>
                      <thead>
                        <tr style={{ background: '#e8e8e8' }}>
                          <th style={{ padding: '3px 4px', textAlign: 'center', border: '1px solid #999', fontWeight: 'bold', color: '#333' }}>N.°</th>
                          <th style={{ padding: '3px 4px', textAlign: 'left', border: '1px solid #999', fontWeight: 'bold', color: '#333' }}>CÓDIGO</th>
                          <th style={{ padding: '3px 4px', textAlign: 'left', border: '1px solid #999', fontWeight: 'bold', color: '#333' }}>MATERIA</th>
                          <th style={{ padding: '3px 4px', textAlign: 'center', border: '1px solid #999', fontWeight: 'bold', color: '#333' }}>SEM</th>
                          <th style={{ padding: '3px 4px', textAlign: 'center', border: '1px solid #999', fontWeight: 'bold', color: '#333' }}>PAR</th>
                          <th style={{ padding: '3px 4px', textAlign: 'center', border: '1px solid #999', fontWeight: 'bold', color: '#333' }}>TUR</th>
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
                                <td style={{ padding: '2px 4px', textAlign: 'center', border: '1px solid #999' }}>{i + 1}</td>
                                <td style={{ padding: '2px 4px', border: '1px solid #999', fontWeight: 'bold' }}>{(a.subject?.code || '—').toUpperCase()}</td>
                                <td style={{ padding: '2px 4px', border: '1px solid #999' }}>{(a.subject?.name || '—').toUpperCase()}</td>
                                <td style={{ padding: '2px 4px', textAlign: 'center', border: '1px solid #999' }}>{a.semester}</td>
                                <td style={{ padding: '2px 4px', textAlign: 'center', border: '1px solid #999' }}>{(a.parallelEntity?.code || 'A').toUpperCase()}</td>
                                <td style={{ padding: '2px 4px', textAlign: 'center', border: '1px solid #999' }}>{shiftLabel}</td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                    <div style={{ fontSize: '7px', color: '#666', marginTop: 4 }}>
                      PAR: Paralelo · TUR: Turno
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid #999', paddingTop: 6, marginTop: 8 }}>
                    <div style={{ fontSize: '7px', color: '#666', textAlign: 'center' }}>
                      {institution?.name || 'Instituto Tecnológico "Boliviana de Tecnología"'} · R.M. 1049/2023 · {institution?.address || 'El Alto, Av. de los Héroes, Z. Ferropetrol N.° 11'} · Tfno: {institution?.phone || '75252479'}
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="empty-state" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
              <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                Seleccione un estudiante para ver la boleta de asignación
              </div>
            </div>
          )}
        </div>

        <div className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
          <div>
            <div className="form-label" style={{ marginBottom: 8 }}>
              Gestión académica
            </div>
            <select
              className="form-control"
              value={periodId}
              onChange={(e) => setPeriodId(e.target.value)}
            >
              <option value="">Seleccionar gestión</option>
              {periods.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.periodName} — {p.status === 'OPEN' ? 'Abierta' : p.status === 'PLANNED' ? 'Planificada' : 'Cerrada'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <input
              className="form-control"
              type="text"
              placeholder="Buscar por nombre, CI o matrícula..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="form-label">
            Estudiante habilitado
          </div>

          {student ? (
            <div
              className="card card-pad"
              style={{
                background: 'var(--primary-soft)',
                border: 'none',
                padding: '12px',
              }}
            >
              <div className="flex items-center" style={{ gap: 10, marginBottom: 8 }}>
                {student.person?.photoUrl ? (
                  <img src={student.person.photoUrl} alt="" style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }} />
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
                    {initialsOf(student.person?.firstName, student.person?.lastName)}
                  </div>
                )}
                <div>
                  <strong style={{ fontSize: 14 }}>
                    {student.studentCode} — {student.person?.firstName} {fullSurname(student.person)}
                  </strong>
                  <div className="text-muted text-sm">
                    CI {student.person?.ci} · {student.currentLevel}º semestre
                  </div>
                </div>
              </div>
              <div className="flex gap-2" style={{ flexWrap: 'wrap', fontSize: 12 }}>
                <span className="text-muted">{student.career?.name ?? '—'}</span>
              </div>
              <div className="flex gap-2 mt-2">
                {!previewData ? (
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => selectStudent(student.id)}
                  >
                    Asignar materias
                  </button>
                ) : (
                  <span className="badge badge-success">✓ Con materias</span>
                )}
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => { setStudentId(''); setSearchQuery(''); }}
                >
                  Cambiar
                </button>
              </div>
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                maxHeight: 280,
                overflowY: 'auto',
              }}
            >
              {filteredStudents.map((s) => (
                <button
                  key={s.id}
                  className={`btn btn-sm ${studentId === s.id ? 'btn-primary' : 'btn-outline'}`}
                  style={{ justifyContent: 'space-between', textAlign: 'left', gap: 8 }}
                  onClick={() => selectStudent(s.id)}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {s.person?.photoUrl ? (
                      <img src={s.person.photoUrl} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      <span
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          background: 'var(--primary)',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: 11,
                          flexShrink: 0,
                        }}
                      >
                        {initialsOf(s.person?.firstName, s.person?.lastName)}
                      </span>
                    )}
                    <span>
                      {s.studentCode} — {s.person?.firstName} {fullSurname(s.person)}
                    </span>
                  </span>
                  {studentAssignStatus[s.id]?.assigned ? (
                    <span className="badge badge-success" style={{ whiteSpace: 'nowrap' }}>
                      ✓
                    </span>
                  ) : null}
                </button>
              ))}
              {filteredStudents.length === 0 && (
                <span className="text-muted text-sm">
                  {searchQuery ? 'Sin resultados' : 'Sin estudiantes en esta gestión'}
                </span>
              )}
            </div>
)}
        </div>

      </div>
    </div>
  );
}