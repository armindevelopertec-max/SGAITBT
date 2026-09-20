'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiGet, apiPatch, apiPost, apiUpload, extractError } from '@/lib/api';
import { Career, Deposit, DepositConcept, Enrollment, Person, Student } from '@/lib/types';
import { PageHeader } from '@/components/ui/page-header';
import { Modal } from '@/components/ui/modal';
import { Badge, StatusBadge } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icons';
import { LoadingState, ErrorState } from '@/components/ui/state';
import { initialsOf, fullSurname } from '@/lib/utils';

const EMPTY = {
  beneficiaryType: 'student' as 'student' | 'person',
  studentId: '',
  personId: '',
  depositNumber: '',
  depositDate: new Date().toISOString().slice(0, 10),
  amount: 0,
  concept: 'MATRICULA' as DepositConcept,
  conceptDetail: '',
  voucherUrl: '',
};

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
  return `${d.student.person?.firstName || ''} ${d.student.person?.lastName || ''}`.trim();
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
  const [verifyTarget, setVerifyTarget] = useState<Deposit | null>(null);
  const [verifyStatus, setVerifyStatus] = useState('VERIFIED');
  const [comment, setComment] = useState('');
  const [showAmounts, setShowAmounts] = useState(false);
  const [enrollTarget, setEnrollTarget] = useState<Deposit | null>(null);
  const [enrollCareerId, setEnrollCareerId] = useState('');
  const [beneficiaryQuery, setBeneficiaryQuery] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');

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
    setForm({ ...EMPTY, studentId: (selectedStudentId || students[0]?.id) ?? '' });
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
        voucherUrl: form.voucherUrl || undefined,
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

  async function createStudentFile() {
    if (!enrollTarget?.person || !enrollCareerId) {
      setError('Selecciona la carrera para la ficha del estudiante');
      return;
    }
    const p = enrollTarget.person;
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
        personId: p.id,
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

  const beneficiaryId = form.beneficiaryType === 'student' ? form.studentId : form.personId;

  const studentMatches = useMemo(() => {
    const q = beneficiaryQuery.trim().toLowerCase();
    if (!q) return students.slice(0, 8);
    return students
      .filter(
        (s) =>
          s.studentCode.toLowerCase().includes(q) ||
          (s.person?.ci?.toLowerCase().includes(q) ?? false) ||
          `${s.person?.firstName || ''} ${s.person?.lastName || ''}`.toLowerCase().includes(q),
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

  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  const studentDeposits = useMemo(() => {
    if (!selectedStudentId) return [];
    return deposits.filter((d) => d.studentId === selectedStudentId);
  }, [deposits, selectedStudentId]);

  const studentEnrollments = useMemo(() => {
    if (!selectedStudentId) return [];
    return enrollments
      .filter((e) => e.studentId === selectedStudentId)
      .sort((a, b) => (b.enrollmentDate < a.enrollmentDate ? -1 : b.enrollmentDate > a.enrollmentDate ? 1 : 0));
  }, [enrollments, selectedStudentId]);

  const latestEnrollment = studentEnrollments[0];
  const previousEnrollment = studentEnrollments[1];

  const isRepeating = (): boolean => {
    if (!latestEnrollment || !previousEnrollment) return false;
    const curLevel = latestEnrollment.student?.currentLevel;
    const prevLevel = previousEnrollment.student?.currentLevel;
    return curLevel != null && prevLevel != null && curLevel === prevLevel;
  };

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
        <div className="form-label" style={{ marginBottom: 8 }}>Buscar estudiante</div>
        {selectedStudent ? (
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
              {selectedStudent.person?.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={selectedStudent.person.photoUrl}
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
                  {initialsOf(selectedStudent.person?.firstName, selectedStudent.person?.lastName)}
                </div>
              )}
              <div>
                <strong style={{ fontSize: 14 }}>
                  {selectedStudent.studentCode} — {selectedStudent.person?.firstName} {fullSurname(selectedStudent.person)}
                </strong>
                <div className="text-muted text-sm">
                  CI {selectedStudent.person?.ci} · {selectedStudent.currentLevel}º semestre
                </div>
                {latestEnrollment && (
                  <div className="text-muted text-sm">
                    Matriculado: {latestEnrollment.academicPeriod?.periodName ?? '—'}
                    {previousEnrollment && ` · Anterior: ${previousEnrollment.academicPeriod?.periodName ?? '—'}`}
                    {isRepeating() && <Badge label="Repite" color="danger" />}
                  </div>
                )}
              </div>
            </div>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => setSelectedStudentId('')}
            >
              Cambiar
            </button>
          </div>
        ) : (
          <>
            <input
              className="form-control"
              placeholder="Buscar por matrícula, CI o nombre…"
              value={beneficiaryQuery}
              onChange={(e) => setBeneficiaryQuery(e.target.value)}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 6, maxHeight: 240, overflowY: 'auto' }}>
              {studentMatches.map((s) => (
                <button
                  key={s.id}
                  className="btn btn-outline btn-sm"
                  style={{ justifyContent: 'flex-start', textAlign: 'left' }}
                  onClick={() => setSelectedStudentId(s.id)}
                >
                  {s.studentCode} — {s.person?.firstName} {fullSurname(s.person)} · CI {s.person?.ci || '—'}
                </button>
              ))}
              {studentMatches.length === 0 && (
                <span className="text-muted text-sm">
                  Sin estudiantes con ese criterio.
                </span>
              )}
            </div>
          </>
        )}
      </div>

      {selectedStudentId && (
        <>
          <div
            className="mb-3"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}
          >
            <div className="stat-card">
              <div className="stat-value">{studentDeposits.length}</div>
              <div className="stat-label">Depósitos registrados</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">
                {showAmounts
                  ? fmtMoney(studentDeposits.reduce((acc, d) => acc + Number(d.amount ?? 0), 0))
                  : 'Bs. ••••••'}
              </div>
              <div className="stat-label">
                Total
                <button
                  className="btn btn-sm"
                  style={{ padding: '2px 6px', minWidth: 0, verticalAlign: 'middle', marginLeft: 8 }}
                  onClick={() => setShowAmounts((v) => !v)}
                  title={showAmounts ? 'Ocultar montos' : 'Mostrar montos'}
                >
                  <Icon name={showAmounts ? 'eye-off' : 'eye'} size={16} />
                </button>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{studentDeposits.filter((d) => d.status === 'PENDING').length}</div>
              <div className="stat-label">Pendientes de verificar</div>
            </div>
          </div>

          {studentDeposits.length === 0 && (
            <div className="card card-pad">
              <div className="empty-state">
                <div className="empty-state-icon">💰</div>
                No hay depósitos registrados para este estudiante.
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
            {studentDeposits.map((d) => {
              const isAspirant = !d.studentId && !!d.person;
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
                      &ldquo;{d.verificationComment}&rdquo;
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
        </>
      )}

      {!selectedStudentId && (
        <div className="card card-pad">
          <div className="empty-state">
            <div className="empty-state-icon">💰</div>
            Busca un estudiante para ver sus depósitos.
          </div>
        </div>
      )}

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
                    ? `${selectedStudent.studentCode} — ${selectedStudent.person?.firstName || ''} ${fullSurname(selectedStudent.person)}`
                    : form.beneficiaryType === 'person' && persons.find((p) => p.id === form.personId)
                      ? `${persons.find((p) => p.id === form.personId)?.ci} — ${personName(persons.find((p) => p.id === form.personId))}`
                      : 'Seleccionado'}
                </strong>
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
                          {s.studentCode} — {s.person?.firstName || ''} {fullSurname(s.person)} · CI {s.person?.ci || '—'}
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
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Comprobante de pago (voucher)</label>
            <input
              className="form-control"
              type="file"
              accept="image/*,.pdf"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                try {
                  const { url } = await apiUpload<{ url: string }>('/uploads/voucher', file);
                  setForm({ ...form, voucherUrl: url });
                } catch (err) {
                  setError(extractError(err));
                }
              }}
            />
            {form.voucherUrl && (
              <div style={{ marginTop: 8 }}>
                <span className="text-sm text-muted">Voucher cargado: </span>
                <a href={form.voucherUrl} target="_blank" rel="noopener noreferrer" className="text-sm">
                  Ver imagen
                </a>
              </div>
            )}
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
                {studentName(verifyTarget)} · {fmtDate(verifyTarget.depositDate)}
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
              <strong>{personName(enrollTarget.person)}</strong> (CI {enrollTarget.person?.ci})
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
