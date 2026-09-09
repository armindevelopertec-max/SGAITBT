'use client';

import { useEffect, useState } from 'react';
import { apiGet, apiPatch, apiPost, extractError } from '@/lib/api';
import { Deposit, Student } from '@/lib/types';
import { PageHeader } from '@/components/ui/page-header';
import { Modal } from '@/components/ui/modal';
import { StatusBadge } from '@/components/ui/badge';
import { LoadingState, ErrorState } from '@/components/ui/state';

const EMPTY = {
  studentId: '',
  depositNumber: '',
  depositDate: new Date().toISOString().slice(0, 10),
  amount: 0,
  concept: 'Matrícula',
};

export default function DepositsPage() {
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ ...EMPTY, studentId: '' });
  const [statusFilter, setStatusFilter] = useState('');
  const [verifyTarget, setVerifyTarget] = useState<Deposit | null>(null);
  const [verifyStatus, setVerifyStatus] = useState('VERIFIED');
  const [comment, setComment] = useState('');

  async function load() {
    setLoading(true);
    try {
      const [d, s] = await Promise.all([
        apiGet<Deposit[]>('/deposits'),
        apiGet<Student[]>('/students'),
      ]);
      setDeposits(d);
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

  function openCreate() {
    setForm({ ...EMPTY, studentId: students[0]?.id ?? '' });
    setModalOpen(true);
  }

  async function submit() {
    if (!form.studentId) return;
    try {
      await apiPost('/deposits', form);
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

  const filtered = statusFilter ? deposits.filter((d) => d.status === statusFilter) : deposits;

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
        <div className="flex gap-3 items-center">
          <label className="form-label" style={{ margin: 0 }}>Estado:</label>
          <select className="select" style={{ width: 220 }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">Todos</option>
            <option value="PENDING">Pendiente</option>
            <option value="VERIFIED">Verificado</option>
            <option value="APPROVED">Aprobado</option>
            <option value="OBSERVED">Observado</option>
            <option value="REJECTED">Rechazado</option>
          </select>
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Nº comprobante</th>
                <th>Estudiante</th>
                <th>Fecha</th>
                <th>Concepto</th>
                <th>Monto</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7}>
                    <div className="empty-state">
                      <div className="empty-state-icon">💰</div>
                      No hay depósitos registrados.
                    </div>
                  </td>
                </tr>
              )}
              {filtered.map((d) => (
                <tr key={d.id}>
                  <td>{d.depositNumber}</td>
                  <td>
                    {d.student ? `${d.student.firstName} ${d.student.lastName}` : '—'}
                    {d.student && <div className="text-muted text-sm">{d.student.studentCode}</div>}
                  </td>
                  <td>{d.depositDate}</td>
                  <td>{d.concept}</td>
                  <td><strong>Bs. {d.amount}</strong></td>
                  <td><StatusBadge value={d.status} /></td>
                  <td>
                    {d.status === 'PENDING' && (
                      <button className="btn btn-primary btn-sm" onClick={() => { setVerifyTarget(d); setVerifyStatus('VERIFIED'); setComment(''); }}>
                        Verificar
                      </button>
                    )}
                    {d.voucherUrl && (
                      <a className="btn btn-outline btn-sm" href={d.voucherUrl} target="_blank" rel="noreferrer">
                        Ver comprobante
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={modalOpen} title="Registrar depósito" onClose={() => setModalOpen(false)}
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setModalOpen(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={submit}>Guardar</button>
          </>
        }
      >
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Estudiante</label>
            <select className="select" value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })}>
              <option value="">—</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>{s.studentCode} — {s.firstName} {s.lastName}</option>
              ))}
            </select>
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
            <input className="form-control" value={form.concept} onChange={(e) => setForm({ ...form, concept: e.target.value })} />
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
            <p className="mb-3">
              Comprobante: <strong>{verifyTarget.depositNumber}</strong> · Bs. {verifyTarget.amount}
              <br />
              <span className="text-muted">Estudiante: {verifyTarget.student?.firstName} {verifyTarget.student?.lastName}</span>
            </p>
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
    </div>
  );
}