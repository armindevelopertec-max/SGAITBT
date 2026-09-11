'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiGet, apiPatch, apiPost, extractError } from '@/lib/api';
import { AcademicPeriod, Career } from '@/lib/types';
import { PageHeader } from '@/components/ui/page-header';
import { Modal } from '@/components/ui/modal';
import { StatusBadge } from '@/components/ui/badge';
import { LoadingState, ErrorState } from '@/components/ui/state';

const EMPTY = {
  careerId: '',
  startDate: '',
  endDate: '',
};

function toRoman(n: number): string {
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

export default function AcademicPeriodsPage() {
  const [periods, setPeriods] = useState<AcademicPeriod[]>([]);
  const [careers, setCareers] = useState<Career[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AcademicPeriod | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [filter, setFilter] = useState('');

  async function load() {
    setLoading(true);
    try {
      const [p, c] = await Promise.all([
        apiGet<AcademicPeriod[]>('/academic-periods'),
        apiGet<Career[]>('/careers'),
      ]);
      setPeriods(p);
      setCareers(c);
    } catch (err) {
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const years = useMemo(() => Array.from(new Set(periods.map((p) => p.year))).sort().reverse(), [periods]);

  function openCreate() {
    setEditing(null);
    setForm({ ...EMPTY, careerId: careers[0]?.id ?? '' });
    setModalOpen(true);
  }

  function openEdit(p: AcademicPeriod) {
    setEditing(p);
    setForm({
      careerId: p.careerId,
      startDate: p.startDate,
      endDate: p.endDate,
    });
    setModalOpen(true);
  }

  async function submit() {
    try {
      const payload = { careerId: form.careerId, startDate: form.startDate, endDate: form.endDate };
      if (editing) await apiPatch(`/academic-periods/${editing.id}`, payload);
      else await apiPost('/academic-periods', payload);
      setModalOpen(false);
      await load();
    } catch (err) {
      setError(extractError(err));
    }
  }

  async function toggleStatus(p: AcademicPeriod) {
    try {
      await apiPatch(`/academic-periods/${p.id}/${p.status === 'OPEN' ? 'close' : 'open'}`);
      await load();
    } catch (err) {
      setError(extractError(err));
    }
  }

  const previewYear = form.startDate ? String(new Date(form.startDate).getFullYear()) : '';
  const previewSequence = previewYear
    ? periods.filter((p) => p.careerId === form.careerId && p.year === previewYear && p.id !== editing?.id).length + 1
    : 0;
  const previewName = previewYear ? `${previewYear}/${toRoman(previewSequence)}` : '';
  const preview = editing ? editing.periodName : previewName;

  const filtered = filter
    ? periods.filter((p) => p.status === filter || p.year === filter || p.career?.name === filter)
    : periods;

  if (loading) return <LoadingState />;

  return (
    <div>
      <PageHeader
        title="Gestión Académica"
        subtitle="Periodos académicos por carrera"
        actions={
          <button className="btn btn-primary" onClick={openCreate}>
            Nuevo periodo
          </button>
        }
      />

      {error && <ErrorState message={error} />}

      <div className="card card-pad mb-3">
        <div className="flex gap-3 items-center">
          <label className="form-label" style={{ margin: 0 }}>Filtrar:</label>
          <select className="select" style={{ width: 240 }} value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="">Todos</option>
            {careers.map((c) => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
            {years.map((y) => (
              <option key={y} value={y}>Gestión {y}</option>
            ))}
            <option value="OPEN">Abiertas</option>
            <option value="CLOSED">Cerradas</option>
          </select>
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Periodo</th>
                <th>Carrera</th>
                <th>Inicio</th>
                <th>Fin</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6}>
                    <div className="empty-state">
                      <div className="empty-state-icon">📅</div>
                      No hay periodos registrados.
                    </div>
                  </td>
                </tr>
              )}
              {filtered.map((p) => (
                <tr key={p.id}>
                  <td><strong>{p.periodName}</strong></td>
                  <td>{p.career?.name ?? '—'}</td>
                  <td>{p.startDate}</td>
                  <td>{p.endDate}</td>
                  <td><StatusBadge value={p.status} /></td>
                  <td>
                    <div className="flex gap-2">
                      <button className="btn btn-soft btn-sm" onClick={() => openEdit(p)}>Editar</button>
                      <button className="btn btn-outline btn-sm" onClick={() => toggleStatus(p)}>
                        {p.status === 'OPEN' ? 'Cerrar' : 'Abrir'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={modalOpen}
        title={editing ? `Editar periodo ${editing.periodName}` : 'Nuevo periodo'}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setModalOpen(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={submit}>Guardar</button>
          </>
        }
      >
        <p className="text-muted text-sm mb-3">
          Solo debes indicar la carrera y las fechas de inicio y fin. El sistema calculará automáticamente el
          periodo sucesivo: <strong>{preview}</strong>.
        </p>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Carrera</label>
            <select className="select" value={form.careerId} onChange={(e) => setForm({ ...form, careerId: e.target.value })} disabled={!!editing}>
              {careers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Fecha de inicio</label>
            <input className="form-control" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Fecha de fin</label>
            <input className="form-control" type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
          </div>
        </div>
      </Modal>
    </div>
  );
}