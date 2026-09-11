'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { apiGet, apiPost, extractError } from '@/lib/api';
import { Enrollment, Student, AcademicPeriod, Institution, Deposit } from '@/lib/types';
import {
  downloadEnrollmentCredential,
  buildQrDataUrl,
  fullSurname,
  fullSurnames,
  institutionSede,
  emergencyPhone,
  studyRegime,
  ciText,
  formatDate,
} from '@/lib/credential';
import { PageHeader } from '@/components/ui/page-header';
import { StatusBadge } from '@/components/ui/badge';
import { LoadingState, ErrorState } from '@/components/ui/state';

const HABILITADO_STATUSES = new Set(['VERIFIED', 'APPROVED']);

const NAVY = '#14213d';
const GOLD = '#c89b3c';
const CREAM = '#faf7f1';

function Row({ label, value, small, big, golden }: { label: string; value: string; small?: boolean; big?: boolean; golden?: boolean }) {
  return (
    <div>
      <div style={{ fontSize: small ? 6 : 6.5, color: '#8a8a8a', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
      <div
        style={{
          fontSize: big ? 15 : small ? 9.5 : 11.5,
          fontWeight: 800,
          color: golden ? NAVY : '#141414',
          lineHeight: 1.2,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function LogoBox({ url, size = 30 }: { url?: string; size?: number }) {
  const [broken, setBroken] = useState(false);
  if (!url || broken) {
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          background: '#fff',
          color: NAVY,
          fontWeight: 800,
          fontSize: size * 0.42,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        I
      </div>
    );
  }
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 4,
        overflow: 'hidden',
        flexShrink: 0,
        background: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt="" onError={() => setBroken(true)} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
    </div>
  );
}

function PhotoBox({ url }: { url?: string }) {
  const [broken, setBroken] = useState(false);
  const size = 119;
  const box = {
    width: size,
    height: size,
    border: `1.5px solid ${NAVY}`,
    flexShrink: 0,
    background: '#fff',
  } as const;
  if (!url || broken) {
    return (
      <div style={{ ...box, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: 9, fontStyle: 'italic' }}>
        FOTOGRAFÍA
      </div>
    );
  }
  return (
    <div style={{ ...box, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt="" onError={() => setBroken(true)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    </div>
  );
}

function CredentialPreview({
  enrollment,
  institution,
  qr,
}: {
  enrollment: Enrollment;
  institution?: Institution;
  qr: string | null;
}) {
  const student = enrollment.student;
  const instName = institution?.name || 'Instituto Tecnológico \u201CBoliviana de Tecnología\u201D';
  const year = enrollment.academicPeriod?.year || String(new Date().getFullYear());
  const periodName = enrollment.academicPeriod?.periodName || `Gestión ${year}`;
  const surnames = fullSurnames(student);
  const firstName = student?.firstName || '—';
  const careerName = enrollment.career?.name || '—';
  const fecha = formatDate(enrollment.enrollmentDate);
  const band = { height: 50, background: NAVY, color: '#fff', display: 'flex', alignItems: 'center', gap: 10, padding: '0 12px' } as const;

  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1.3);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const BASE_WIDTH = 340 * 2 + 24;
    const update = () => {
      const available = el.clientWidth - 48;
      const next = Math.min(Math.max(available / BASE_WIDTH, 1), 1.45);
      setZoom(next);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="card mb-3" style={{ padding: 24, background: '#fff' }} ref={containerRef}>
      <div className="text-muted text-sm mb-3">
        {enrollment.student ? `${student?.firstName} ${fullSurname(enrollment.student)}` : '—'} · {enrollment.enrollmentNumber}
      </div>

      <div id="credential-document" className="flex" style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'flex-start', gap: 24, zoom }}>
        {/* FRENTE */}
        <div className="cred-card" style={{ background: CREAM }}>
          <div style={band}>
            <LogoBox url={institution?.logoUrl} size={30} />
            <div style={{ minWidth: 0, flex: 1, paddingRight: 96 }}>
              <div style={{ fontSize: 10, fontWeight: 800, lineHeight: 1.15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {instName.toUpperCase()}
              </div>
              <div style={{ fontSize: 7.5, color: '#bcc2d6', fontWeight: 600, marginTop: 4 }}>CREDENCIAL DE MATRÍCULA · Gestión {year}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 14, padding: '10px 12px', flex: 1 }}>
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <Row label="N.º de matrícula (Registro único)" value={enrollment.enrollmentNumber} big golden />
              <Row label="Apellidos" value={surnames} />
              <Row label="Nombres" value={firstName} />
              <Row label="Carrera" value={careerName} />
              <Row label="Fecha" value={fecha} />
            </div>
            <PhotoBox url={student?.photoUrl} />
          </div>
          <div
            style={{
              position: 'absolute',
              top: 6,
              right: 6,
              background: GOLD,
              color: NAVY,
              borderRadius: 6,
              padding: '4px 10px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 7, fontWeight: 700, letterSpacing: 0.5 }}>GESTIÓN</div>
            <div style={{ fontSize: 12, fontWeight: 800 }}>{periodName}</div>
          </div>
        </div>

        {/* PARTE POSTERIOR */}
        <div className="cred-card" style={{ background: CREAM }}>
          <div style={band}>
            <LogoBox url={institution?.logoUrl} size={30} />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 10, fontWeight: 800, lineHeight: 1.15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {instName.toUpperCase()}
              </div>
              <div style={{ fontSize: 7.5, color: '#bcc2d6', fontWeight: 600, marginTop: 4 }}>PARTE POSTERIOR</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, padding: '10px 12px', flex: 1 }}>
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <Row label="Apellidos" value={surnames} small />
              <Row label="Nombres" value={firstName} small />
              <Row label="Carrera" value={careerName} small />
              <Row label="Nivel" value={student?.currentLevel ? `Nivel ${student.currentLevel}` : '—'} small />
              <Row label="Gestión actual" value={periodName} small />
              <Row label="Régimen" value={studyRegime(enrollment.career)} small />
            </div>
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <Row label="Fecha" value={fecha} small />
              <Row label="C. de identidad" value={ciText(student)} small />
              <Row label="Registro único" value={enrollment.enrollmentNumber} small />
              <Row label="Tel. emergencia" value={emergencyPhone(student)} small />
              <Row label="Sede" value={institutionSede(institution)} small />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0, justifyContent: 'center' }}>
              {qr && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={qr} alt="QR" style={{ width: 92, height: 92 }} />
              )}
              <span style={{ fontSize: 6.5, color: '#888', fontStyle: 'italic', textAlign: 'center' }}>Código QR de verificación</span>
            </div>
          </div>
          <div className="cred-footer">
            <div style={{ fontSize: 7, color: '#777' }}>{instName.toUpperCase()} · R.M. 1049/2023 · Gestión {year}</div>
          </div>
        </div>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media print {
          body * { visibility: hidden; }
          #credential-document, #credential-document * { visibility: visible; }
          #credential-document { position: absolute; left: 0; top: 0; width: 100%; zoom: 1 !important; flex-direction: column !important; }
          .cred-card { width: 80mm !important; height: auto !important; }
        }
      `,
        }}
      />
    </div>
  );
}

export default function EnrollmentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [periods, setPeriods] = useState<AcademicPeriod[]>([]);
  const [institution, setInstitution] = useState<Institution | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [periodId, setPeriodId] = useState('');
  const [studentId, setStudentId] = useState('');
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [st, deps, ens, ps, inst] = await Promise.all([
        apiGet<Student[]>('/students'),
        apiGet<Deposit[]>('/deposits'),
        apiGet<Enrollment[]>('/enrollments'),
        apiGet<AcademicPeriod[]>('/academic-periods'),
        apiGet<Institution[]>('/institutions'),
      ]);
      setStudents(st);
      setDeposits(deps);
      setEnrollments(ens);
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

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    setStudentId('');
    setEnrollment(null);
    setQr(null);
  }, [periodId]);

  useEffect(() => {
    let active = true;
    if (enrollment) {
      buildQrDataUrl(enrollment).then((q) => {
        if (active) setQr(q);
      });
    } else {
      setQr(null);
    }
    return () => {
      active = false;
    };
  }, [enrollment]);

  const bestDepositByStudent = new Map<string, Deposit>();
  for (const d of deposits) {
    if (!HABILITADO_STATUSES.has(d.status)) continue;
    const current = bestDepositByStudent.get(d.studentId);
    if (!current || depositRank(d.status) > depositRank(current.status)) {
      bestDepositByStudent.set(d.studentId, d);
    }
  }

  const habilitated = students.filter((s) => bestDepositByStudent.has(s.id));

  const enrolledKey = (sid: string, pid: string) => `${sid}|${pid}`;
  const enrolledBy = new Map<string, Enrollment>();
  for (const e of enrollments) {
    if (!enrolledBy.has(enrolledKey(e.studentId, e.academicPeriodId))) {
      enrolledBy.set(enrolledKey(e.studentId, e.academicPeriodId), e);
    }
  }

  const student = students.find((s) => s.id === studentId);

  function selectStudent(id: string) {
    setStudentId(id);
    setEnrollment(enrolledBy.get(enrolledKey(id, periodId)) ?? null);
  }

  async function registerAndPrint() {
    if (!student) return;
    setGenerating(true);
    try {
      if (!enrollment) {
        const created = await apiPost<Enrollment>('/enrollments/enroll-student', {
          studentId: student.id,
          academicPeriodId: periodId,
          semester: student.currentLevel,
        });
        const full = await apiGet<Enrollment>(`/enrollments/${created.id}`);
        setEnrollment(full);
        setEnrollments((prev) => [full, ...prev]);
        await downloadEnrollmentCredential({ enrollment: full, institution });
      } else {
        await downloadEnrollmentCredential({ enrollment, institution });
      }
    } catch (err) {
      setError(extractError(err));
    } finally {
      setGenerating(false);
    }
  }

  const selectedDeposit = student ? bestDepositByStudent.get(student.id) : undefined;
  const matriculaStatus = student
    ? enrollment
      ? `Matriculado · ${enrollment.enrollmentNumber}`
      : 'Sin matrícula en esta gestión'
    : '';

  if (loading) return <LoadingState />;

  return (
    <div>
      <PageHeader
        title="Matrículas"
        subtitle="Registro de matrículas e impresión de credenciales para estudiantes habilitados"
        actions={
          <>
            <button className="btn btn-primary" onClick={registerAndPrint} disabled={!student || generating}>
              {generating
                ? 'Generando…'
                : enrollment
                  ? 'Generar PDF'
                  : 'Registrar matrícula e imprimir'}
            </button>
            <button className="btn btn-outline" onClick={() => window.print()} disabled={!enrollment}>
              Imprimir
            </button>
          </>
        }
      />

      {error && <ErrorState message={error} />}

      <div className="card card-pad mb-3">
        <div className="flex gap-3 items-center" style={{ flexWrap: 'wrap' }}>
          <select
            className="select"
            style={{ flex: 1, minWidth: 240 }}
            value={periodId}
            onChange={(e) => setPeriodId(e.target.value)}
          >
            {periods.map((p) => (
              <option key={p.id} value={p.id}>
                {p.periodName}{p.status === 'OPEN' ? ' (Abierta)' : ' (Cerrada)'}
              </option>
            ))}
          </select>
          <select
            className="select"
            style={{ flex: 1.5, minWidth: 260 }}
            value={studentId}
            onChange={(e) => e.target.value && selectStudent(e.target.value)}
          >
            <option value="">Seleccionar estudiante habilitado…</option>
            {habilitated.map((s) => (
              <option key={s.id} value={s.id}>
                {s.studentCode} — {s.firstName} {s.lastName} · CI {s.ci}
              </option>
            ))}
          </select>
        </div>

        {student && (
          <div className="flex gap-3 items-center mt-3" style={{ flexWrap: 'wrap' }}>
            <span className="text-muted text-sm">
              Depósito: <StatusBadge value={selectedDeposit?.status ?? 'PENDING'} />
            </span>
            <span className="text-muted text-sm">
              Matrícula: <strong>{matriculaStatus}</strong>
            </span>
            {!enrollment && (
              <span className="text-muted text-sm">
                La matrícula se registrará automáticamente al pulsar el botón.
              </span>
            )}
          </div>
        )}
      </div>

      {student && enrollment && (
        <CredentialPreview
          enrollment={enrollment}
          institution={institution}
          qr={qr}
        />
      )}
    </div>
  );
}

function depositRank(status: string): number {
  return status === 'APPROVED' ? 2 : status === 'VERIFIED' ? 1 : 0;
}