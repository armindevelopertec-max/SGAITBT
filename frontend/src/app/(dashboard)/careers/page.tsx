'use client';

import { useEffect, useState } from 'react';
import { apiGet, apiPatch, apiPost, extractError } from '@/lib/api';
import { Career, Subject } from '@/lib/types';
import { PageHeader } from '@/components/ui/page-header';
import { Modal } from '@/components/ui/modal';
import { StatusBadge } from '@/components/ui/badge';
import { LoadingState, ErrorState } from '@/components/ui/state';

const EMPTY = {
  name: '',
  code: '',
  description: '',
  durationYears: 3,
  numberOfLevels: 6,
};

export default function CareersPage() {
  const [careers, setCareers] = useState<Career[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Career | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      setCareers(await apiGet<Career[]>('/careers'));
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
    setEditing(null);
    setForm(EMPTY);
    setModalOpen(true);
  }

  function openEdit(c: Career) {
    setEditing(c);
    setForm({
      name: c.name,
      code: c.code,
      description: c.description ?? '',
      durationYears: c.durationYears,
      numberOfLevels: c.numberOfLevels,
    });
    setModalOpen(true);
  }

  async function submit() {
    setSaving(true);
    try {
      if (editing) await apiPatch(`/careers/${editing.id}`, form);
      else await apiPost('/careers', form);
      setModalOpen(false);
      await load();
    } catch (err) {
      setError(extractError(err));
    } finally {
      setSaving(false);
    }
  }

  async function toggleState(c: Career) {
    try {
      await apiPatch(`/careers/${c.id}/toggle-state`);
      await load();
    } catch (err) {
      setError(extractError(err));
    }
  }

  if (loading) return <LoadingState />;

  return (
    <div>
      <PageHeader
        title="Carreras"
        subtitle="Carreras ofrecidas por el instituto"
        actions={
          <button className="btn btn-primary" onClick={openCreate}>
            Nueva carrera
          </button>
        }
      />

      {error && <ErrorState message={error} />}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total carreras</div>
          <div className="stat-value">{careers.length}</div>
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Código</th>
                <th>Duración</th>
                <th>Niveles</th>
                <th>Materias</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {careers.length === 0 && (
                <tr>
                  <td colSpan={7}>
                    <div className="empty-state">
                      <div className="empty-state-icon">🎓</div>
                      No hay carreras registradas.
                    </div>
                  </td>
                </tr>
              )}
              {careers.map((c) => (
                <tr key={c.id}>
                  <td>
                    <strong>{c.name}</strong>
                    <div className="text-muted text-sm">{c.description}</div>
                  </td>
                  <td>{c.code}</td>
                  <td>{c.durationYears} años</td>
                  <td>{c.numberOfLevels}</td>
                  <td>{(c.subjects ?? []).length}</td>
                  <td><StatusBadge value={c.state} /></td>
                  <td>
                    <div className="flex gap-2">
                      <button className="btn btn-soft btn-sm" onClick={() => openEdit(c)}>Editar</button>
                      <button className="btn btn-outline btn-sm" onClick={() => toggleState(c)}>
                        {c.state === 'ACTIVE' ? 'Deshabilitar' : 'Habilitar'}
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
        title={editing ? 'Editar carrera' : 'Nueva carrera'}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setModalOpen(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={submit} disabled={saving}>
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
          </>
        }
      >
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Nombre</label>
            <input className="form-control" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Código</label>
            <input className="form-control" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Duración (años)</label>
            <input className="form-control" type="number" min={1} value={form.durationYears} onChange={(e) => setForm({ ...form, durationYears: Number(e.target.value) })} />
          </div>
          <div className="form-group">
            <label className="form-label">Niveles / semestres</label>
            <input className="form-control" type="number" min={1} value={form.numberOfLevels} onChange={(e) => setForm({ ...form, numberOfLevels: Number(e.target.value) })} />
          </div>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Descripción</label>
            <textarea className="textarea" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
        </div>
      </Modal>
    </div>
  );
}