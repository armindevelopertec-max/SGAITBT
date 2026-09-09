'use client';

import { useEffect, useState } from 'react';
import { apiGet, apiPost, extractError } from '@/lib/api';
import { SubjectAssignment, Student } from '@/lib/types';
import { PageHeader } from '@/components/ui/page-header';
import { Modal } from '@/components/ui/modal';
import { LoadingState, ErrorState } from '@/components/ui/state';

type AttendanceRow = {
  studentId: string;
  status: string;
};

export default function AttendancePage() {
  const [assignments, setAssignments] = useState<SubjectAssignment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [assignmentId, setAssignmentId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [rows, setRows] = useState<AttendanceRow[]>([]);
  const [summary, setSummary] = useState<{
    summary: Array<Record<string, unknown>>;
    overall: Record<string, unknown>;
  } | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [a, s] = await Promise.all([
        apiGet<SubjectAssignment[]>('/subject-assignments'),
        apiGet<Student[]>('/students'),
      ]);
      setAssignments(a);
      setStudents(s);
    } catch (err) {
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openRegister(a: SubjectAssignment) {
    setAssignmentId(a.id);
    setRows(
      (a.enrollments ?? []).map((en) => ({
        studentId: en.studentId,
        status: 'PRESENT',
      })),
    );
    setModalOpen(true);
  }

  async function submit() {
    try {
      await apiPost('/attendance', {
        assignmentId,
        attendanceDate: date,
        records: rows,
      });
      setModalOpen(false);
    } catch (err) {
      setError(extractError(err));
    }
  }

  async function loadSummary(a: SubjectAssignment) {
    try {
      const res = await apiGet<{ summary: AttendanceRow & { percentage: number }[]; overall: Record<string, unknown> }>(
        `/attendance/summary/assignment/${a.id}`,
      );
      setSummary({
        summary: res.summary as unknown as Array<Record<string, unknown>>,
        overall: res.overall,
      });
    } catch (err) {
      setError(extractError(err));
    }
  }

  const Change = ({ sid }: { sid: string }) => (
    <select
      className="select"
      value={rows.find((r) => r.studentId === sid)?.status ?? 'PRESENT'}
      onChange={(e) =>
        setRows((prev) =>
          prev.map((r) => (r.studentId === sid ? { ...r, status: e.target.value } : r)),
        )
      }
    >
      <option value="PRESENT">Presente</option>
      <option value="ABSENT">Falta</option>
      <option value="LATE">Atraso</option>
      <option value="JUSTIFIED">Justificado</option>
    </select>
  );

  if (loading) return <LoadingState />;

  return (
    <div>
      <PageHeader title="Asistencia" subtitle="Registro de asistencia por materia y fecha" />

      {error && <ErrorState message={error} />}

      <div className="card">
        <div className="card-header">
          <div className="card-title">Registrar asistencia por asignación</div>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Materia</th>
                <th>Gestión</th>
                <th>Paralelo</th>
                <th>Estudiantes</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {assignments.length === 0 && (
                <tr>
                  <td colSpan={5}>
                    <div className="empty-state">
                      <div className="empty-state-icon">📅</div>
                      No hay asignaciones registradas.
                    </div>
                  </td>
                </tr>
              )}
              {assignments.map((a) => (
                <tr key={a.id}>
                  <td><strong>{a.subject?.name}</strong></td>
                  <td>{a.academicPeriod?.periodName ?? '—'}</td>
                  <td>{a.parallel}</td>
                  <td>{(a.enrollments ?? []).length}</td>
                  <td>
                    <div className="flex gap-2">
                      <button className="btn btn-soft btn-sm" onClick={() => openRegister(a)}>Tomar asistencia</button>
                      <button className="btn btn-outline btn-sm" onClick={() => loadSummary(a)}>Resumen</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {summary && (
        <div className="card mt-4">
          <div className="card-header">
            <div className="card-title">Resumen de asistencia</div>
            <button className="btn btn-outline btn-sm" onClick={() => setSummary(null)}>Cerrar</button>
          </div>
          <div className="card-pad">
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-label">Total registros</div>
                <div className="stat-value">{(summary.overall.total as number) ?? 0}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Presentes</div>
                <div className="stat-value" style={{ color: 'var(--success)' }}>{(summary.overall.present as number) ?? 0}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Faltas</div>
                <div className="stat-value" style={{ color: 'var(--danger)' }}>{(summary.overall.absent as number) ?? 0}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">% Asistencia</div>
                <div className="stat-value">{(summary.overall.percentage as number) ?? 0}%</div>
              </div>
            </div>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Estudiante</th>
                    <th>Total</th>
                    <th>Presente</th>
                    <th>Atrasos</th>
                    <th>Justificados</th>
                    <th>Faltas</th>
                    <th>%</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.summary.map((r) => (
                    <tr key={r.studentId as string}>
                      <td>{(r.studentId as string)}</td>
                      <td>{(r.total as number)}</td>
                      <td>{(r.present as number)}</td>
                      <td>{(r.late as number)}</td>
                      <td>{(r.justified as number)}</td>
                      <td>{(r.absent as number)}</td>
                      <td>{(r.percentage as number)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <Modal open={modalOpen} title="Tomar asistencia" onClose={() => setModalOpen(false)}
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setModalOpen(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={submit}>Guardar asistencia</button>
          </>
        }
      >
        <div className="form-group mb-3">
          <label className="form-label">Fecha</label>
          <input className="form-control" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Estudiante</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={2} className="text-muted">
                    Esta asignación no tiene estudiantes. Primero asigna estudiantes desde el módulo de asignaciones.
                  </td>
                </tr>
              )}
              {rows.map((r) => (
                <tr key={r.studentId}>
                  <td>{students.find((s) => s.id === r.studentId)?.firstName}{' '}
                      {students.find((s) => s.id === r.studentId)?.lastName}</td>
                  <td><Change sid={r.studentId} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modal>
    </div>
  );
}