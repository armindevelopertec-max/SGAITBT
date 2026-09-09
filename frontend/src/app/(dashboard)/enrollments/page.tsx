'use client';

import { useEffect, useState } from 'react';
import { apiGet, apiPost, extractError } from '@/lib/api';
import { Enrollment, Student, AcademicPeriod } from '@/lib/types';
import { PageHeader } from '@/components/ui/page-header';
import { Modal } from '@/components/ui/modal';
import { StatusBadge } from '@/components/ui/badge';
import { LoadingState, ErrorState } from '@/components/ui/state';

export default function EnrollmentsPage() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [periods, setPeriods] = useState<AcademicPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ studentId: '', academicPeriodId: '', semester: 1 });

  async function load() {
    setLoading(true);
    try {
      const [e, s, p] = await Promise.all([
        apiGet<Enrollment[]>('/enrollments'),
        apiGet<Student[]>('/students'),
        apiGet<AcademicPeriod[]>('/academic-periods'),
      ]);
      setEnrollments(e);
      setStudents(s);
      setPeriods(p);
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
    setForm({ studentId: students[0]?.id ?? '', academicPeriodId: periods[0]?.id ?? '', semester: 1 });
    setModalOpen(true);
  }

  async function submit() {
    try {
      await apiPost('/enrollments/enroll-student', form);
      setModalOpen(false);
      await load();
    } catch (err) {
      setError(extractError(err));
    }
  }

  if (loading) return <LoadingState />;

  return (
    <div>
      <PageHeader
        title="Matrículas"
        subtitle="Registro y consulta de matrículas por gestión"
        actions={
          <button className="btn btn-primary" onClick={openCreate}>
            Nueva matrícula
          </button>
        }
      />

      {error && <ErrorState message={error} />}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total matrículas activas</div>
          <div className="stat-value">{enrollments.filter((e) => e.status === 'ACTIVE').length}</div>
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Nº matrícula</th>
                <th>Estudiante</th>
                <th>Carrera</th>
                <th>Gestión</th>
                <th>Nivel</th>
                <th>Fecha</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {enrollments.length === 0 && (
                <tr>
                  <td colSpan={7}>
                    <div className="empty-state">
                      <div className="empty-state-icon">📋</div>
                      No hay matrículas registradas.
                    </div>
                  </td>
                </tr>
              )}
              {enrollments.map((e) => (
                <tr key={e.id}>
                  <td>{e.enrollmentNumber}</td>
                  <td>
                    {e.student ? `${e.student.firstName} ${e.student.lastName}` : '—'}
                    {e.student && <div className="text-muted text-sm">{e.student.studentCode}</div>}
                  </td>
                  <td>{e.career?.name ?? '—'}</td>
                  <td>{e.academicPeriod?.periodName ?? e.academicPeriod?.year ?? '—'}</td>
                  <td>{e.semester}º</td>
                  <td>{e.enrollmentDate}</td>
                  <td><StatusBadge value={e.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={modalOpen} title="Nueva matrícula" onClose={() => setModalOpen(false)}
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setModalOpen(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={submit}>Matricular</button>
          </>
        }
      >
        <p className="text-muted text-sm mb-3">
          El estudiante debe tener un depósito <strong>verificado</strong> o <strong>aprobado</strong> para
          poder registrarse la matrícula. El sistema generará el número de matrícula automáticamente.
        </p>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Estudiante</label>
            <select className="select" value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })}>
              <option value="">—</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>{s.studentCode} — {s.firstName} {s.lastName} ({s.status})</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Gestión académica</label>
            <select className="select" value={form.academicPeriodId} onChange={(e) => setForm({ ...form, academicPeriodId: e.target.value })}>
              <option value="">—</option>
              {periods.map((p) => (
                <option key={p.id} value={p.id}>{p.periodName} — {p.year}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Nivel / Semestre</label>
            <input className="form-control" type="number" min={1} value={form.semester} onChange={(e) => setForm({ ...form, semester: Number(e.target.value) })} />
          </div>
        </div>
      </Modal>
    </div>
  );
}