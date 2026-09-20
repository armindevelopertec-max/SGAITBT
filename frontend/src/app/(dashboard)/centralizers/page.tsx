'use client';

import { useEffect, useState } from 'react';
import { apiGet, extractError } from '@/lib/api';
import { SubjectAssignment, Grade } from '@/lib/types';
import { PageHeader } from '@/components/ui/page-header';
import { StatusBadge } from '@/components/ui/badge';
import { LoadingState, ErrorState } from '@/components/ui/state';

export default function CentralizersPage() {
  const [assignments, setAssignments] = useState<SubjectAssignment[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [documentTitle, setDocumentTitle] = useState('CENTRALIZADOR DE CALIFICACIONES');

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

  const selected = assignments.find((a) => a.id === selectedId);
  const assignGrades = grades.filter((g) => g.assignmentId === selectedId);

  const personName = (p?: { firstName?: string; paternalSurname?: string; maternalSurname?: string; lastName?: string }) =>
    p ? [p.firstName, p.paternalSurname, p.maternalSurname].filter(Boolean).join(' ') || p.lastName || '—' : '—';

  function print() {
    window.print();
  }

  if (loading) return <LoadingState />;

  return (
    <div>
      <PageHeader
        title="Centralizadores"
        subtitle="Listas de calificaciones por materia, paralelo, semestre y gestión"
        actions={
          <button className="btn btn-primary" onClick={print} disabled={!selected}>
            🖨️ Imprimir
          </button>
        }
      />

      {error && <ErrorState message={error} />}

      <div className="card card-pad mb-3">
        <div className="flex gap-3 align-items-center">
          <input
            className="form-control"
            placeholder="Título del documento"
            value={documentTitle}
            onChange={(e) => setDocumentTitle(e.target.value)}
            style={{ maxWidth: 360 }}
          />
          <select
            className="select"
            style={{ flex: 1 }}
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
          >
            <option value="">Seleccionar asignación…</option>
            {assignments.map((a) => (
              <option key={a.id} value={a.id}>
                {a.subject?.name} — {a.academicPeriod?.periodName ?? a.academicPeriod?.year ?? ''} — Paralelo {a.parallelEntity?.code}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selected && (
        <div
          className="card"
          id="centralizer-document"
          style={{ padding: 40, background: '#fff' }}
        >
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, textTransform: 'uppercase' }}>
              Instituto Tecnológico &quot;Boliviana de Tecnología&quot;
            </h2>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginTop: 6, textTransform: 'uppercase' }}>
              {documentTitle}
            </h3>
          </div>

          <table style={{ width: '100%', marginBottom: 18, fontSize: 13 }}>
            <tbody>
              <tr><td style={{ width: 140, fontWeight: 600 }}>Carrera:</td><td>{selected.subject?.career?.name ?? '—'}</td></tr>
              <tr><td style={{ fontWeight: 600 }}>Gestión:</td><td>{selected.academicPeriod?.periodName ?? selected.academicPeriod?.year ?? '—'}</td></tr>
              <tr><td style={{ fontWeight: 600 }}>Semestre:</td><td>{selected.semester}º</td></tr>
              <tr><td style={{ fontWeight: 600 }}>Materia:</td><td>{selected.subject?.name ?? '—'}</td></tr>
              <tr><td style={{ fontWeight: 600 }}>Docente:</td><td>{selected.employee ? personName(selected.employee.person) : '———'}</td></tr>
              <tr><td style={{ fontWeight: 600 }}>Paralelo:</td><td>{selected.parallelEntity?.code}</td></tr>
            </tbody>
          </table>

          <table className="table" style={{ fontSize: 12.5 }}>
            <thead>
              <tr>
                <th>Nº</th>
                <th>Estudiante</th>
                <th>CI</th>
                <th>1er Parcial</th>
                <th>2do Parcial</th>
                <th>Prácticas</th>
                <th>Examen Final</th>
                <th>Nota Final</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {assignGrades.length === 0 && (
                <tr><td colSpan={9} className="text-muted">Sin calificaciones registradas para esta asignación.</td></tr>
              )}
              {assignGrades.map((g, i) => (
                <tr key={g.id}>
                  <td>{i + 1}</td>
                  <td>{g.student?.person?.firstName} {g.student?.person?.lastName}</td>
                  <td>{g.student?.person?.ci}</td>
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

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 48, fontSize: 12.5 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ marginBottom: 60 }}>_________________________</div>
              <div>Firma Docente</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ marginBottom: 60 }}>_________________________</div>
              <div>Secretaría Académica</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ marginBottom: 60 }}>_________________________</div>
              <div>Dirección Académica</div>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          #centralizer-document, #centralizer-document * { visibility: visible; }
          #centralizer-document { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>
    </div>
  );
}