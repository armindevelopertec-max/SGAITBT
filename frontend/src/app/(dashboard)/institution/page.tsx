'use client';

import { useEffect, useState } from 'react';
import { apiGet, apiPatch, apiPost, extractError } from '@/lib/api';
import { Institution } from '@/lib/types';
import { PageHeader } from '@/components/ui/page-header';
import { Modal } from '@/components/ui/modal';
import { LoadingState, ErrorState } from '@/components/ui/state';

const EMPTY = {
  name: '',
  slug: '',
  code: '',
  description: '',
  address: '',
  phone: '',
  email: '',
  rectorName: '',
};

export default function InstitutionPage() {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Institution | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      setInstitutions(await apiGet<Institution[]>('/institutions'));
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

  function openEdit(inst: Institution) {
    setEditing(inst);
    setForm({
      name: inst.name,
      slug: inst.slug,
      code: inst.code,
      description: inst.description ?? '',
      address: inst.address ?? '',
      phone: inst.phone ?? '',
      email: inst.email ?? '',
      rectorName: inst.rectorName ?? '',
    });
    setModalOpen(true);
  }

  async function submit() {
    setSaving(true);
    try {
      if (editing) {
        await apiPatch(`/institutions/${editing.id}`, form);
      } else {
        await apiPost('/institutions', form);
      }
      setModalOpen(false);
      await load();
    } catch (err) {
      setError(extractError(err));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingState />;

  return (
    <div>
      <PageHeader
        title="Institución"
        subtitle="Administrar la información general del instituto"
        actions={
          <button className="btn btn-primary" onClick={openCreate}>
            Nueva institución
          </button>
        }
      />

      {error && <ErrorState message={error} />}

      <div className="card">
        {institutions.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">🏫</div>
            No se ha registrado la institución.
          </div>
        )}
        {institutions.map((inst) => (
          <div key={inst.id} className="card-pad" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="flex justify-between items-center mb-2">
              <h3 style={{ fontWeight: 700, fontSize: 16 }}>{inst.name}</h3>
              <button className="btn btn-soft btn-sm" onClick={() => openEdit(inst)}>
                Editar
              </button>
            </div>
            <div className="text-muted">
              <div>Sigla/Código: <strong>{inst.code}</strong></div>
              <div>Dirección: {inst.address ?? '—'}</div>
              <div>Teléfono: {inst.phone ?? '—'} · Correo: {inst.email ?? '—'}</div>
              {inst.rectorName && <div>Rector: {inst.rectorName}</div>}
            </div>
          </div>
        ))}
      </div>

      {institutions.length === 0 && (
        <div className="card card-pad mt-4">
          <h4 className="mb-2">Registrar la institución</h4>
          <button className="btn btn-primary" onClick={openCreate}>
            Registrar institución
          </button>
        </div>
      )}

      <Modal
        open={modalOpen}
        title={editing ? 'Editar institución' : 'Nueva institución'}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </button>
            <button className="btn btn-primary" onClick={submit} disabled={saving}>
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
          </>
        }
      >
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Nombre de la institución</label>
            <input className="form-control" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Slug</label>
            <input className="form-control" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Código</label>
            <input className="form-control" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Teléfono</label>
            <input className="form-control" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Correo institucional</label>
            <input className="form-control" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Rector</label>
            <input className="form-control" value={form.rectorName} onChange={(e) => setForm({ ...form, rectorName: e.target.value })} />
          </div>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Dirección</label>
            <input className="form-control" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
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