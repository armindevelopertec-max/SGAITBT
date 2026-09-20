'use client';

import { useEffect, useState } from 'react';
import { apiGet, extractError } from '@/lib/api';
import { Enrollment, Deposit, Student, SubjectAssignment, Grade, Career, Person } from '@/lib/types';
import { PageHeader } from '@/components/ui/page-header';
import { StatusBadge } from '@/components/ui/badge';
import { LoadingState, ErrorState } from '@/components/ui/state';

type ReportKey =
  | 'students'
  | 'enrollments'
  | 'deposits'
  | 'subjects'
  | 'assignments'
  | 'grades'
  | 'byCareer'
  | 'withdrawn'
  | 'graduates';

const REPORTS: Array<{ key: ReportKey; label: string }> = [
  { key: 'students', label: 'Reporte de estudiantes' },
  { key: 'enrollments', label: 'Reporte de matrículas' },
  { key: 'deposits', label: 'Reporte de depósitos' },
  { key: 'subjects', label: 'Reporte de materias' },
  { key: 'assignments', label: 'Reporte de asignaciones' },
  { key: 'grades', label: 'Reporte de calificaciones' },
  { key: 'byCareer', label: 'Estudiantes por carrera' },
  { key: 'withdrawn', label: 'Estudiantes retirados' },
  { key: 'graduates', label: 'Egresados' },
];

