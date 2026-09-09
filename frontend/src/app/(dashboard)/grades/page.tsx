'use client';

import { useEffect, useState } from 'react';
import { apiGet, apiPost, extractError } from '@/lib/api';
import { SubjectAssignment, Grade } from '@/lib/types';
import { PageHeader } from '@/components/ui/page-header';
import { Modal } from '@/components/ui/modal';
import { StatusBadge } from '@/components/ui/badge';
import { LoadingState, ErrorState } from '@/components/ui/state';

interface GradeRow {
  studentId: string;
  firstPartial: number;
  secondPartial: number;
  practices: number;
  finalExam: number;
}

export default function GradesPage() {
  const [assignments, setAssignments] = useState<SubjectAssignment[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selection, setSelection] = useState<{ id: string; rows: GradeRow[] } | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [a, g] = await Promise.all([
        apiGet<SubjectAssignment[]>('/subject-assignments'),
        apiGet<Grade[]>('/grades'),
      ]);
      setAssignments(a);
      setGrades(g);
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

  const gradeByAssignment = (a: SubjectAssignment) =>
    grades.filter((g) => g.assignmentId === a.id);

  if (loading) return <LoadingState />;

  return (
    <div>
      <PageHeader title="Calificaciones" subtitle="Registro de notas por materia y estudiante" />

      {error && <ErrorState message={error} />}

      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Materia</th>
                <th>Gestión</th>
                <th>Paralelo</th>
                <th>Con notas</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {assignments.length === 0 && (
                <tr>
                  <td colSpan={5}>
                    <div className="empty-state">
                      <div className="empty-state-icon">📊</div>
                      No hay asignaciones registradas.
                    </div>
                  </td>
                </tr>
              )}
              {assignments.map((a) => {
                const aGrades = gradeByAssignment(a);
                return (
                  <tr key={a.id}>
                    <td><strong>{a.subject?.name}</strong></td>
                    <td>{a.academicPeriod?.periodName ?? '—'}</td>
                    <td>{a.parallel}</td>
                    <td>{aGrades.length}{aGrades.length > 0 ? ` (${aGrades.filter((g) => g.status === 'APPROVED').length} aprob.)` : ''}</td>
                    <td>
                      <button className="btn btn-soft btn-sm" onClick={() => openRegister(a)}>
                        {aGrades.length > 0 ? 'Ver / editar notas' : 'Registrar notas'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card mt-4">
        <div className="card-header">
          <div className="card-title">Notas registradas</div>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Estudiante</th>
                <th>Materia</th>
                <th>1er Parcial</th>
                <th>2do Parcial</th>
                <th>Prácticas</th>
                <th>Final</th>
                <th>Nota final</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {grades.length === 0 && (
                <tr>
                  <td colSpan={8}>
                    <div className="empty-state">Sin calificaciones registradas.</div>
                  </td>
                </tr>
              )}
              {grades.map((g) => (
                <tr key={g.id}>
                  <td>{g.student?.firstName} {g.student?.lastName}</td>
                  <td>{g.assignment?.subject?.name ?? '—'}</td>
                  <td>{g.firstPartial ?? '-'}</td>
                  <td>{g.secondPartial ?? '-'}</td>
                  <td>{g.practices ?? '-'}</td>
                  <td>{g.finalExam ?? '-'}</td>
                  <td><strong>{g.finalGrade ?? '-'}</strong></td>
                  <td><StatusBadge value={g.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={modalOpen} title="Registrar calificaciones" onClose={() => setModalOpen(false)}
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setModalOpen(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={submit}>Guardar notas</button>
          </>
        }
      >
        <p className="text-muted text-sm mb-3">
          Ponderaciones: 1er parcial 25%, 2do parcial 25%, prácticas 20%, examen final 30%.
          Nota mínima de aprobación: <strong>51</strong>.
        </p>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Estudiante</th>
                <th>P1</th>
                <th>P2</th>
                <th>Prácticas</th>
                <th>Final</th>
              </tr>
            </thead>
            <tbody>
              {(selection?.rows ?? []).length === 0 && (
                <tr>
                  <td colSpan={5} className="text-muted">
                    Esta asignación no tiene estudiantes asignados.
                  </td>
                </tr>
              )}
              {(selection?.rows ?? []).map((r) => (
                <tr key={r.studentId}>
                  <td>{(assignments.find((a) => a.id === selection?.id)?.enrollments ?? []).find((en) => en.studentId === r.studentId)?.student?.firstName}{' '}
                      {(assignments.find((a) => a.id === selection?.id)?.enrollments ?? []).find((en) => en.studentId === r.studentId)?.student?.lastName}</td>
                  <td><input className="form-control" type="number" min={0} max={100} value={r.firstPartial} onChange={(e) => updateRow(r.studentId, 'firstPartial', Number(e.target.value))} style={{ width: 64 }} /></td>
                  <td><input className="form-control" type="number" min={0} max={100} value={r.secondPartial} onChange={(e) => updateRow(r.studentId, 'secondPartial', Number(e.target.value))} style={{ width: 64 }} /></td>
                  <td><input className="form-control" type="number" min={0} max={100} value={r.practices} onChange={(e) => updateRow(r.studentId, 'practices', Number(e.target.value))} style={{ width: 64 }} /></td>
                  <td><input className="form-control" type="number" min={0} max={100} value={r.finalExam} onChange={(e) => updateRow(r.studentId, 'finalExam', Number(e.target.value))} style={{ width: 64 }} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modal>
    </div>
  );
}