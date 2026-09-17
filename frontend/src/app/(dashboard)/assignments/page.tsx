'use client';

import { useEffect, useState } from 'react';
import { apiGet, apiPost, extractError } from '@/lib/api';
import { SubjectAssignment, Subject, AcademicPeriod, AcademicPeriod as Period, Employee, Student } from '@/lib/types';
import { PageHeader } from '@/components/ui/page-header';
import { Modal } from '@/components/ui/modal';
import { LoadingState, ErrorState } from '@/components/ui/state';

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<SubjectAssignment[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [periods, setPeriods] = useState<AcademicPeriod[]>([]);
  const [teachers, setTeachers] = useState<Employee[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ subjectId: '', academicPeriodId: '', employeeId: '', parallel: 'A', classroom: '' });
  const [selected, setSelected] = useState<SubjectAssignment | null>(null);
  const [studentId, setStudentId] = useState('');

  async function load() {
    setLoading(true);
    try {
      const [a, sub, p, t, st] = await Promise.all([
        apiGet<SubjectAssignment[]>('/subject-assignments'),
        apiGet<Subject[]>('/subjects'),
        apiGet<Period[]>('/academic-periods'),
        apiGet<Employee[]>('/employees?employeeType=DOCENTE'),
        apiGet<Student[]>('/students'),
      ]);
      setAssignments(a);
      setSubjects(sub);
      setPeriods(p);
      setTeachers(t);
      setStudents(st);
    } catch (err) {
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openCreate() {
    setForm({ subjectId: subjects[0]?.id ?? '', academicPeriodId: periods[0]?.id ?? '', employeeId: '', parallel: 'A', classroom: '' });
    setModalOpen(true);
  }

  async function submit() {
    try {
      await apiPost('/subject-assignments', form);
      setModalOpen(false);
      await load();
    } catch (err) {
      setError(extractError(err));
    }
  }

  async function showStudents(a: SubjectAssignment) {
    try {
      const withStudents = await apiGet<SubjectAssignment>(`/subject-assignments/${a.id}`);
      setSelected(withStudents);
      setStudentId('');
    } catch (err) {
      setError(extractError(err));
    }
  }

  async function enrollStudent() {
    if (!selected || !studentId) return;
    try {
      await apiPost(`/subject-assignments/${selected.id}/enroll-student`, { studentId });
      await showStudents(selected);
    } catch (err) {
      setError(extractError(err));
    }
  }

  async function autoAssign(a: SubjectAssignment) {
    try {
      await apiPost('/subject-assignments/auto-assign', {
        subjectId: a.subjectId,
        academicPeriodId: a.academicPeriodId,
      });
      await load();
    } catch (err) {
      setError(extractError(err));
    }
  }

  const personName = (p?: { firstName?: string; paternalSurname?: string; maternalSurname?: string; lastName?: string }) =>
    p ? [p.firstName, p.paternalSurname, p.maternalSurname].filter(Boolean).join(' ') || p.lastName || '—' : '—';

  if (loading) return <LoadingState />;

  return (
    <div>
      <PageHeader
        title="Asignación de Materias"
        subtitle="Asignar materias, docentes, paralelos y estudiantes matriculados"
        actions={
          <button className="btn btn-primary" onClick={openCreate}>
            Nueva asignación
          </button>
        }
      />

      {error && <ErrorState message={error} />}

      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Materia</th>
                <th>Semestre</th>
                <th>Gestión</th>
                <th>Paralelo</th>
                <th>Docente</th>
                <th>Aula</th>
                <th>Estudiantes</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {assignments.length === 0 && (
                <tr>
                  <td colSpan={8}>
                    <div className="empty-state">
                      <div className="empty-state-icon">🗓️</div>
                      No hay asignaciones registradas.
                    </div>
                  </td>
                </tr>
              )}
              {assignments.map((a) => (
                <tr key={a.id}>
                  <td>
                    <strong>{a.subject?.name}</strong>
                    <div className="text-muted text-sm">{a.subject?.code}</div>
                  </td>
                  <td>{a.semester}º</td>
                  <td>{a.academicPeriod?.periodName ?? a.academicPeriod?.year ?? '—'}</td>
                  <td>{a.parallel}</td>
                  <td>{a.employee ? personName(a.employee.persona) : '—'}</td>
                  <td>{a.classroom ?? '—'}</td>
                  <td>{(a.enrollments ?? []).length}</td>
                  <td>
                    <div className="flex gap-2">
                      <button className="btn btn-soft btn-sm" onClick={() => showStudents(a)}>Estudiantes</button>
                      <button className="btn btn-outline btn-sm" onClick={() => autoAssign(a)}>Autoasignar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={modalOpen} title="Nueva asignación" onClose={() => setModalOpen(false)}
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setModalOpen(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={submit}>Guardar</button>
          </>
        }
      >
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Materia</label>
            <select className="select" value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })}>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.code} — {s.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Gestión</label>
            <select className="select" value={form.academicPeriodId} onChange={(e) => setForm({ ...form, academicPeriodId: e.target.value })}>
              {periods.map((p) => <option key={p.id} value={p.id}>{p.periodName}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Docente</label>
            <select className="select" value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })}>
              <option value="">—</option>
              {teachers.map((t) => <option key={t.id} value={t.id}>{personName(t.persona)}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Paralelo</label>
            <input className="form-control" value={form.parallel} onChange={(e) => setForm({ ...form, parallel: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Aula</label>
            <input className="form-control" value={form.classroom} onChange={(e) => setForm({ ...form, classroom: e.target.value })} />
          </div>
        </div>
      </Modal>

      <Modal open={!!selected} title={`Estudiantes — ${selected?.subject?.name ?? ''}`} onClose={() => setSelected(null)}
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setSelected(null)}>Cerrar</button>
          </>
        }
      >
        {selected && (
          <div>
            <div className="flex gap-2 mb-3">
              <select className="select" value={studentId} onChange={(e) => setStudentId(e.target.value)} style={{ flex: 1 }}>
                <option value="">Seleccionar estudiante…</option>
                {students.map((s) => <option key={s.id} value={s.id}>{s.studentCode} — {s.firstName} {s.lastName}</option>)}
              </select>
              <button className="btn btn-primary" onClick={enrollStudent} disabled={!studentId}>Asignar</button>
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Estudiante</th>
                  <th>CI</th>
                </tr>
              </thead>
              <tbody>
                {(selected.enrollments ?? []).length === 0 && (
                  <tr>
                    <td colSpan={3} className="text-muted" style={{ textAlign: 'center' }}>
                      Sin estudiantes asignados.
                    </td>
                  </tr>
                )}
                {(selected.enrollments ?? []).map((en) => (
                  <tr key={en.id}>
                    <td>{en.student?.studentCode}</td>
                    <td>{en.student?.firstName} {en.student?.lastName}</td>
                    <td>{en.student?.ci}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>
    </div>
  );
}