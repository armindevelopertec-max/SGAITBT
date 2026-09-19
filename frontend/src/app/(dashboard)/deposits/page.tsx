'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiGet, apiPatch, apiPost, extractError } from '@/lib/api';
import { Career, Deposit, DepositConcept, Enrollment, Person, Student } from '@/lib/types';
import { PageHeader } from '@/components/ui/page-header';
import { Modal } from '@/components/ui/modal';
import { Badge, StatusBadge } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icons';
import { LoadingState, ErrorState } from '@/components/ui/state';

const EMPTY = {
  beneficiaryType: 'student' as 'student' | 'person',
  studentId: '',
  personId: '',
  depositNumber: '',
  depositDate: new Date().toISOString().slice(0, 10),
  amount: 0,
  concept: 'MATRICULA' as DepositConcept,
  conceptDetail: '',
};

const STATUS_OPTIONS = [
  { key: '', label: 'Todos' },
  { key: 'PENDING', label: 'Pendiente' },
  { key: 'VERIFIED', label: 'Verificado' },
  { key: 'APPROVED', label: 'Aprobado' },
  { key: 'OBSERVED', label: 'Observado' },
  { key: 'REJECTED', label: 'Rechazado' },
];

const CONCEPT_OPTIONS: Array<{ key: '' | DepositConcept; label: string }> = [
  { key: '', label: 'Todos' },
  { key: 'MATRICULA', label: 'Matrícula' },
  { key: 'EXAMEN', label: 'Examen' },
  { key: 'CERTIFICADO', label: 'Certificado' },
  { key: 'OTROS', label: 'Otros' },
];

