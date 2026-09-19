'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { apiGet, apiPost, extractError } from '@/lib/api';
import { Enrollment, Student, AcademicPeriod, Institution, Deposit } from '@/lib/types';
import { initialsOf, fullSurname, fullSurnames, ciText, formatDate } from '@/lib/utils';
import {
  downloadEnrollmentCredential,
  downloadEnrollmentCredentialFromDom,
  buildQrDataUrl,
  institutionSede,
  emergencyPhone,
  studyRegime,
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
      <div style={{ fontSize: small ? 5.5 : 6, color: '#8a8a8a', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
      <div
        style={{
          fontSize: big ? 12.5 : small ? 8 : 9.5,
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

function splitInstName(name: string): string[] {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length <= 1) return words.length ? words : [''];
  const totalChars = words.join(' ').length;
  const half = totalChars / 2;
  const first: string[] = [];
  let acc = 0;
  for (const w of words) {
    const next = acc + (first.length ? 1 : 0) + w.length;
    if (first.length && next > half) break;
    first.push(w);
    acc = next;
  }
  return [first.join(' '), words.slice(first.length).join(' ')];
}

function LogoBox({ url, size = 50 }: { url?: string; size?: number }) {
  const src = url && url.trim() ? url : '/logo.png';
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" style={{ width: size, height: size, objectFit: 'contain', flexShrink: 0 }} />
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
      <div style={{ ...box, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f2f2f2' }}>
        <svg width="46%" height="46%" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <circle cx="32" cy="22" r="13" fill="#c4c4c4" />
          <path d="M9 62c0-13.5 10.3-22 23-22s23 8.5 23 22v2H9v-2z" fill="#c4c4c4" />
        </svg>
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

function Watermark() {
  return (
    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '58%', zIndex: 0, pointerEvents: 'none', opacity: 0.12 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.png" alt="" style={{ width: '100%', height: 'auto' }} />
    </div>
  );
}

function CredentialPreview({
  enrollment,
  institution,
  qr,
  frontRef,
  backRef,
}: {
  enrollment: Enrollment;
  institution?: Institution;
  qr: string | null;
  frontRef?: RefObject<HTMLDivElement | null>;
  backRef?: RefObject<HTMLDivElement | null>;
}) {
  const student = enrollment.student;
  const instName = institution?.name || 'Instituto Tecnológico \u201CBoliviana de Tecnología\u201D';
  const year = enrollment.academicPeriod?.year || String(new Date().getFullYear());
  const periodName = enrollment.academicPeriod?.periodName || `Gestión ${year}`;
  const surnames = fullSurnames(student);
  const firstName = student?.firstName || '—';
  const careerName = enrollment.career?.name || '—';
  const fecha = formatDate(enrollment.enrollmentDate);
  const band = { height: 62, background: '#14213d26', color: '#fff', display: 'flex', alignItems: 'center', gap: 10, padding: '0 12px', position: 'relative', zIndex: 1 } as const;
  const instLines = splitInstName(instName.toUpperCase());

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
        <div className="cred-card" style={{ background: CREAM }} ref={frontRef}>
          <Watermark />
          <div style={band}>
            <LogoBox url={institution?.logoUrl} size={50} />
            <div style={{ minWidth: 0, flex: 1, paddingRight: 64, textAlign: 'center' }}>
              {instLines.map((line, i) => (
                <div
                  key={i}
                  style={{
                    fontSize: i === instLines.length - 1 ? 11 : 10.5,
                    fontWeight: 900,
                    color: '#0c1a2b',
                    lineHeight: 1.15,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {line}
                </div>
              ))}
              <div
                style={{
                  fontSize: 9,
                  color: '#3576a3',
                  fontWeight: 700,
                  fontStyle: 'italic',
                  fontFamily: '"Noto Serif", "Times New Roman", serif',
                  fontStretch: '75%',
                  letterSpacing: 0.4,
                  marginTop: 1,
                  lineHeight: 1.15,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                }}
              >
                “Conectando Mentes, Impulsando el Progreso”
              </div>
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
              top: 31,
              right: 6,
              transform: 'translateY(-50%)',
              zIndex: 2,
              background: GOLD,
              color: NAVY,
              borderRadius: 6,
              padding: '4px 10px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 6.5, fontWeight: 700, letterSpacing: 0.5 }}>GESTIÓN</div>
            <div style={{ fontSize: 10.5, fontWeight: 800 }}>{periodName}</div>
          </div>
        </div>

        {/* PARTE POSTERIOR */}
        <div className="cred-card" style={{ background: CREAM }} ref={backRef}>
          <Watermark />
          <div style={band}>
            <LogoBox url={institution?.logoUrl} size={50} />
            <div style={{ minWidth: 0, flex: 1, textAlign: 'center' }}>
              {instLines.map((line, i) => (
                <div
                  key={i}
                  style={{
                    fontSize: i === instLines.length - 1 ? 11 : 10.5,
                    fontWeight: 900,
                    color: '#0c1a2b',
                    lineHeight: 1.15,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {line}
                </div>
              ))}
              <div
                style={{
                  fontSize: 9,
                  color: '#3576a3',
                  fontWeight: 700,
                  fontStyle: 'italic',
                  fontFamily: '"Noto Serif", "Times New Roman", serif',
                  fontStretch: '75%',
                  letterSpacing: 0.4,
                  marginTop: 1,
                  lineHeight: 1.15,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                }}
              >
                “Conectando Mentes, Impulsando el Progreso”
              </div>
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
            <div style={{ fontSize: 5.5, color: '#777' }}>{instName.toUpperCase()} · R.M. 1049/2023 · Gestión {year}</div>
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
  const [studentQuery, setStudentQuery] = useState('');
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const frontRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLDivElement>(null);

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
    setStudentQuery('');
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

  const studentIdByPersona = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of students) {
      if (s.personaId) map.set(s.personaId, s.id);
    }
    return map;
  }, [students]);

  const bestDepositByStudent = useMemo(() => {
    const map = new Map<string, Deposit>();
    for (const d of deposits) {
      if (!HABILITADO_STATUSES.has(d.status)) continue;
      const key = d.studentId ?? (d.personId ? studentIdByPersona.get(d.personId) : undefined);
      if (!key) continue;
      const current = map.get(key);
      if (!current || depositRank(d.status) > depositRank(current.status)) {
        map.set(key, d);
      }
    }
    return map;
  }, [deposits, studentIdByPersona]);

  const enrolledKey = useMemo(() => (sid: string, pid: string) => `${sid}|${pid}`, []);

  const enrolledBy = useMemo(() => {
    const map = new Map<string, Enrollment>();
    for (const e of enrollments) {
      const key = enrolledKey(e.studentId, e.academicPeriodId);
      if (!map.has(key)) map.set(key, e);
    }
    return map;
  }, [enrollments, enrolledKey]);

  const habilitated = useMemo(
    () => students.filter((s) => bestDepositByStudent.has(s.id)),
    [students, bestDepositByStudent]
  );

  const enrolledInPeriod = useMemo(
    () => enrollments.filter((e) => e.academicPeriodId === periodId),
    [enrollments, periodId]
  );

  const student = students.find((s) => s.id === studentId);

  function selectStudent(id: string) {
    setStudentId(id);
    setEnrollment(enrolledBy.get(enrolledKey(id, periodId)) ?? null);
  }

  async function registerAndPrint() {
    if (!student) return;
    setGenerating(true);
    try {
      let target = enrollment;
      if (!target) {
        const created = await apiPost<Enrollment>('/enrollments/enroll-student', {
          studentId: student.id,
          academicPeriodId: periodId,
          semester: student.currentLevel,
        });
        const full = await apiGet<Enrollment>(`/enrollments/${created.id}`);
        setEnrollment(full);
        setEnrollments((prev) => [full, ...prev]);
        target = full;
      }

      const captured = await downloadEnrollmentCredentialFromDom({
        enrollment: target,
        front: frontRef.current,
        back: backRef.current,
      });
      if (!captured) {
        await downloadEnrollmentCredential({ enrollment: target, institution });
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

  const selectedPeriod = useMemo(
    () => periods.find((p) => p.id === periodId),
    [periods, periodId]
  );

  const studentMatches = useMemo(() => {
    const q = studentQuery.trim().toLowerCase();
    const base = habilitated;
    if (!q) return base.slice(0, 8);
    return base
      .filter(
        (s) =>
          s.studentCode.toLowerCase().includes(q) ||
          s.ci.toLowerCase().includes(q) ||
          `${s.firstName} ${s.lastName}`.toLowerCase().includes(q),
      )
      .slice(0, 8);
  }, [studentQuery, habilitated]);

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
        <div className="flex gap-2 items-center" style={{ flexWrap: 'wrap' }}>
          {[
            { n: 1, label: 'Gestión', done: !!periodId },
            { n: 2, label: 'Estudiante', done: !!student },
            { n: 3, label: 'Credencial', done: !!enrollment },
          ].map((s, i, arr) => (
            <span key={s.n} className="flex gap-2 items-center">
              <span
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: '50%',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: 13,
                  background: s.done ? 'var(--success)' : 'var(--primary-soft)',
                  color: s.done ? '#fff' : 'var(--primary)',
                }}
              >
                {s.done ? '✓' : s.n}
              </span>
              <span className="text-sm" style={{ fontWeight: 600 }}>{s.label}</span>
              {i < arr.length - 1 && (
                <span style={{ width: 24, height: 2, background: 'var(--border)', borderRadius: 2 }} />
              )}
            </span>
          ))}
        </div>
      </div>

      <div
        className="mb-3"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}
      >
        <div className="stat-card">
          <div className="stat-value">{enrolledInPeriod.length}</div>
          <div className="stat-label">Matriculados en gestión</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{habilitated.length}</div>
          <div className="stat-label">Habilitados (depósito válido)</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{selectedPeriod?.periodName ?? '—'}</div>
          <div className="stat-label">Gestión seleccionada</div>
        </div>
      </div>

      <div className="card card-pad mb-3">
        <div className="form-label" style={{ marginBottom: 8 }}>Gestión académica</div>
        <div className="flex gap-2 mb-3" style={{ flexWrap: 'wrap' }}>
          {periods.map((p) => {
            const dot = p.status === 'OPEN' ? 'var(--success)' : p.status === 'PLANNED' ? 'var(--primary)' : 'var(--text-muted)';
            const range = fmtShortRange(p.startDate, p.endDate);
            return (
              <button
                key={p.id}
                className={`btn btn-sm ${periodId === p.id ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setPeriodId(p.id)}
                title={`${p.startDate ?? ''} al ${p.endDate ?? ''}`}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: periodId === p.id ? '#fff' : dot }} />
                {p.periodName}
                <span style={{ fontWeight: 400, opacity: 0.85, fontSize: 12 }}>
                  {p.status === 'OPEN' ? 'Abierta' : p.status === 'PLANNED' ? 'Planificada' : 'Cerrada'}
                  {range ? ` · ${range}` : ''}
                </span>
              </button>
            );
          })}
        </div>

        <div className="form-label" style={{ marginBottom: 8 }}>Estudiante habilitado</div>
        {student ? (
          <div
            className="card card-pad"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'var(--primary-soft)',
              border: 'none',
              padding: '8px 12px',
              gap: 8,
              flexWrap: 'wrap',
            }}
          >
            <div className="flex items-center" style={{ gap: 10 }}>
              {student.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={student.photoUrl}
                  alt=""
                  style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }}
                />
              ) : (
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    background: 'var(--primary)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: 15,
                  }}
                >
                  {initialsOf(student.firstName, student.lastName)}
                </div>
              )}
              <div>
                <strong style={{ fontSize: 14 }}>
                  {student.studentCode} — {student.firstName} {student.lastName}
                </strong>
                <div className="text-muted text-sm">
                  CI {student.ci} · {student.currentLevel}º semestre
                </div>
              </div>
            </div>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => { setStudentId(''); setStudentQuery(''); setEnrollment(null); }}
            >
              Cambiar
            </button>
          </div>
        ) : (
          <>
            <input
              className="form-control"
              placeholder="Buscar por matrícula, CI o nombre…"
              value={studentQuery}
              onChange={(e) => setStudentQuery(e.target.value)}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 6, maxHeight: 240, overflowY: 'auto' }}>
              {studentMatches.map((s) => (
                <button
                  key={s.id}
                  className="btn btn-outline btn-sm"
                  style={{ justifyContent: 'flex-start', textAlign: 'left' }}
                  onClick={() => selectStudent(s.id)}
                >
                  {s.studentCode} — {s.firstName} {s.lastName} · CI {s.ci}
                  {enrolledBy.get(enrolledKey(s.id, periodId)) ? ' · ✓ matriculado' : ''}
                </button>
              ))}
              {studentMatches.length === 0 && (
                <span className="text-muted text-sm">
                  Sin estudiantes habilitados con ese criterio. Verifica el depósito en la página de Depósitos.
                </span>
              )}
            </div>
          </>
        )}

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
          frontRef={frontRef}
          backRef={backRef}
        />
      )}

      {!student && (
        <div className="card card-pad">
          <div className="empty-state">
            <div className="empty-state-icon">🎓</div>
            Elige la gestión y busca un estudiante habilitado para registrar su matrícula y generar la credencial.
          </div>
        </div>
      )}
    </div>
  );
}

function depositRank(status: string): number {
  return status === 'APPROVED' ? 2 : status === 'VERIFIED' ? 1 : 0;
}

function fmtShortRange(start?: string | null, end?: string | null): string {
  const f = (iso?: string | null) => {
    if (!iso) return '';
    const d = new Date(`${iso.slice(0, 10)}T00:00:00`);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString('es-BO', { day: 'numeric', month: 'short' });
  };
  const s = f(start);
  const e = f(end);
  if (s && e) return `${s} – ${e}`;
  return s || e || '';
}