export default function ReportsPage() {
  const [report, setReport] = useState<ReportKey>('students');
  const [students, setStudents] = useState<Student[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [assignments, setAssignments] = useState<SubjectAssignment[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [careers, setCareers] = useState<Career[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    try {
      const [st, en, de, as, gr, ca] = await Promise.all([
        apiGet<Student[]>('/students'),
        apiGet<Enrollment[]>('/enrollments'),
        apiGet<Deposit[]>('/deposits'),
        apiGet<SubjectAssignment[]>('/subject-assignments'),
        apiGet<Grade[]>('/grades'),
        apiGet<Career[]>('/careers'),
      ]);
      setStudents(st);
      setEnrollments(en);
      setDeposits(de);
      setAssignments(as);
      setGrades(gr);
      setCareers(ca);
    } catch (err) {
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  }

  const personName = (p?: Person) =>
    p ? [p.firstName, p.paternalSurname, p.maternalSurname].filter(Boolean).join(' ') || p.lastName || '—' : '—';

  useEffect(() => {
    load();
  }, []);

  if (loading) return <LoadingState />;

  const counts = (arr: unknown[]) => arr.length;

  return (
    <div>
      <PageHeader title="Reportes" subtitle="Reportes administrativos y académicos" />

      {error && <ErrorState message={error} />}

      <div className="stats-grid">
        {REPORTS.map((r) => (
          <button
            key={r.key}
            className="stat-card"
            style={{
              textAlign: 'left',
              border: report === r.key ? '2px solid var(--primary)' : '1px solid var(--border)',
            }}
            onClick={() => setReport(r.key)}
          >
            <div className="stat-label">{r.label}</div>
          </button>
        ))}
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">{REPORTS.find((r) => r.key === report)?.label}</div>
          <span className="text-muted text-sm">
            {report === 'students' && `${counts(students)} registros`}
            {report === 'enrollments' && `${counts(enrollments)} registros`}
            {report === 'deposits' && `${counts(deposits)} registros`}
            {report === 'subjects' && `${assignments.reduce((acc, a) => acc + (a.subject ? 1 : 0), 0)} materias`}
            {report === 'assignments' && `${counts(assignments)} asignaciones`}
            {report === 'grades' && `${counts(grades)} calificaciones`}
            {report === 'byCareer' && `${counts(careers)} carreras`}
          </span>
        </div>
        <div className="table-wrap">
          {report === 'students' && (
            <table className="table">
              <thead>
                <tr><th>Código</th><th>Estudiante</th><th>CI</th><th>Carrera</th><th>Nivel</th><th>Estado</th><th>Correo</th></tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id}>
                    <td>{s.studentCode}</td>
                    <td>{s.person?.firstName} {s.person?.lastName}</td>
                    <td>{s.person?.ci}</td>
                    <td>{s.career?.name ?? '—'}</td>
                    <td>{s.currentLevel}º</td>
                    <td><StatusBadge value={s.status} /></td>
                    <td>{s.person?.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {report === 'enrollments' && (
            <table className="table">
              <thead>
                <tr><th>Nº</th><th>Estudiante</th><th>Carrera</th><th>Gestión</th><th>Fecha</th><th>Estado</th></tr>
              </thead>
              <tbody>
                {enrollments.map((e) => (
                  <tr key={e.id}>
                    <td>{e.enrollmentNumber}</td>
                    <td>{e.student?.person?.firstName} {e.student?.person?.lastName}</td>
                    <td>{e.career?.name ?? '—'}</td>
                    <td>{e.academicPeriod?.periodName ?? '—'}</td>
                    <td>{e.enrollmentDate}</td>
                    <td><StatusBadge value={e.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {report === 'deposits' && (
            <table className="table">
              <thead>
                <tr><th>Nº</th><th>Estudiante</th><th>Fecha</th><th>Concepto</th><th>Monto</th><th>Estado</th></tr>
              </thead>
              <tbody>
                {deposits.map((d) => (
                  <tr key={d.id}>
                    <td>{d.depositNumber}</td>
                    <td>{d.student?.person?.firstName} {d.student?.person?.lastName}</td>
                    <td>{d.depositDate}</td>
                    <td>{d.concept}</td>
                    <td>Bs. {d.amount}</td>
                    <td><StatusBadge value={d.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {report === 'subjects' && (
            <table className="table">
              <thead>
                <tr><th>Código</th><th>Materia</th><th>Semestre</th><th>Horas</th><th>Asignaciones</th></tr>
              </thead>
              <tbody>
                {assignments
                  .filter((a) => a.subject)
                  .reduce((acc: Array<{ subjectId: string; code: string }>, a) => {
                    if (!acc.some((x) => x.subjectId === a.subjectId))
                      acc.push({ subjectId: a.subjectId, code: a.subject?.code ?? '' });
                    return acc;
                  }, [])
                  .map((x) => {
                    const a = assignments.find((as) => as.subjectId === x.subjectId);
                    return (
                      <tr key={x.subjectId}>
                        <td>{a?.subject?.code}</td>
                        <td>{a?.subject?.name}</td>
                        <td>{a?.semester}º</td>
                        <td>{a?.subject?.totalHours}</td>
                        <td>{assignments.filter((as) => as.subjectId === x.subjectId).length}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          )}

          {report === 'assignments' && (
            <table className="table">
              <thead>
                <tr><th>Materia</th><th>Gestión</th><th>Paralelo</th><th>Docente</th><th>Estudiantes</th></tr>
              </thead>
              <tbody>
                {assignments.map((a) => (
                  <tr key={a.id}>
                    <td>{a.subject?.name}</td>
                    <td>{a.academicPeriod?.periodName ?? '—'}</td>
                    <td>{a.parallelEntity?.code}</td>
                    <td>{a.employee ? personName(a.employee.person) : '—'}</td>
                    <td>{(a.enrollments ?? []).length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {report === 'grades' && (
            <table className="table">
              <thead>
                <tr><th>Estudiante</th><th>Materia</th><th>Nota final</th><th>Estado</th></tr>
              </thead>
              <tbody>
                {grades.map((g) => (
                  <tr key={g.id}>
                    <td>{g.student?.person?.firstName} {g.student?.person?.lastName}</td>
                    <td>{g.assignment?.subject?.name ?? '—'}</td>
                    <td><strong>{g.finalGrade ?? '-'}</strong></td>
                    <td><StatusBadge value={g.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {report === 'byCareer' && (
            <table className="table">
              <thead>
                <tr><th>Carrera</th><th>Total estudiantes</th><th>Activos</th><th>Egresados</th></tr>
              </thead>
              <tbody>
                {careers.map((c) => {
                  const careerStudents = students.filter((s) => s.careerId === c.id);
                  return (
                    <tr key={c.id}>
                      <td><strong>{c.name}</strong></td>
                      <td>{careerStudents.length}</td>
                      <td>{careerStudents.filter((s) => s.status === 'ACTIVE').length}</td>
                      <td>{careerStudents.filter((s) => s.status === 'GRADUATE' || s.status === 'TITLED').length}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {report === 'withdrawn' && (
            <table className="table">
              <thead>
                <tr><th>Código</th><th>Estudiante</th><th>CI</th><th>Carrera</th><th>Estado</th></tr>
              </thead>
              <tbody>
                {students.filter((s) => s.status === 'WITHDRAWN').map((s) => (
                  <tr key={s.id}>
                    <td>{s.studentCode}</td>
                    <td>{s.person?.firstName} {s.person?.lastName}</td>
                    <td>{s.person?.ci}</td>
                    <td>{s.career?.name ?? '—'}</td>
                    <td><StatusBadge value={s.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {report === 'graduates' && (
            <table className="table">
              <thead>
                <tr><th>Código</th><th>Estudiante</th><th>CI</th><th>Carrera</th><th>Estado</th></tr>
              </thead>
              <tbody>
                {students.filter((s) => s.status === 'GRADUATE' || s.status === 'TITLED').map((s) => (
                  <tr key={s.id}>
                    <td>{s.studentCode}</td>
                    <td>{s.person?.firstName} {s.person?.lastName}</td>
                    <td>{s.person?.ci}</td>
                    <td>{s.career?.name ?? '—'}</td>
                    <td><StatusBadge value={s.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}