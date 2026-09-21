'use client';

import { useEffect, useState } from 'react';
import { apiGet, apiPost, extractError } from '@/lib/api';
import { Student, AcademicHistoryRecord, Subject, Institution, Certificate, CertificateType } from '@/lib/types';
import { generateInstitutionalDocument } from '@/lib/documents';
import { PageHeader } from '@/components/ui/page-header';
import { LoadingState, ErrorState } from '@/components/ui/state';

type DocType = 'NOTES' | 'STUDIES' | 'REGULAR' | 'ENROLLMENT' | 'HISTORY' | 'ASIGNACION';

const DOC_TYPES: Array<{ key: DocType; label: string }> = [
  { key: 'NOTES', label: 'Certificado de notas' },
  { key: 'STUDIES', label: 'Certificado de estudios' },
  { key: 'REGULAR', label: 'Certificado de estudiante regular' },
  { key: 'ENROLLMENT', label: 'Constancia de matrícula' },
  { key: 'HISTORY', label: 'Historial académico' },
  { key: 'ASIGNACION', label: 'Boleta de asignación' },
];

const CERTIFICATE_TYPE_LABELS: Record<CertificateType, string> = {
  NOTES: 'Certificado de notas',
  STUDIES: 'Certificado de estudios',
  REGULAR: 'Certificado de estudiante regular',
  ENROLLMENT: 'Constancia de matrícula',
  HISTORY: 'Historial académico',
  DIPLOMA: 'Diploma',
};

function roman(n: number): string {
  const map: Array<[number, string]> = [
    [10, 'X'],
    [9, 'IX'],
    [5, 'V'],
    [4, 'IV'],
    [1, 'I'],
  ];
  let result = '';
  let value = n;
  for (const [num, sym] of map) {
    while (value >= num) {
      result += sym;
      value -= num;
    }
  }
  return result || String(n);
}