function fmtDate(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(`${iso.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('es-BO', { day: 'numeric', month: 'long', year: 'numeric' });
}

function fmtMoney(n: number | string): string {
  return `Bs. ${Number(n).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function studentName(d: Deposit): string {
  if (!d.student) return '—';
  return `${d.student.firstName} ${d.student.lastName}`.trim();
}

function personName(p?: Person | null): string {
  if (!p) return '—';
  return [p.firstName, p.paternalSurname, p.maternalSurname].filter(Boolean).join(' ') || p.ci;
}

export default function DepositsPage() {
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [persons, setPersons] = useState<Person[]>([]);
  const [careers, setCareers] = useState<Career[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [statusFilter, setStatusFilter] = useState('');
  const [conceptFilter, setConceptFilter] = useState('');
  const [verifyTarget, setVerifyTarget] = useState<Deposit | null>(null);
  const [verifyStatus, setVerifyStatus] = useState('VERIFIED');
  const [comment, setComment] = useState('');
  const [showAmounts, setShowAmounts] = useState(false);
  const [enrollTarget, setEnrollTarget] = useState<Deposit | null>(null);
  const [enrollCareerId, setEnrollCareerId] = useState('');
  const [beneficiaryQuery, setBeneficiaryQuery] = useState('');

  async function load() {
    setLoading(true);
    try {
      const [d, s, p, c, e] = await Promise.all([
        apiGet<Deposit[]>('/deposits'),
        apiGet<Student[]>('/students'),
        apiGet<Person[]>('/persons'),
        apiGet<Career[]>('/careers'),
        apiGet<Enrollment[]>('/enrollments'),
      ]);
      setDeposits(d);
      setStudents(s);
      setPersons(p);
      setCareers(c);
      setEnrollments(e);
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
    setForm({ ...EMPTY, studentId: students[0]?.id ?? '' });
    setBeneficiaryQuery('');
    setModalOpen(true);
  }

  async function submit() {
    const beneficiaryId = form.beneficiaryType === 'student' ? form.studentId : form.personId;
    if (!beneficiaryId) {
      setError(
        form.beneficiaryType === 'student'
          ? 'Selecciona el estudiante'
          : 'Selecciona la persona (aspirante)',
      );
      return;
    }
    try {
      await apiPost('/deposits', {
        studentId: form.beneficiaryType === 'student' ? form.studentId : undefined,
        personId: form.beneficiaryType === 'person' ? form.personId : undefined,
        depositNumber: form.depositNumber,
        depositDate: form.depositDate,
        amount: form.amount,
        concept: form.concept,
        conceptDetail: form.conceptDetail || undefined,
      });
      setModalOpen(false);
      await load();
    } catch (err) {
      setError(extractError(err));
    }
  }

  async function verify() {
    if (!verifyTarget) return;
    try {
      await apiPatch(`/deposits/${verifyTarget.id}/verify`, {
        status: verifyStatus,
        verificationComment: comment,
      });
      setVerifyTarget(null);
      setComment('');
      await load();
    } catch (err) {
      setError(extractError(err));
    }
  }

  // Crea la ficha de estudiante (PRE_ENROLLED) desde el aspirante y liga el depósito.
  async function createStudentFile() {
    if (!enrollTarget?.persona || !enrollCareerId) {
      setError('Selecciona la carrera para la ficha del estudiante');
      return;
    }
    const p = enrollTarget.persona;
    try {
      const student = await apiPost<Student>('/students', {
        firstName: p.firstName,
        paternalSurname: p.paternalSurname ?? undefined,
        maternalSurname: p.maternalSurname ?? undefined,
        lastName: p.lastName,
        ci: p.ci,
        ciExtension: p.ciExtension ?? undefined,
        birthDate: p.birthDate,
        sex: p.sex ?? undefined,
        phone: p.phone ?? undefined,
        address: p.address ?? undefined,
        email: p.email,
        careerId: enrollCareerId,
        currentLevel: 1,
        status: 'PRE_ENROLLED',
        personaId: p.id,
      });
      await apiPatch(`/deposits/${enrollTarget.id}/convert-to-student`, {
        studentId: student.id,
      });
      setEnrollTarget(null);
      setEnrollCareerId('');
      await load();
    } catch (err) {
      setError(extractError(err));
    }
  }

  const countsByStatus = useMemo(() => {
    const map = new Map<string, number>();
    for (const d of deposits) map.set(d.status, (map.get(d.status) ?? 0) + 1);
    return map;
  }, [deposits]);

  const countsByConcept = useMemo(() => {
    const map = new Map<string, number>();
    for (const d of deposits) map.set(d.concept, (map.get(d.concept) ?? 0) + 1);
    return map;
  }, [deposits]);

  const filtered = deposits.filter(
    (d) =>
      (!statusFilter || d.status === statusFilter) &&
      (!conceptFilter || d.concept === conceptFilter),
  );

  const totalAmount = useMemo(
    () => filtered.reduce((acc, d) => acc + Number(d.amount ?? 0), 0),
    [filtered],
  );

  const pendingCount = countsByStatus.get('PENDING') ?? 0;

  // Últimas dos matrículas por estudiante: actual y anterior.
  const enrollmentsByStudent = useMemo(() => {
    const map = new Map<string, Enrollment[]>();
    for (const e of enrollments) {
      if (!map.has(e.studentId)) map.set(e.studentId, []);
      map.get(e.studentId)!.push(e);
    }
    for (const list of map.values()) {
      list.sort((a, b) => (b.enrollmentDate < a.enrollmentDate ? -1 : b.enrollmentDate > a.enrollmentDate ? 1 : 0));
    }
    return map;
  }, [enrollments]);

  function semesterPair(studentId?: string | null): { current?: Enrollment; previous?: Enrollment } {
    if (!studentId) return {};
    const list = enrollmentsByStudent.get(studentId) ?? [];
    return { current: list[0], previous: list[1] };
  }

  // Repite si el semestre anterior es el mismo que el actual.
  function isRepeating(pair: { current?: Enrollment; previous?: Enrollment }): boolean {
    return !!pair.current && !!pair.previous && pair.current.semester === pair.previous.semester;
  }

  const beneficiaryId = form.beneficiaryType === 'student' ? form.studentId : form.personId;

  const studentMatches = useMemo(() => {
    const q = beneficiaryQuery.trim().toLowerCase();
    if (!q) return students.slice(0, 8);
    return students
      .filter(
        (s) =>
          s.studentCode.toLowerCase().includes(q) ||
          s.ci.toLowerCase().includes(q) ||
          `${s.firstName} ${s.lastName}`.toLowerCase().includes(q),
      )
      .slice(0, 8);
  }, [students, beneficiaryQuery]);

  const personMatches = useMemo(() => {
    const q = beneficiaryQuery.trim().toLowerCase();
    if (!q) return persons.slice(0, 8);
    return persons
      .filter(
        (p) =>
          p.ci.toLowerCase().includes(q) ||
          personName(p).toLowerCase().includes(q) ||
          p.email.toLowerCase().includes(q),
      )
      .slice(0, 8);
  }, [persons, beneficiaryQuery]);

  const selectedStudent = students.find((s) => s.id === form.studentId);
  const selectedPerson = persons.find((p) => p.id === form.personId);
  const selectedPair = semesterPair(form.studentId || undefined);

  if (loading) return <LoadingState />;

  return (
    <div>
      <PageHeader
        title="Depósitos / Pagos"
        subtitle="Registro y verificación de comprobantes de depósito"
        actions={
          <button className="btn btn-primary" onClick={openCreate}>
            Registrar depósito
          </button>
        }
      />

      {error && <ErrorState message={error} />}

      <div className="card card-pad mb-3">
        <div className="flex gap-2 mb-2" style={{ flexWrap: 'wrap' }}>
          {STATUS_OPTIONS.map((o) => (
            <button
              key={o.key || 'all'}
              className={`btn btn-sm ${statusFilter === o.key ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setStatusFilter(o.key)}
            >
              {o.label}
              <span
                style={{
                  marginLeft: 8,
                  fontSize: 11,
                  fontWeight: 700,
                  background: statusFilter === o.key ? 'rgba(255,255,255,.25)' : 'var(--primary-soft)',
                  color: statusFilter === o.key ? '#fff' : 'var(--primary)',
                  borderRadius: 999,
                  padding: '1px 8px',
                }}
              >
                {o.key ? (countsByStatus.get(o.key) ?? 0) : deposits.length}
              </span>
            </button>
          ))}
        </div>
        <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
          {CONCEPT_OPTIONS.map((o) => (
            <button
              key={o.key || 'all-c'}
              className={`btn btn-sm ${conceptFilter === o.key ? 'btn-soft' : 'btn-outline'}`}
              onClick={() => setConceptFilter(o.key)}
            >
              {o.label}
              <span
                style={{
                  marginLeft: 8,
                  fontSize: 11,
                  fontWeight: 700,
                  background: 'var(--primary-soft)',
                  color: 'var(--primary)',
                  borderRadius: 999,
                  padding: '1px 8px',
                }}
              >
                {o.key ? (countsByConcept.get(o.key) ?? 0) : deposits.length}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div
        className="mb-3"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}
      >
        <div className="stat-card">
          <div className="stat-value">{filtered.length}</div>
          <div className="stat-label">Comprobantes</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">
            Monto en vista{' '}
            <button
              className="btn btn-sm"
              style={{ padding: '2px 6px', minWidth: 0, verticalAlign: 'middle' }}
              onClick={() => setShowAmounts((v) => !v)}
              title={showAmounts ? 'Ocultar montos' : 'Mostrar montos'}
              aria-label={showAmounts ? 'Ocultar montos' : 'Mostrar montos'}
            >
              <Icon name={showAmounts ? 'eye-off' : 'eye'} size={16} />
            </button>
          </div>
          <div className="stat-value">{showAmounts ? fmtMoney(totalAmount) : 'Bs. ••••••'}</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{pendingCount}</div>
          <div className="stat-label">Pendientes de verificar</div>
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="card card-pad">
          <div className="empty-state">
            <div className="empty-state-icon">💰</div>
            No hay depósitos registrados.
          </div>
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 12,
        }}
      >
        {filtered.map((d) => {
          const isAspirant = !d.studentId && d.persona;
          const { current: curEnr, previous: prevEnr } = semesterPair(d.studentId);
          const repeating = isRepeating({ current: curEnr, previous: prevEnr });
          return (
            <div
              key={d.id}
              className="card-pad"
              style={{
                border: '1px solid var(--border)',
                borderRadius: 12,
                background: 'var(--bg-card)',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <div className="flex justify-between items-center" style={{ gap: 8 }}>
                <Badge label={d.depositNumber} color="info" />
                <StatusBadge value={d.status} />
              </div>
              <div>
                {d.student ? (
                  <>
                    <strong style={{ fontSize: 15 }}>{studentName(d)}</strong>
                    <div className="text-muted text-sm">
                      {d.student.studentCode}
                      {d.student.currentLevel != null && ` · ${d.student.currentLevel}º semestre`}
                    </div>
                    {(curEnr || prevEnr) && (
                      <div className="text-muted text-sm" style={{ marginTop: 2 }}>
                        {prevEnr && (
                          <span>
                            Anterior: {prevEnr.academicPeriod?.periodName ?? prevEnr.academicPeriodId.slice(0, 8)} · {prevEnr.semester}º
                          </span>
                        )}
                        {prevEnr && curEnr && <span> &nbsp;|&nbsp; </span>}
                        {curEnr && (
                          <span>
                            Actual: {curEnr.academicPeriod?.periodName ?? curEnr.academicPeriodId.slice(0, 8)} · {curEnr.semester}º
                          </span>
                        )}
                        {repeating && (
                          <span style={{ marginLeft: 8 }}>
                            <Badge label="🔁 Repite" color="danger" />
                          </span>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <strong style={{ fontSize: 15 }}>{personName(d.persona)}</strong>
                    <div className="text-muted text-sm">
                      CI {d.persona?.ci ?? '—'}
                      {d.persona?.ciExtension ? ` (${d.persona.ciExtension})` : ''}
                    </div>
                    <div style={{ marginTop: 4 }}>
                      <Badge label="Aspirante · sin ficha" color="warning" />
                    </div>
                  </>
                )}
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                <Badge label={d.concept} color="success" />
                {d.conceptDetail && (
                  <span className="text-muted text-sm">{d.conceptDetail}</span>
                )}
              </div>
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  color: 'var(--primary)',
                }}
              >
                {showAmounts ? fmtMoney(d.amount) : 'Bs. ••••••'}
              </div>
              <div className="text-muted text-sm">
                {fmtDate(d.depositDate)}
              </div>
              {d.verificationComment && (
                <div className="text-muted text-sm" style={{ fontStyle: 'italic' }}>
                  “{d.verificationComment}”
                </div>
              )}
              <div className="flex gap-2" style={{ marginTop: 'auto', paddingTop: 4, flexWrap: 'wrap' }}>
                {d.status === 'PENDING' && (
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => { setVerifyTarget(d); setVerifyStatus('VERIFIED'); setComment(''); }}
                  >
                    Verificar
                  </button>
                )}
                {isAspirant && (
                  <button
                    className="btn btn-soft btn-sm"
                    onClick={() => { setEnrollTarget(d); setEnrollCareerId(careers[0]?.id ?? ''); }}
                    title="Crear ficha de estudiante (preinscrito) y ligar este depósito"
                  >
                    Crear ficha
                  </button>
                )}
                {d.voucherUrl && (
                  <a className="btn btn-outline btn-sm" href={d.voucherUrl} target="_blank" rel="noreferrer">
                    Ver comprobante
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Modal open={modalOpen} title="Registrar depósito" onClose={() => setModalOpen(false)}
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setModalOpen(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={submit}>Guardar</button>
          </>
        }
      >
        <div className="flex gap-2 mb-3">
          <button
            className={`btn btn-sm ${form.beneficiaryType === 'student' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => { setForm({ ...form, beneficiaryType: 'student', personId: '' }); setBeneficiaryQuery(''); }}
          >
            Estudiante
          </button>
          <button
            className={`btn btn-sm ${form.beneficiaryType === 'person' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => { setForm({ ...form, beneficiaryType: 'person', studentId: '' }); setBeneficiaryQuery(''); }}
          >
            Aspirante (sin ficha)
          </button>
        </div>
        <div className="form-grid">
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">
              {form.beneficiaryType === 'student' ? 'Estudiante' : 'Persona (aspirante)'}
            </label>
            {beneficiaryId ? (
              <div
                className="card card-pad"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'var(--primary-soft)',
                  border: 'none',
                  padding: '8px 12px',
                }}
              >
                <strong style={{ fontSize: 14 }}>
                  {form.beneficiaryType === 'student' && selectedStudent
                    ? `${selectedStudent.studentCode} — ${selectedStudent.firstName} ${selectedStudent.lastName}`
                    : form.beneficiaryType === 'person' && selectedPerson
                      ? `${selectedPerson.ci} — ${personName(selectedPerson)}`
                      : 'Seleccionado'}
                </strong>
                {form.beneficiaryType === 'student' && (selectedPair.previous || selectedPair.current) && (
                  <div className="text-muted text-sm">
                    {selectedPair.previous && (
                      <span>
                        Anterior: {selectedPair.previous.academicPeriod?.periodName ?? '—'} · {selectedPair.previous.semester}º
                      </span>
                    )}
                    {selectedPair.previous && selectedPair.current && <span> &nbsp;|&nbsp; </span>}
                    {selectedPair.current && (
                      <span>
                        Actual: {selectedPair.current.academicPeriod?.periodName ?? '—'} · {selectedPair.current.semester}º
                      </span>
                    )}
                    {isRepeating(selectedPair) && (
                      <span style={{ marginLeft: 8 }}>
                        <Badge label="🔁 Repite semestre" color="danger" />
                      </span>
                    )}
                  </div>
                )}
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => {
                    setForm({ ...form, studentId: '', personId: '' });
                    setBeneficiaryQuery('');
                  }}
                >
                  Cambiar
                </button>
              </div>
            ) : (
              <>
                <input
                  className="form-control"
                  placeholder={
                    form.beneficiaryType === 'student'
                      ? 'Buscar por matrícula, CI o nombre…'
                      : 'Buscar por CI, nombre o correo…'
                  }
                  value={beneficiaryQuery}
                  onChange={(e) => setBeneficiaryQuery(e.target.value)}
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 6, maxHeight: 220, overflowY: 'auto' }}>
                  {form.beneficiaryType === 'student'
                    ? studentMatches.map((s) => (
                        <button
                          key={s.id}
                          className="btn btn-outline btn-sm"
                          style={{ justifyContent: 'flex-start', textAlign: 'left' }}
                          onClick={() => setForm({ ...form, studentId: s.id })}
                        >
                          {s.studentCode} — {s.firstName} {s.lastName} · CI {s.ci}
                        </button>
                      ))
                    : personMatches.map((p) => (
                        <button
                          key={p.id}
                          className="btn btn-outline btn-sm"
                          style={{ justifyContent: 'flex-start', textAlign: 'left' }}
                          onClick={() => setForm({ ...form, personId: p.id })}
                        >
                          {p.ci} — {personName(p)}
                        </button>
                      ))}
                  {(form.beneficiaryType === 'student' ? studentMatches : personMatches).length === 0 && (
                    <span className="text-muted text-sm">Sin resultados.</span>
                  )}
                </div>
              </>
            )}
          </div>
          <div className="form-group">
            <label className="form-label">Nº depósito / comprobante</label>
            <input className="form-control" value={form.depositNumber} onChange={(e) => setForm({ ...form, depositNumber: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Fecha</label>
            <input className="form-control" type="date" value={form.depositDate} onChange={(e) => setForm({ ...form, depositDate: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Monto (Bs.)</label>
            <input className="form-control" type="number" min={0} step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} />
          </div>
          <div className="form-group">
            <label className="form-label">Concepto</label>
            <select className="select" value={form.concept} onChange={(e) => setForm({ ...form, concept: e.target.value as DepositConcept })}>
              <option value="MATRICULA">Matrícula</option>
              <option value="EXAMEN">Examen</option>
              <option value="CERTIFICADO">Certificado</option>
              <option value="OTROS">Otros</option>
            </select>
          </div>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Detalle (opcional)</label>
            <input
              className="form-control"
              placeholder="Ej. Matrícula I/2027, Examen de suficiencia…"
              value={form.conceptDetail}
              onChange={(e) => setForm({ ...form, conceptDetail: e.target.value })}
            />
          </div>
        </div>
      </Modal>

      <Modal open={!!verifyTarget} title="Verificar depósito" onClose={() => setVerifyTarget(null)}
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setVerifyTarget(null)}>Cancelar</button>
            <button className="btn btn-primary" onClick={verify}>Confirmar</button>
          </>
        }
      >
        {verifyTarget && (
          <div>
            <div className="card card-pad mb-3" style={{ background: 'var(--primary-soft)', border: 'none' }}>
              <div className="flex justify-between items-center" style={{ gap: 8 }}>
                <Badge label={verifyTarget.depositNumber} color="info" />
                <strong style={{ fontSize: 18 }}>{fmtMoney(verifyTarget.amount)}</strong>
              </div>
              <div className="text-muted text-sm" style={{ marginTop: 4 }}>
                {verifyTarget.student ? studentName(verifyTarget) : personName(verifyTarget.persona)} · {fmtDate(verifyTarget.depositDate)}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Resultado de la verificación</label>
              <select className="select" value={verifyStatus} onChange={(e) => setVerifyStatus(e.target.value)}>
                <option value="VERIFIED">Verificado</option>
                <option value="APPROVED">Aprobado</option>
                <option value="OBSERVED">Observado</option>
                <option value="REJECTED">Rechazado</option>
              </select>
            </div>
            <div className="form-group mt-2">
              <label className="form-label">Comentario (opcional)</label>
              <textarea className="textarea" rows={2} value={comment} onChange={(e) => setComment(e.target.value)} />
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!enrollTarget} title="Crear ficha de estudiante" onClose={() => setEnrollTarget(null)}
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setEnrollTarget(null)}>Cancelar</button>
            <button className="btn btn-primary" onClick={createStudentFile}>Crear preinscrito y ligar depósito</button>
          </>
        }
      >
        {enrollTarget && (
          <div>
            <p className="text-muted text-sm mb-3">
              Se creará la ficha como <strong>preinscrito</strong> (nivel 1) para{' '}
              <strong>{personName(enrollTarget.persona)}</strong> (CI {enrollTarget.persona?.ci})
              y se ligará el depósito <strong>{enrollTarget.depositNumber}</strong>. Con el
              depósito verificado/aprobado podrá matricularse por primera vez.
            </p>
            <div className="form-group">
              <label className="form-label">Carrera</label>
              <select className="select" value={enrollCareerId} onChange={(e) => setEnrollCareerId(e.target.value)}>
                <option value="">—</option>
                {careers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
