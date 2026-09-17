'use client';

import { useEffect, useState } from 'react';
import { apiDelete, apiGet, apiPatch, apiPost, extractError } from '@/lib/api';
import { Person, PersonStatus } from '@/lib/types';
import { PageHeader } from '@/components/ui/page-header';
import { Modal } from '@/components/ui/modal';
import { StatusBadge } from '@/components/ui/badge';
import { LoadingState, ErrorState } from '@/components/ui/state';

interface PersonForm {
  ci: string;
  ciExtension: string;
  firstName: string;
  paternalSurname: string;
  maternalSurname: string;
  lastName: string;
  birthDate: string;
  sex: string;
  phone: string;
  email: string;
  address: string;
  status: PersonStatus;
}

const EMPTY: PersonForm = {
  ci: '',
  ciExtension: '',
  firstName: '',
  paternalSurname: '',
  maternalSurname: '',
  lastName: '',
  birthDate: '',
  sex: 'MALE',
  phone: '',
  email: '',
  address: '',
  status: 'ACTIVE',
};

export default function PersonsPage() {
  const [persons, setPersons] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Person | null>(null);
  const [form, setForm] = useState<PersonForm>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  async function load() {
    setLoading(true);
    try {
      setPersons(await apiGet<Person[]>('/persons', { search: search || undefined }));
    } catch (err) {
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [search]);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY);
    setModalOpen(true);
  }

  function openEdit(p: Person) {
    setEditing(p);
    setForm({
      ci: p.ci,
      ciExtension: p.ciExtension ?? '',
      firstName: p.firstName,
      paternalSurname: p.paternalSurname ?? '',
      maternalSurname: p.maternalSurname ?? '',
      lastName: p.lastName,
      birthDate: p.birthDate ? String(p.birthDate).slice(0, 10) : '',
      sex: p.sex ?? 'MALE',
      phone: p.phone ?? '',
      email: p.email,
      address: p.address ?? '',
      status: p.status,
    });
    setModalOpen(true);
  }

  async function submit() {
    setSaving(true);
    try {
      const payload = { ...form, birthDate: form.birthDate || undefined };
      if (editing) await apiPatch(`/persons/${editing.id}`, payload);
      else await apiPost('/persons', payload);
      setModalOpen(false);
      await load();
    } catch (err) {
      setError(extractError(err));
    } finally {
      setSaving(false);
    }
  }

  async function deactivate(p: Person) {
    if (!window.confirm(`¿Deshabilitar la persona ${p.firstName} ${p.lastName}?`)) return;
    try {
      await apiDelete(`/persons/${p.id}`);
      await load();
    } catch (err) {
      setError(extractError(err));
    }
  }

  if (loading && persons.length === 0) return <LoadingState />;

  return (
    <div>
      <PageHeader
        title="Personas"
        subtitle="Registro institucional de personas (vínculo de usuarios, estudiantes y empleados)"
        actions={
          <button className="btn btn-primary" onClick={openCreate}>
            Nueva persona
          </button>
        }
      />

      {error && <ErrorState message={error} />}

      <div className="card mb-3">
        <div className="card-pad flex gap-2" style={{ alignItems: 'center' }}>
          <input
            className="form-control"
            placeholder="Buscar por nombre, CI o correo…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ maxWidth: 360 }}
          />
          <span className="text-muted text-sm">Total: {persons.length}</span>
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Persona</th>
                <th>CI</th>
                <th>Correo</th>
                <th>Teléfono</th>
                <th>Vínculo</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {persons.length === 0 && (
                <tr>
                  <td colSpan={7}>
                    <div className="empty-state">
                      <div className="empty-state-icon">👤</div>
                      No hay personas registradas.
                    </div>
                  </td>
                </tr>
              )}
              {persons.map((p) => (
                <tr key={p.id}>
                  <td>
                    <strong>{`${p.firstName} ${p.paternalSurname ?? ''} ${p.maternalSurname ?? ''} ${p.lastName}`.trim()}</strong>
                    <div className="text-muted text-sm">CI {p.ci}</div>
                  </td>
                  <td>{p.ci}{p.ciExtension ? ` ${p.ciExtension}` : ''}</td>
                  <td>{p.email}</td>
                  <td>{p.phone ?? '—'}</td>
                  <td>
                    {p.user && <span className="badge badge-primary">Usuario</span>}{' '}
                    {p.student && <span className="badge badge-soft">Estudiante</span>}{' '}
                    {(p.employees?.length ?? 0) > 0 && (
                      <span className="badge badge-soft">Empleado</span>
                    )}
                  </td>
                  <td><StatusBadge value={p.status} /></td>
                  <td>
                    <div className="flex gap-2">
                      <button className="btn btn-soft btn-sm" onClick={() => openEdit(p)}>Editar</button>
                      {p.status === 'ACTIVE' && (
                        <button className="btn btn-outline btn-sm" onClick={() => deactivate(p)}>Deshabilitar</button>
                      )}
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
        title={editing ? 'Editar persona' : 'Nueva persona'}
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
            <label className="form-label">Carnet de identidad</label>
            <input className="form-control" value={form.ci} onChange={(e) => setForm({ ...form, ci: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Ext.</label>
            <input className="form-control" value={form.ciExtension} onChange={(e) => setForm({ ...form, ciExtension: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Nombres</label>
            <input className="form-control" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Apellido paterno</label>
            <input className="form-control" value={form.paternalSurname} onChange={(e) => setForm({ ...form, paternalSurname: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Apellido materno</label>
            <input className="form-control" value={form.maternalSurname} onChange={(e) => setForm({ ...form, maternalSurname: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Correo</label>
            <input className="form-control" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Teléfono</label>
            <input className="form-control" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Fecha de nacimiento</label>
            <input className="form-control" type="date" value={form.birthDate} onChange={(e) => setForm({ ...form, birthDate: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Sexo</label>
            <select className="select" value={form.sex} onChange={(e) => setForm({ ...form, sex: e.target.value })}>
              <option value="MALE">Masculino</option>
              <option value="FEMALE">Femenino</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Estado</label>
            <select className="select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as PersonStatus })}>
              <option value="ACTIVE">Activo</option>
              <option value="INACTIVE">Inactivo</option>
            </select>
          </div>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Dirección</label>
            <textarea className="textarea" rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
        </div>
      </Modal>
    </div>
  );
}