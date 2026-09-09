'use client';

import { useEffect, useState } from 'react';
import { apiGet, extractError } from '@/lib/api';
import { Student, AcademicHistoryRecord } from '@/lib/types';
import { PageHeader } from '@/components/ui/page-header';
import { LoadingState, ErrorState } from '@/components/ui/state';

type DocType = 'NOTES' | 'STUDIES' | 'REGULAR' | 'ENROLLMENT';

const DOC_TYPES: Array<{ key: DocType; label: string }> = [
  { key: 'NOTES', label: 'Certificado de notas' },
  { key: 'STUDIES', label: 'Certificado de estudios' },
  { key: 'REGULAR', label: 'Certificado de estudiante regular' },
  { key: 'ENROLLMENT', label: 'Constancia de matrícula' },
];

export default function CertificatesPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [history, setHistory] = useState<AcademicHistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [studentId, setStudentId] = useState('');
  const [docType, setDocType] = useState<DocType>('NOTES');

  async function load() {
    setLoading(true);
    try {
      setStudents(await apiGet<Student[]>('/students'));
    } catch (err) {
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function loadStudent(id: string) {
    setStudentId(id);
    try {
      setHistory(await apiGet<AcademicHistoryRecord[]>(`/academic-history/student/${id}`));
    } catch (err) {
      setError(extractError(err));
    }
  }

  const student = students.find((s) => s.id === studentId);
  const approved = history.filter((h) => h.status === 'APPROVED').length;
  const failed = history.filter((h) => h.status === 'FAILED').length;
  const avg =
    history.length > 0
      ? (history.reduce((acc, h) => acc + (h.finalGrade ?? 0), 0) / history.length).toFixed(2)
      : '—';

  const today = new Date().toLocaleDateString('es-BO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const docNumber = `DOC-${String(Math.floor(Math.random() * 9000) + 1000)}-SGA`;

  function print() {
    window.print();
  }

  const titleFor = (t: DocType) =>
    t === 'NOTES'
      ? 'CERTIFICADO DE NOTAS'
      : t === 'STUDIES'
        ? 'CERTIFICADO DE ESTUDIOS'
        : t === 'REGULAR'
          ? 'CERTIFICADO DE ESTUDIANTE REGULAR'
          : 'CONSTANCIA DE MATRÍCULA';

  if (loading) return <LoadingState />;

  return (
    <div>
      <PageHeader
        title="Certificados y Documentos"
        subtitle="Generación de documentos institucionales"
        actions={
          <button className="btn btn-primary" onClick={print} disabled={!student}>
            🖨️ Imprimir
          </button>
        }
      />

      {error && <ErrorState message={error} />}

      <div className="card card-pad mb-3">
        <div className="flex gap-3 items-center" style={{ flexWrap: 'wrap' }}>
          <select className="select" style={{ flex: 1, minWidth: 240 }} value={studentId} onChange={(e) => e.target.value && loadStudent(e.target.value)}>
            <option value="">Seleccionar estudiante…</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.studentCode} — {s.firstName} {s.lastName}
              </option>
            ))}
          </select>
          <select className="select" style={{ width: 260 }} value={docType} onChange={(e) => setDocType(e.target.value as DocType)}>
            {DOC_TYPES.map((d) => (
              <option key={d.key} value={d.key}>{d.label}</option>
            ))}
          </select>
        </div>
      </div>

      {student && (
        <div className="card" id="certificate-document" style={{ padding: 48, background: '#fff', border: '2px solid var(--border)', maxWidth: 820, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <h2 style={{ fontSize: 17, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.02 }}>
              Instituto Tecnológico Boliviana de Tecnología
            </h2>
            <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
              Sistema de Gestión Académica · {today}
            </div>
          </div>

          <div style={{ textAlign: 'center', margin: '24px 0', borderTop: '2px solid var(--text)', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: 21, fontWeight: 800, padding: '10px 0', letterSpacing: 0.06 }}>
              {titleFor(docType)}
            </h3>
          </div>

          <table style={{ width: '100%', fontSize: 13.5, marginBottom: 20 }}>
            <tbody>
              <tr>
                <td style={{ width: 220, padding: '4px 0' }}>Nº de documento:</td>
                <td style={{ fontWeight: 700 }}>{docNumber}</td>
              </tr>
              <tr><td style={{ padding: '4px 0' }}>Estudiante:</td><td style={{ fontWeight: 700 }}>{student.firstName} {student.lastName}</td></tr>
              <tr><td style={{ padding: '4px 0' }}>CI:</td><td>{student.ci} {student.ciExtension ? `(${student.ciExtension})` : ''}</td></tr>
              <tr><td style={{ padding: '4px 0' }}>Código de estudiante:</td><td>{student.studentCode}</td></tr>
              <tr><td style={{ padding: '4px 0' }}>Carrera:</td><td>{student.career?.name ?? '—'}</td></tr>
              <tr><td style={{ padding: '4px 0' }}>Nivel actual:</td><td>{student.currentLevel}º semestre</td></tr>
              <tr><td style={{ padding: '4px 0' }}>Estado académico:</td><td>{student.status}</td></tr>
              {(docType === 'ENROLLMENT' || docType === 'REGULAR') && (
                <tr><td style={{ padding: '4px 0' }}>Gestión:</td><td>{student.currentPeriod?.periodName ?? '2026'}</td></tr>
              )}
            </tbody>
          </table>

          {docType === 'NOTES' && (
            <>
              <p style={{ fontSize: 13, marginBottom: 12 }}>
                Se certifica que el (la) estudiante ha cursado las siguientes materias:
              </p>
              <table className="table" style={{ fontSize: 12.5, marginBottom: 16 }}>
                <thead>
                  <tr>
                    <th>Gestión</th>
                    <th>Semestre</th>
                    <th>Materia</th>
                    <th>Nota final</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {history.length === 0 && (
                    <tr><td colSpan={5} className="text-muted">Sin materias cursadas.</td></tr>
                  )}
                  {history.map((h) => (
                    <tr key={h.id}>
                      <td>{h.academicPeriod?.periodName ?? '—'}</td>
                      <td>{h.semester}º</td>
                      <td>{h.subject?.name ?? '—'}</td>
                      <td><strong>{h.finalGrade ?? '-'}</strong></td>
                      <td>{h.status === 'APPROVED' ? 'Aprobado' : 'Reprobado'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p style={{ fontSize: 13 }}>
                Promedio: <strong>{avg}</strong> · Aprobadas: <strong>{approved}</strong> · Reprobadas: <strong>{failed}</strong>
              </p>
            </>
          )}

          {docType === 'STUDIES' && (
            <p style={{ fontSize: 13, lineHeight: 1.7 }}>
              Se certifica que el (la) estudiante <strong>{student.firstName} {student.lastName}</strong>,
              con CI {student.ci}, es estudiante regular de la carrera de{' '}
              <strong>{student.career?.name ?? '—'}</strong> en el nivel {student.currentLevel}º semestre,
              habiendo aprobado <strong>{approved}</strong> materias y reprobado <strong>{failed}</strong> de un total de{' '}
              <strong>{history.length}</strong> materias cursadas, con un promedio general de{' '}
              <strong>{avg}</strong> sobre 100.
            </p>
          )}

          {docType === 'REGULAR' && (
            <p style={{ fontSize: 13, lineHeight: 1.7 }}>
              Se certifica que el (la) estudiante <strong>{student.firstName} {student.lastName}</strong>,
              portador(a) del CI {student.ci}, código {student.studentCode}, cursa la carrera de{' '}
              <strong>{student.career?.name ?? '—'}</strong> durante la gestión{' '}
              <strong>{student.currentPeriod?.periodName ?? '2026'}</strong>, encontrándose en situación regular.
            </p>
          )}

          {docType === 'ENROLLMENT' && (
            <p style={{ fontSize: 13, lineHeight: 1.7 }}>
              Se hace constar que el (la) estudiante <strong>{student.firstName} {student.lastName}</strong>,
              CI {student.ci}, código {student.studentCode}, está matriculado(a) en la carrera de{' '}
              <strong>{student.career?.name ?? '—'}</strong>, en el {student.currentLevel}º semestre,
              correspondiente a la gestión académica 2026, en la modalidad vigente de la institución.
            </p>
          )}

          <div style={{ marginTop: 40, display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ marginBottom: 56 }}>_________________________</div>
              <div>Secretaría Académica</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ marginBottom: 56 }}>_________________________</div>
              <div>Dirección Académica</div>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          #certificate-document, #certificate-document * { visibility: visible; }
          #certificate-document { position: absolute; left: 0; top: 0; width: 100%; border: none !important; }
        }
      `}</style>
    </div>
  );
}