export default function CertificatesPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [history, setHistory] = useState<AcademicHistoryRecord[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [institution, setInstitution] = useState<Institution | undefined>(undefined);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [studentId, setStudentId] = useState('');
  const [docType, setDocType] = useState<DocType>('NOTES');
  const [generating, setGenerating] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [st, inst, certs] = await Promise.all([
        apiGet<Student[]>('/students'),
        apiGet<Institution[]>('/institutions'),
        apiGet<Certificate[]>('/certificates'),
      ]);
      setStudents(st);
      setInstitution(inst[0]);
      setCertificates(certs);
    } catch (err) {
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  }

  async function loadCertificates() {
    try {
      const certs = await apiGet<Certificate[]>('/certificates');
      setCertificates(certs);
    } catch (err) {
      setError(extractError(err));
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function loadStudent(id: string) {
    setStudentId(id);
    try {
      setHistory(await apiGet<AcademicHistoryRecord[]>(`/academic-history/student/${id}`));
      const stu = students.find((s) => s.id === id);
      if (stu?.careerId) {
        setSubjects(await apiGet<Subject[]>(`/subjects/career/${stu.careerId}`));
      } else {
        setSubjects([]);
      }
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

  const sortedSubjects = [...subjects].sort(
    (a, b) => a.semester - b.semester || a.code.localeCompare(b.code),
  );
  const maxSemester = subjects.length > 0 ? Math.max(...subjects.map((s) => s.semester)) : 4;
  const sortedHistory = [...history].sort((a, b) =>
    Number(b.academicPeriod?.year) - Number(a.academicPeriod?.year));
  const currentYear = sortedHistory[0]?.academicPeriod?.year
    ? Number(sortedHistory[0].academicPeriod.year)
    : new Date().getFullYear();
  const entryYear = currentYear - Math.floor(((student?.currentLevel ?? 1) - 1) / 2);
  const numYears = Math.max(1, Math.ceil(maxSemester / 2));
  const years = Array.from({ length: numYears }, (_, i) => entryYear + i);

  const cellMap = new Map<string, AcademicHistoryRecord>();
  history.forEach((h) => {
    if (h.subject?.code && h.academicPeriod) {
      cellMap.set(`${h.academicPeriod.year}|${h.academicPeriod.sequence}|${h.subject.code}`, h);
    }
  });

  const historyKey = (y: number, s: number, code: string) => `${y}|${s}|${code}`;
  const recordsOf = (code: string) => history.filter((h) => h.subject?.code === code);
  const isPassed = (code: string) => recordsOf(code).some((r) => r.status === 'APPROVED');
  const isTaken = (code: string) => recordsOf(code).length > 0;

  const entrySeqs = history
    .filter((h) => Number(h.academicPeriod?.year) === entryYear)
    .map((h) => h.academicPeriod?.sequence ?? 1);
  const entrySeq = entrySeqs.length > 0 ? Math.min(...entrySeqs) : 1;
  const entryLabel = `${roman(entrySeq)}/${entryYear}`;

  const curPeriod = sortedHistory[0]?.academicPeriod;
  const boletaPeriodLabel = curPeriod?.year
    ? `${roman(Number(curPeriod.sequence))}/${curPeriod.year}`
    : '____';
  const currentHist = history
    .filter(
      (h) =>
        h.academicPeriod &&
        Number(h.academicPeriod.year) === Number(curPeriod?.year) &&
        h.academicPeriod.sequence === curPeriod?.sequence,
    )
    .sort(
      (a, b) =>
        (a.semester - b.semester) ||
        (a.subject?.code ?? '').localeCompare(b.subject?.code ?? ''),
    );

  const inscripcionStamp = new Date().toLocaleString('es-BO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  function gradeCell(y: number, seq: number, code: string) {
    const rec = cellMap.get(historyKey(y, seq, code));
    return rec ? <strong>{rec.finalGrade ?? '-'}</strong> : <span className="text-muted">—</span>;
  }

  function print() {
    window.print();
  }

  async function generatePdf() {
    if (!student) return;
    setGenerating(true);
    try {
      const backendCert = await apiPost<Certificate>('/certificates', {
        certificateType: docType === 'ASIGNACION' ? 'NOTES' : docType,
        studentId: student.id,
        metadata: { docType },
      });

      await generateInstitutionalDocument({
        docType,
        student,
        history,
        subjects,
        institution,
        verificationCode: backendCert.verificationCode,
        documentNumber: backendCert.documentNumber,
      });

      await loadCertificates();
    } catch (err) {
      setError(extractError(err));
    } finally {
      setGenerating(false);
    }
  }

  const titleFor = (t: DocType) =>
    t === 'NOTES'
      ? 'CERTIFICADO DE NOTAS'
      : t === 'STUDIES'
        ? 'CERTIFICADO DE ESTUDIOS'
        : t === 'REGULAR'
          ? 'CERTIFICADO DE ESTUDIANTE REGULAR'
          : t === 'ENROLLMENT'
            ? 'CONSTANCIA DE MATRÍCULA'
            : t === 'HISTORY'
              ? 'HISTORIAL ACADÉMICO'
              : `BOLETA DE ASIGNACIÓN ${boletaPeriodLabel}`;

  if (loading) return <LoadingState />;

  return (
    <div>
      <PageHeader
        title="Certificados y Documentos"
        subtitle="Generación de documentos institucionales"
        actions={
          <>
            <button className="btn btn-primary" onClick={generatePdf} disabled={!student || generating}>
              {generating ? 'Generando…' : 'Generar PDF'}
            </button>
            <button className="btn btn-outline" onClick={print} disabled={!student}>
              Imprimir
            </button>
          </>
        }
      />

      {error && <ErrorState message={error} />}

      <div className="card card-pad mb-3">
        <div className="flex gap-3 items-center" style={{ flexWrap: 'wrap' }}>
          <select className="select" style={{ flex: 1, minWidth: 240 }} value={studentId} onChange={(e) => e.target.value && loadStudent(e.target.value)}>
            <option value="">Seleccionar estudiante…</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.studentCode} — {s.person?.firstName} {s.person?.lastName}
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
        <div
          className="card"
          id="certificate-document"
          style={{ padding: 48, background: '#fff', border: '2px solid var(--border)', maxWidth: docType === 'HISTORY' || docType === 'ASIGNACION' ? 1000 : 820, margin: '0 auto' }}
        >
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <h2 style={{ fontSize: 17, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.02 }}>
              Instituto Tecnológico &quot;Boliviana de Tecnología&quot;
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

          {docType === 'ASIGNACION' ? (
            <>
              <div style={{ textAlign: 'center', fontSize: 13.5, fontWeight: 700, marginBottom: 14 }}>
                SISTEMA DE GESTIÓN ACADÉMICA INSTITUCIONAL – SIGAI
              </div>
              <div style={{ textAlign: 'center', fontSize: 12, fontWeight: 600, letterSpacing: 2, marginBottom: 20 }}>
                ORIGINAL PARA ESTUDIANTE
              </div>

              <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>DATOS DEL ESTUDIANTE</p>
              <table style={{ width: '100%', fontSize: 12.5, marginBottom: 18 }}>
                <tbody>
                  <tr>
                    <td style={{ width: '18%', padding: '3px 0' }}>C.I.:</td>
                    <td style={{ width: '32%', fontWeight: 700 }}>{student.person?.ci} {student.person?.ciExtension ? `(${student.person?.ciExtension})` : ''}</td>
                    <td style={{ width: '18%', padding: '3px 0' }}>FILIAL:</td>
                    <td style={{ width: '32%', fontWeight: 700 }}>Central El Alto</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '3px 0' }}>APELLIDO PATERNO:</td>
                    <td style={{ fontWeight: 700 }}>{student.person?.paternalSurname ?? '—'}</td>
                    <td style={{ padding: '3px 0' }}>APELLIDO MATERNO:</td>
                    <td style={{ fontWeight: 700 }}>{student.person?.maternalSurname ?? '—'}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '3px 0' }}>NOMBRES:</td>
                    <td style={{ fontWeight: 700 }}>{student.person?.firstName}</td>
                    <td style={{ padding: '3px 0' }}>NRO. FOLDER:</td>
                    <td style={{ fontWeight: 700 }}>{student.studentCode}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '3px 0' }}>CARRERA:</td>
                    <td style={{ fontWeight: 700 }}>{student.career?.name ?? '—'}</td>
                    <td style={{ padding: '3px 0' }}>GESTIÓN DE INGRESO:</td>
                    <td style={{ fontWeight: 700 }}>{entryLabel}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '3px 0' }}>NRO. TIT. BACHILLER:</td>
                    <td>{student.diplomaNumber ? student.diplomaNumber : '—'}</td>
                    <td style={{ padding: '3px 0' }}>PLAN:</td>
                    <td>{student.career?.code ?? '—'}</td>
                  </tr>
                </tbody>
              </table>

              <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>DATOS DE ACCESO POR SISTEMA</p>
              <table style={{ width: '100%', fontSize: 12.5, marginBottom: 18 }}>
                <tbody>
                  <tr>
                    <td style={{ width: '18%', padding: '3px 0' }}>CUENTA:</td>
                    <td style={{ width: '32%', fontWeight: 700 }}>{student.person?.ci}</td>
                    <td style={{ width: '18%', padding: '3px 0' }}>FECHA DE INSCRIPCIÓN:</td>
                    <td style={{ fontWeight: 700 }}>{inscripcionStamp}</td>
                  </tr>
                </tbody>
              </table>
              <p style={{ fontSize: 11.5, color: 'var(--text-muted)', marginBottom: 18 }}>
                La contraseña inicial es su número de C.I. y deberá cambiarla en el primer ingreso al sistema.
              </p>

              <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>MATERIAS INSCRITAS</p>
              <table className="table" style={{ fontSize: 12.5, marginBottom: 10 }}>
                <thead>
                  <tr>
                    <th style={{ width: 40 }}>N.º</th>
                    <th style={{ width: 90 }}>CÓDIGO</th>
                    <th>MATERIA</th>
                    <th style={{ width: 50 }}>SEM</th>
                    <th style={{ width: 50 }}>PAR</th>
                    <th style={{ width: 50 }}>TUR</th>
                  </tr>
                </thead>
                <tbody>
                  {currentHist.length === 0 && (
                    <tr><td colSpan={6} className="text-muted">Sin materias asignadas para la gestión.</td></tr>
                  )}
                  {currentHist.map((h, i) => (
                    <tr key={h.id}>
                      <td style={{ textAlign: 'center' }}>{i + 1}</td>
                      <td style={{ fontWeight: 600 }}>{h.subject?.code ?? '—'}</td>
                      <td>{h.subject?.name ?? '—'}</td>
                      <td style={{ textAlign: 'center' }}>{h.semester}</td>
                      <td style={{ textAlign: 'center' }}>A</td>
                      <td style={{ textAlign: 'center' }}>T</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p style={{ fontSize: 11.5, color: 'var(--text-muted)', marginBottom: 18 }}>
                PAR: Paralelo · TUR: Turno
              </p>

              <p style={{ fontSize: 11.5, color: 'var(--text-muted)', marginBottom: 18 }}>
                El interesado debe verificar que todos los datos sean correctos antes de firmar.
                La institución no se hará responsable por datos incorrectos para trámites posteriores.
              </p>

              <div style={{ fontSize: 12.5, lineHeight: 1.6, marginBottom: 24 }}>
                <strong>Instituto Tecnológico &quot;Boliviana de Tecnología&quot;</strong>
                <div>R.M. 1049/2023</div>
                <div>Dirección: El Alto, Av. de los Héroes, Z. Ferropetrol N.º 11</div>
                <div>Teléfono: 75252479</div>
              </div>

              <p style={{ fontSize: 12.5, marginBottom: 56 }}>
                Lugar y fecha: El Alto, ____ de ___ de {curPeriod?.year ?? new Date().getFullYear()}.
              </p>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ marginBottom: 8 }}>_________________________</div>
                  <div>Firma del estudiante</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ marginBottom: 8 }}>_________________________</div>
                  <div>Sello de la institución</div>
                </div>
              </div>
            </>
          ) : docType === 'HISTORY' ? (
            <>
              <div style={{ fontSize: 13, lineHeight: 1.9, marginBottom: 14 }}>
                <p>Institución: <strong>Instituto Tecnológico &quot;Boliviana de Tecnología&quot;</strong></p>
                <p>Documento: <strong>Historial Académico</strong></p>
                <p>Carrera: <strong>{student.career?.name ?? '—'}</strong></p>
              </div>

              <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Datos del estudiante:</p>
              <table style={{ width: '100%', fontSize: 12.5, marginBottom: 18 }}>
                <tbody>
                  <tr><td style={{ width: 160, padding: '3px 0' }}>Nombre:</td><td style={{ fontWeight: 700 }}>{student.person?.firstName} {student.person?.lastName}</td></tr>
                  <tr><td style={{ padding: '3px 0' }}>C.I.:</td><td>{student.person?.ci} {student.person?.ciExtension ? `(${student.person?.ciExtension})` : ''}</td></tr>
                  <tr><td style={{ padding: '3px 0' }}>Celular:</td><td>{student.person?.phone ?? '—'}</td></tr>
                  <tr><td style={{ padding: '3px 0' }}>Ingreso:</td><td>{entryLabel}</td></tr>
                  <tr><td style={{ padding: '3px 0' }}>Matrícula:</td><td>{student.studentCode}</td></tr>
                  <tr><td style={{ padding: '3px 0' }}>Plan:</td><td>{student.career?.code ?? '—'}</td></tr>
                  <tr><td style={{ padding: '3px 0' }}>Fecha de impresión:</td><td>{today}</td></tr>
                </tbody>
              </table>

              <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Estructura del historial</p>
              <table className="table" style={{ fontSize: 10.5, marginBottom: 16 }}>
                <thead>
                  <tr>
                    <th style={{ width: 30 }}>N.º</th>
                    <th style={{ width: 76 }}>Código</th>
                    <th>Materia</th>
                    <th style={{ width: 86 }}>Pre-Requisito</th>
                    {years.map((y) => (
                      <th key={y} colSpan={2} style={{ textAlign: 'center' }}>{y}</th>
                    ))}
                    <th style={{ width: 24 }}>A</th>
                    <th style={{ width: 24 }}>R</th>
                    <th style={{ width: 24 }}>H</th>
                  </tr>
                  <tr>
                    <th /><th /><th /><th />
                    {years.map((y) => [
                      <th key={`${y}-1`} style={{ fontSize: 9, fontWeight: 600, textAlign: 'center' }}>1.º</th>,
                      <th key={`${y}-2`} style={{ fontSize: 9, fontWeight: 600, textAlign: 'center' }}>2.º</th>,
                    ])}
                    <th /><th /><th />
                  </tr>
                </thead>
                <tbody>
                  {sortedSubjects.length === 0 && (
                    <tr><td colSpan={4 + years.length * 2 + 3} className="text-muted">Sin plan de estudios cargado.</td></tr>
                  )}
                  {sortedSubjects.map((s, i) => (
                    <tr key={s.id}>
                      <td style={{ textAlign: 'center' }}>{i + 1}</td>
                      <td style={{ fontWeight: 600 }}>{s.code}</td>
                      <td>{s.name}</td>
                      <td>{s.prerequisites && s.prerequisites.length > 0 ? s.prerequisites.join(', ') : '—'}</td>
                      {years.map((y) => [
                        <td key={`${s.id}-${y}-1`} style={{ textAlign: 'center' }}>{gradeCell(y, 1, s.code)}</td>,
                        <td key={`${s.id}-${y}-2`} style={{ textAlign: 'center' }}>{gradeCell(y, 2, s.code)}</td>,
                      ])}
                      <td style={{ textAlign: 'center', fontWeight: 700, color: '#1a7f37' }}>{isPassed(s.code) ? 'A' : ''}</td>
                      <td style={{ textAlign: 'center', fontWeight: 700, color: '#c62828' }}>{isTaken(s.code) && !isPassed(s.code) ? 'R' : ''}</td>
                      <td style={{ textAlign: 'center', fontWeight: 700, color: '#1565c0' }}>{isPassed(s.code) ? 'H' : ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                En cada año se manejan dos periodos/semestres (1.º y 2.º). Las notas corresponden al periodo donde se cursó la materia.
                <strong> A</strong>: Aprobada · <strong>R</strong>: Reprobada · <strong>H</strong>: Habilitado/a para cursar las materias del próximo semestre.
              </p>
            </>
          ) : (
            <>
              <table style={{ width: '100%', fontSize: 13.5, marginBottom: 20 }}>
                <tbody>
                  <tr>
                    <td style={{ width: 220, padding: '4px 0' }}>Nº de documento:</td>
                    <td style={{ fontWeight: 700 }}>{docNumber}</td>
                  </tr>
                  <tr><td style={{ padding: '4px 0' }}>Estudiante:</td><td style={{ fontWeight: 700 }}>{student.person?.firstName} {student.person?.lastName}</td></tr>
                  <tr><td style={{ padding: '4px 0' }}>CI:</td><td>{student.person?.ci} {student.person?.ciExtension ? `(${student.person?.ciExtension})` : ''}</td></tr>
                  <tr><td style={{ padding: '4px 0' }}>Código de estudiante:</td><td>{student.studentCode}</td></tr>
                  <tr><td style={{ padding: '4px 0' }}>Carrera:</td><td>{student.career?.name ?? '—'}</td></tr>
                  <tr><td style={{ padding: '4px 0' }}>Nivel actual:</td><td>{student.currentLevel}º semestre</td></tr>
                  <tr><td style={{ padding: '4px 0' }}>Estado académico:</td><td>{student.status}</td></tr>
                  {(docType === 'ENROLLMENT' || docType === 'REGULAR') && (
                    <tr><td style={{ padding: '4px 0' }}>Gestión:</td><td>{curPeriod?.periodName ?? '2026'}</td></tr>
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
                  Se certifica que el (la) estudiante <strong>{student.person?.firstName} {student.person?.lastName}</strong>,
                  con CI {student.person?.ci}, es estudiante regular de la carrera de{' '}
                  <strong>{student.career?.name ?? '—'}</strong> en el nivel {student.currentLevel}º semestre,
                  habiendo aprobado <strong>{approved}</strong> materias y reprobado <strong>{failed}</strong> de un total de{' '}
                  <strong>{history.length}</strong> materias cursadas, con un promedio general de{' '}
                  <strong>{avg}</strong> sobre 100.
                </p>
              )}

              {docType === 'REGULAR' && (
                <p style={{ fontSize: 13, lineHeight: 1.7 }}>
                  Se certifica que el (la) estudiante <strong>{student.person?.firstName} {student.person?.lastName}</strong>,
                  portador(a) del CI {student.person?.ci}, código {student.studentCode}, cursa la carrera de{' '}
                  <strong>{student.career?.name ?? '—'}</strong> durante la gestión{' '}
                  <strong>{curPeriod?.periodName ?? '2026'}</strong>, encontrándose en situación regular.
                </p>
              )}

              {docType === 'ENROLLMENT' && (
                <p style={{ fontSize: 13, lineHeight: 1.7 }}>
                  Se hace constar que el (la) estudiante <strong>{student.person?.firstName} {student.person?.lastName}</strong>,
                  CI {student.person?.ci}, código {student.studentCode}, está matriculado(a) en la carrera de{' '}
                  <strong>{student.career?.name ?? '—'}</strong>, en el {student.currentLevel}º semestre,
                  correspondiente a la gestión académica 2026, en la modalidad vigente de la institución.
                </p>
              )}
            </>
          )}

{docType !== 'ASIGNACION' && (
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
        )}
        </div>
      )}

      <div style={{ marginTop: 40, padding: '20px 0', borderTop: '2px solid var(--border)' }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Certificados Emitidos</h3>
        {certificates.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No hay certificados emitidos todavía.</p>
        ) : (
          <table className="table" style={{ fontSize: 13 }}>
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Nº Documento</th>
                <th>Estudiante</th>
                <th>Código Verificación</th>
                <th>Estado</th>
                <th>Fecha de Emisión</th>
              </tr>
            </thead>
            <tbody>
              {certificates.map((cert) => (
                <tr key={cert.id}>
                  <td>{CERTIFICATE_TYPE_LABELS[cert.certificateType] || cert.certificateType}</td>
                  <td><code style={{ fontSize: 11 }}>{cert.documentNumber}</code></td>
                  <td>{cert.student?.person?.firstName} {cert.student?.person?.lastName}</td>
                  <td><code style={{ fontSize: 10 }}>{cert.verificationCode}</code></td>
                  <td>
                    <span className={`badge badge-${cert.status === 'ACTIVE' ? 'success' : cert.status === 'REVOKED' ? 'error' : 'neutral'}`}>
                      {cert.status === 'ACTIVE' ? 'Activo' : cert.status === 'REVOKED' ? 'Revocado' : 'Expirado'}
                    </span>
                  </td>
                  <td>{new Date(cert.issuedAt).toLocaleDateString('es-BO')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        ${docType === 'HISTORY' ? '@page { size: A4 landscape; margin: 10mm; }' : ''}
        @media print {
          body * { visibility: hidden; }
          #certificate-document, #certificate-document * { visibility: visible; }
          #certificate-document { position: absolute; left: 0; top: 0; width: 100%; border: none !important; }
        }
      `,
        }}
      />
    </div>
  );
}