'use client';

import { useEffect, useState, useMemo } from 'react';
import { apiGet, apiPost, extractError } from '@/lib/api';
import { SubjectAssignment, Grade, AcademicPeriod, Student, Employee } from '@/lib/types';
import { PageHeader } from '@/components/ui/page-header';
import { Modal } from '@/components/ui/modal';
import { LoadingState, ErrorState } from '@/components/ui/state';


interface GradeRow {
  studentId: string;
  firstPartial: number;
  secondPartial: number;
  practices: number;
  finalExam: number;
}

function statusBadge(status: string) {
  switch (status) {
    case 'APPROVED': return { bg: '#d4edda', color: '#155724', text: 'APR' };
    case 'FAILED': return { bg: '#f8d7da', color: '#721c24', text: 'REP' };
    default: return { bg: '#fff3cd', color: '#856404', text: 'PEN' };
  }
}

export default function GradesPage() {
  const [assignments, setAssignments] = useState<SubjectAssignment[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [periods, setPeriods] = useState<AcademicPeriod[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selection, setSelection] = useState<{ id: string; rows: GradeRow[] } | null>(null);

  const [filterPeriod, setFilterPeriod] = useState('');
  const [filterStudent, setFilterStudent] = useState('');

  async function load() {
    setLoading(true);
    try {
      const [a, g, p, s, emp] = await Promise.all([
        apiGet<SubjectAssignment[]>('/subject-assignments'),
        apiGet<Grade[]>('/grades'),
        apiGet<AcademicPeriod[]>('/academic-periods'),
        apiGet<Student[]>('/students'),
        apiGet<Employee>('/employees/me').catch(() => null),
      ]);
      setAssignments(a);
      setGrades(g);
      setPeriods(p);
      setStudents(s);
      setCurrentEmployee(emp);

      const latestPeriod = p.find((per) => per.status === 'OPEN') || p[0];
      if (latestPeriod) setFilterPeriod(latestPeriod.id);
    } catch (err) {
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const selectedPeriod = periods.find((p) => p.id === filterPeriod);

  const filteredGrades = useMemo(() => {
    return grades.filter((g) => {
      const assignment = assignments.find((a) => a.id === g.assignmentId);
      if (!assignment) return false;
      if (currentEmployee?.id && assignment.employeeId !== currentEmployee.id) return false;
      if (filterPeriod && assignment.academicPeriodId !== filterPeriod) return false;
      if (filterStudent) {
        const student = students.find((s) => s.id === g.studentId) || g.student;
        if (!student) return false;
        const fullName = `${student.person?.firstName || ''} ${student.person?.paternalSurname || ''} ${student.person?.maternalSurname || ''} ${student.person?.lastName || ''}`.toLowerCase();
        const ci = student.person?.ci?.toLowerCase() || '';
        const search = filterStudent.toLowerCase();
        if (!fullName.includes(search) && !ci.includes(search)) return false;
      }
      return true;
    });
  }, [grades, assignments, filterPeriod, filterStudent, students, currentEmployee]);

  const stats = useMemo(() => {
    const approved = filteredGrades.filter((g) => g.status === 'APPROVED').length;
    const failed = filteredGrades.filter((g) => g.status === 'FAILED').length;
    const pending = filteredGrades.filter((g) => g.status === 'PENDING').length;
    return { approved, failed, pending, total: filteredGrades.length };
  }, [filteredGrades]);

  const gradesByStudent = useMemo(() => {
    const grouped = new Map<string, { student: Student; grades: (Grade & { assignment: SubjectAssignment | undefined })[] }>();
    filteredGrades.forEach((g) => {
      if (!grouped.has(g.studentId)) {
        const student = students.find((s) => s.id === g.studentId) || g.student!;
        grouped.set(g.studentId, { student, grades: [] });
      }
      const assignment = assignments.find((a) => a.id === g.assignmentId);
      grouped.get(g.studentId)!.grades.push({ ...g, assignment });
    });
    return Array.from(grouped.values()).sort((a, b) =>
      `${a.student.person?.paternalSurname || ''} ${a.student.person?.firstName || ''}`.localeCompare(`${b.student.person?.paternalSurname || ''} ${b.student.person?.firstName || ''}`)
    );
  }, [filteredGrades, students, assignments]);

  const periodAssignments = useMemo(() => {
    return assignments.filter((a) => {
      if (a.academicPeriodId !== filterPeriod) return false;
      if (currentEmployee?.id && a.employeeId !== currentEmployee.id) return false;
      return true;
    });
  }, [assignments, filterPeriod, currentEmployee]);

  function openRegister(a: SubjectAssignment) {
    setSelection({
      id: a.id,
      rows: (a.enrollments ?? []).map((en) => ({
        studentId: en.studentId,
        firstPartial: 0,
        secondPartial: 0,
        practices: 0,
        finalExam: 0,
      })),
    });
    setModalOpen(true);
  }

  function updateRow(studentId: string, field: keyof Omit<GradeRow, 'studentId'>, value: number) {
    if (!selection) return;
    setSelection({
      ...selection,
      rows: selection.rows.map((r) =>
        r.studentId === studentId ? { ...r, [field]: value } : r,
      ),
    });
  }

  async function submit() {
    if (!selection) return;
    try {
      await apiPost('/grades/bulk', {
        assignmentId: selection.id,
        grades: selection.rows,
      });
      setModalOpen(false);
      await load();
    } catch (err) {
      setError(extractError(err));
    }
  }

  if (loading) return <LoadingState />;

  const selectedAssignment = assignments.find((a) => a.id === selection?.id);

  return (
    <div>
      <PageHeader title="Calificaciones" subtitle="Registro de notas por materia y estudiante" />

      {error && <ErrorState message={error} />}

      {/* Selector de período */}
      <div className="card mb-3">
        <div className="card-pad" style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
          <label className="text-sm" style={{ fontWeight: 600 }}>Gestión académica:</label>
          <select className="form-control" value={filterPeriod} onChange={(e) => setFilterPeriod(e.target.value)} style={{ maxWidth: 200 }}>
            {periods.map((p) => (
              <option key={p.id} value={p.id}>
                {p.periodName} {p.status === 'OPEN' ? '✓' : ''}
              </option>
            ))}
          </select>

          <input
            className="form-control"
            type="text"
            placeholder="Buscar estudiante..."
            value={filterStudent}
            onChange={(e) => setFilterStudent(e.target.value)}
            style={{ maxWidth: 250 }}
          />
        </div>
      </div>

      {/* Estadísticas */}
      {selectedPeriod && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 16 }}>
          <div className="stat-card" style={{ background: '#d4edda', borderColor: '#c3e6cb' }}>
            <div className="stat-value" style={{ color: '#155724' }}>{stats.approved}</div>
            <div className="stat-label" style={{ color: '#155724' }}>Aprobados</div>
          </div>
          <div className="stat-card" style={{ background: '#f8d7da', borderColor: '#f5c6cb' }}>
            <div className="stat-value" style={{ color: '#721c24' }}>{stats.failed}</div>
            <div className="stat-label" style={{ color: '#721c24' }}>Reprobados</div>
          </div>
          <div className="stat-card" style={{ background: '#fff3cd', borderColor: '#ffeeba' }}>
            <div className="stat-value" style={{ color: '#856404' }}>{stats.pending}</div>
            <div className="stat-label" style={{ color: '#856404' }}>Pendientes</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total calificaciones</div>
          </div>
        </div>
      )}

      {/* Asignaciones del período */}
      {selectedPeriod && (
        <div className="card mb-3">
          <div className="card-header">
            <div className="card-title">Materias del período {selectedPeriod.periodName}</div>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Materia</th>
                  <th>Paralelo</th>
                  <th>Docente</th>
                  <th>Con notas</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {periodAssignments.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center text-muted py-4">
                      No hay materias asignadas en este período
                    </td>
                  </tr>
                )}
                {periodAssignments.map((a) => {
                  const aGrades = grades.filter((g) => g.assignmentId === a.id);
                  return (
                    <tr key={a.id}>
                      <td>
                        <strong>{a.subject?.name}</strong>
                        <br /><span className="text-xs text-muted">{a.subject?.code} · {a.subject?.career?.name || 'Sin carrera'}</span>
                      </td>
                      <td>{a.parallelEntity?.code} {a.parallelEntity?.shift === 'MANANA' ? '🌅' : a.parallelEntity?.shift === 'TARDE' ? '☀️' : '🌙'}</td>
                      <td>{a.employee?.person?.firstName ? `${a.employee.person?.firstName} ${a.employee.person?.paternalSurname || ''}` : '—'}</td>
                      <td>
                        {aGrades.length > 0 ? (
                          <span className="text-success">{aGrades.length}</span>
                        ) : (
                          <span className="text-muted">0</span>
                        )}
                      </td>
                      <td>
                        <button className="btn btn-soft btn-sm" onClick={() => openRegister(a)}>
                          {aGrades.length > 0 ? 'Editar notas' : 'Registrar notas'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Notas por estudiante */}
      {selectedPeriod && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">Notas por estudiante — {selectedPeriod.periodName}</div>
          </div>
          {gradesByStudent.length === 0 ? (
            <div className="text-center text-muted py-8">
              {filterStudent ? 'No se encontraron estudiantes con ese criterio' : 'No hay calificaciones registradas en este período'}
            </div>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ minWidth: 200 }}>Estudiante</th>
                    <th>C.I.</th>
                    <th>Materia</th>
                    <th>1er Par.</th>
                    <th>2do Par.</th>
                    <th>Pract.</th>
                    <th>Final</th>
                    <th>Nota</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {gradesByStudent.map(({ student, grades: studentGrades }) =>
                    studentGrades.map((g, idx) => {
                      const badge = statusBadge(g.status);
                      return (
                        <tr key={g.id} style={{ background: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                          {idx === 0 && (
                            <td rowSpan={studentGrades.length} style={{ verticalAlign: 'top' }}>
                              <strong>{student.person?.firstName} {student.person?.paternalSurname}</strong>
                              {student.person?.maternalSurname && ` ${student.person?.maternalSurname}`}
                            </td>
                          )}
                          {idx === 0 && (
                            <td rowSpan={studentGrades.length} style={{ verticalAlign: 'top' }} className="text-muted">
                              {student.person?.ci || '—'}
                            </td>
                          )}
                          <td>{g.assignment?.subject?.name || '—'}</td>
                          <td style={{ textAlign: 'center' }}>{g.firstPartial ?? '-'}</td>
                          <td style={{ textAlign: 'center' }}>{g.secondPartial ?? '-'}</td>
                          <td style={{ textAlign: 'center' }}>{g.practices ?? '-'}</td>
                          <td style={{ textAlign: 'center' }}>{g.finalExam ?? '-'}</td>
                          <td style={{ textAlign: 'center', fontWeight: 'bold' }}>
                            {g.finalGrade ?? '-'}
                          </td>
                          <td>
                            <span style={{ background: badge.bg, color: badge.color, padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>
                              {badge.text}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <Modal open={modalOpen} title="Registrar calificaciones" onClose={() => setModalOpen(false)}
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setModalOpen(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={submit}>Guardar notas</button>
          </>
        }
      >
        {selectedAssignment && (
          <div className="mb-3">
            <strong>{selectedAssignment.subject?.name}</strong> - {selectedAssignment.academicPeriod?.periodName} - Paralelo {selectedAssignment.parallelEntity?.code}
          </div>
        )}
        <p className="text-muted text-sm mb-3">
          Ponderaciones: 1er parcial 25%, 2do parcial 25%, prácticas 20%, examen final 30%.
          Nota mínima de aprobación: <strong>51</strong>.
        </p>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Estudiante</th>
                <th>C.I.</th>
                <th>P1</th>
                <th>P2</th>
                <th>Prácticas</th>
                <th>Final</th>
              </tr>
            </thead>
            <tbody>
              {(selection?.rows ?? []).length === 0 && (
                <tr>
                  <td colSpan={6} className="text-muted">
                    Esta asignación no tiene estudiantes asignados.
                  </td>
                </tr>
              )}
              {(selection?.rows ?? []).map((r) => {
                const enrollment = selectedAssignment?.enrollments?.find((en) => en.studentId === r.studentId);
                const student = enrollment?.student;
                return (
                  <tr key={r.studentId}>
                    <td>
                      {student?.person?.firstName} {student?.person?.paternalSurname} {student?.person?.maternalSurname}
                    </td>
                    <td className="text-muted">{student?.person?.ci || '—'}</td>
                    <td><input className="form-control" type="number" min={0} max={100} value={r.firstPartial} onChange={(e) => updateRow(r.studentId, 'firstPartial', Number(e.target.value))} style={{ width: 64 }} /></td>
                    <td><input className="form-control" type="number" min={0} max={100} value={r.secondPartial} onChange={(e) => updateRow(r.studentId, 'secondPartial', Number(e.target.value))} style={{ width: 64 }} /></td>
                    <td><input className="form-control" type="number" min={0} max={100} value={r.practices} onChange={(e) => updateRow(r.studentId, 'practices', Number(e.target.value))} style={{ width: 64 }} /></td>
                    <td><input className="form-control" type="number" min={0} max={100} value={r.finalExam} onChange={(e) => updateRow(r.studentId, 'finalExam', Number(e.target.value))} style={{ width: 64 }} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Modal>
    </div>
  );
}
