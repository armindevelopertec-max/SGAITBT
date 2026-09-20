'use client';

import { useEffect, useMemo, useState } from 'react';
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

function displayName(p: Person): string {
  return `${p.firstName} ${p.paternalSurname ?? ''} ${p.maternalSurname ?? ''}`.trim() || p.lastName;
}

function initialsOf(p: Person): string {
  return displayName(p)
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export default function PersonsPage() {
  const [persons, setPersons] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Person | null>(null);
  const [form, setForm] = useState<PersonForm>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [linkFilter, setLinkFilter] = useState('employee');

  async function load(q?: string) {
    setLoading(true);
    try {
      setPersons(await apiGet<Person[]>('/persons', { search: q || undefined }));
    } catch (err) {
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(search);
  }, [search]);

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
      await load(search);
    } catch (err) {
      setError(extractError(err));
    } finally {
      setSaving(false);
    }
  }

  async function deactivate(p: Person) {
    if (!window.confirm(`¿Deshabilitar a ${displayName(p)}?`)) return;
    try {
      await apiDelete(`/persons/${p.id}`);
      await load(search);
    } catch (err) {
      setError(extractError(err));
    }
  }

  function linksOf(p: Person): string[] {
    const links: string[] = [];
    if (p.user) links.push('user');
    if (p.student) links.push('student');
    if ((p.employees?.length ?? 0) > 0) links.push('employee');
    return links;
  }

  const counts = useMemo(() => {
    let active = 0;
    const linkCounts = new Map<string, number>();
    for (const p of persons) {
      if (p.status === 'ACTIVE') active += 1;
      for (const l of linksOf(p)) linkCounts.set(l, (linkCounts.get(l) ?? 0) + 1);
    }
    return { active, linkCounts };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [persons]);

  const filtered = linkFilter ? persons.filter((p) => linksOf(p).includes(linkFilter)) : persons;

  const LINK_OPTIONS = [
    { key: '', label: 'Todos' },
    { key: 'user', label: 'Usuarios' },
    { key: 'student', label: 'Estudiantes' },
    { key: 'employee', label: 'Empleados' },
  ];

  if (loading && persons.length === 0) return <LoadingState />;

  return (
    <div>
      <PageHeader
        title="Personas"
        subtitle="Registro institucional de personas (vínculo de usuarios, estudiantes y empleados)"
      />

      {error && <ErrorState message={error} />}

      <div
        className="mb-3"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}
      >
        <div className="stat-card">
          <div className="stat-value">{persons.length}</div>
          <div className="stat-label">Personas</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{counts.active}</div>
          <div className="stat-label">Activas</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{counts.linkCounts.get('employee') ?? 0}</div>
          <div className="stat-label">Empleados</div>
        </div>
      </div>

      <div className="card card-pad mb-3">
        <div className="flex gap-2 mb-3" style={{ flexWrap: 'wrap' }}>
          {LINK_OPTIONS.map((o) => (
            <button
              key={o.key || 'all'}
              className={`btn btn-sm ${linkFilter === o.key ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setLinkFilter(o.key)}
            >
              {o.label}
              {o.key && (
                <span
                  style={{
                    marginLeft: 8, fontSize: 11, fontWeight: 700,
                    background: linkFilter === o.key ? 'rgba(255,255,255,.25)' : 'var(--primary-soft)',
                    color: linkFilter === o.key ? '#fff' : 'var(--primary)',
                    borderRadius: 999, padding: '1px 8px',
                  }}
                >
                  {counts.linkCounts.get(o.key) ?? 0}
                </span>
              )}
            </button>
          ))}
        </div>
        <input
          className="form-control"
          placeholder="Buscar por nombre, CI o correo…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 && (
        <div className="card card-pad">
          <div className="empty-state">
            <div className="empty-state-icon">👤</div>
            No hay personas registradas.
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
        {filtered.map((p) => (
          <div
            key={p.id}
            className="card-pad"
            style={{
              border: '1px solid var(--border)',
              borderRadius: 12,
              background: 'var(--bg-card)',
              display: 'flex',
              gap: 12,
            }}
          >
            {p.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={p.photoUrl}
                alt={displayName(p)}
                style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
              />
            ) : (
              <div
                style={{
                  width: 56, height: 56, borderRadius: '50%',
                  background: 'var(--primary-soft)', color: 'var(--primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: 18, flexShrink: 0,
                }}
              >
                {initialsOf(p)}
              </div>
            )}
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <strong style={{ fontSize: 14 }}>{displayName(p)}</strong>
                <StatusBadge value={p.status} />
              </div>
              <div className="text-muted text-sm">
                CI {p.ci}{p.ciExtension ? ` (${p.ciExtension})` : ''} · {p.email}
              </div>
              {p.phone && <div className="text-muted text-sm">📞 {p.phone}</div>}
              <div className="flex" style={{ gap: 4, flexWrap: 'wrap', marginTop: 6 }}>
                {p.user && <span className="badge badge-primary">Usuario</span>}
                {p.student && <span className="badge badge-soft">Estudiante</span>}
                {(p.employees?.length ?? 0) > 0 && (
                  <span className="badge badge-soft">Empleado</span>
                )}
                {linksOf(p).length === 0 && (
                  <span className="badge badge-neutral">Sin vínculo</span>
                )}
              </div>
              <div className="flex gap-2" style={{ marginTop: 8 }}>
                <button className="btn btn-soft btn-sm" onClick={() => openEdit(p)}>Editar</button>
                {p.status === 'ACTIVE' && (
                  <button className="btn btn-outline btn-sm" onClick={() => deactivate(p)}>Deshabilitar</button>
                )}
              </div>
            </div>
          </div>
        ))}
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
