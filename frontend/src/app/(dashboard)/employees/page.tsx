'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiDelete, apiGet, apiPatch, apiPost, extractError } from '@/lib/api';
import { Employee, EmployeeType, Person } from '@/lib/types';
import { PageHeader } from '@/components/ui/page-header';
import { Modal } from '@/components/ui/modal';
import { StatusBadge } from '@/components/ui/badge';
import { LoadingState, ErrorState } from '@/components/ui/state';

const EMPLOYEE_TYPES: { key: EmployeeType; label: string }[] = [
  { key: 'DIRECTIVO', label: 'Directivo' },
  { key: 'DOCENTE', label: 'Docente' },
  { key: 'ADMINISTRATIVO', label: 'Administrativo' },
  { key: 'APOYO', label: 'Apoyo' },
];

const TYPE_LABEL: Record<string, string> = Object.fromEntries(
  EMPLOYEE_TYPES.map((t) => [t.key, t.label]),
);

const TYPE_ORDER: EmployeeType[] = ['DIRECTIVO', 'DOCENTE', 'ADMINISTRATIVO', 'APOYO'];

function displayName(p?: Person): string {
  if (!p) return '—';
  return `${p.firstName} ${p.paternalSurname ?? ''} ${p.maternalSurname ?? ''}`.trim() || '—';
}

function initialsOf(p?: Person): string {
  return displayName(p)
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [persons, setPersons] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [form, setForm] = useState({
    personId: '',
    employeeType: 'ADMINISTRATIVO' as EmployeeType,
    position: '',
    hireDate: '',
  });
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<EmployeeType | ''>('');

  async function load() {
    setLoading(true);
    try {
      const [emps, pers] = await Promise.all([
        apiGet<Employee[]>('/employees'),
        apiGet<Person[]>('/persons'),
      ]);
      setEmployees(emps);
      setPersons(pers);
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
    setForm({ personId: '', employeeType: 'ADMINISTRATIVO', position: '', hireDate: '' });
    setModalOpen(true);
  }

  function openEdit(e: Employee) {
    setEditing(e);
    setForm({
      personId: e.personId,
      employeeType: e.employeeType,
      position: e.position ?? '',
      hireDate: e.hireDate ? String(e.hireDate).slice(0, 10) : '',
    });
    setModalOpen(true);
  }

  async function submit() {
    setSaving(true);
    try {
      const payload = {
        employeeType: form.employeeType,
        position: form.position,
        hireDate: form.hireDate || undefined,
      };
      if (editing) await apiPatch(`/employees/${editing.id}`, payload);
      else await apiPost('/employees', { personId: form.personId, ...payload });
      setModalOpen(false);
      await load();
    } catch (err) {
      setError(extractError(err));
    } finally {
      setSaving(false);
    }
  }

  async function deactivate(e: Employee) {
    if (!window.confirm(`¿Deshabilitar a ${displayName(e.persona)}?`)) return;
    try {
      await apiDelete(`/employees/${e.id}`);
      await load();
    } catch (err) {
      setError(extractError(err));
    }
  }

  const filtered = typeFilter
    ? employees.filter((e) => e.employeeType === typeFilter)
    : employees;

  const searched = search
    ? filtered.filter((e) => {
        const q = search.toLowerCase();
        const p = e.persona;
        return (
          e.employeeCode.toLowerCase().includes(q) ||
          displayName(p).toLowerCase().includes(q) ||
          p?.ci.toLowerCase().includes(q) ||
          (e.position ?? '').toLowerCase().includes(q)
        );
      })
    : filtered;

  const counts = useMemo(() => {
    const m = new Map<EmployeeType, number>();
    for (const e of employees) m.set(e.employeeType, (m.get(e.employeeType) ?? 0) + 1);
    return m;
  }, [employees]);

  const personOptions = useMemo(
    () => persons.filter((p) => !p.employees?.length).map((p) => ({ id: p.id, name: `${displayName(p)} — CI ${p.ci}` })),
    [persons],
  );

  const selectedPerson = editing?.persona ?? persons.find((p) => p.id === form.personId);

  if (loading && employees.length === 0) return <LoadingState />;

  return (
    <div>
      <PageHeader
        title="Empleados"
        subtitle="Personal del instituto vinculado a personas"
        actions={
          <button className="btn btn-primary" onClick={openCreate}>
            Nuevo empleado
          </button>
        }
      />

      {error && <ErrorState message={error} />}

      <div className="mb-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
        <div className="stat-card">
          <div className="stat-value">{employees.length}</div>
          <div className="stat-label">Empleados</div>
        </div>
        {TYPE_ORDER.map((t) => (
          <div key={t} className="stat-card">
            <div className="stat-value">{counts.get(t) ?? 0}</div>
            <div className="stat-label">{TYPE_LABEL[t]}</div>
          </div>
        ))}
      </div>

      <div className="card card-pad mb-3">
        <div className="flex gap-2 mb-3" style={{ flexWrap: 'wrap' }}>
          <button
            className={`btn btn-sm ${!typeFilter ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setTypeFilter('')}
          >
            Todos
            <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 700, background: !typeFilter ? 'rgba(255,255,255,.25)' : 'var(--primary-soft)', color: !typeFilter ? '#fff' : 'var(--primary)', borderRadius: 999, padding: '1px 8px' }}>
              {employees.length}
            </span>
          </button>
          {TYPE_ORDER.map((t) => (
            <button
              key={t}
              className={`btn btn-sm ${typeFilter === t ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setTypeFilter((typeFilter === t ? '' : t) as EmployeeType | '')}
            >
              {TYPE_LABEL[t]}
              <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 700, background: typeFilter === t ? 'rgba(255,255,255,.25)' : 'var(--primary-soft)', color: typeFilter === t ? '#fff' : 'var(--primary)', borderRadius: 999, padding: '1px 8px' }}>
                {counts.get(t) ?? 0}
              </span>
            </button>
          ))}
        </div>
        <input
          className="form-control"
          placeholder="Buscar por código, nombre o CI…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {searched.length === 0 && (
        <div className="card card-pad">
          <div className="empty-state">
            <div className="empty-state-icon">🪪</div>
            No hay empleados registrados.
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
        {searched.map((e) => (
          <div
            key={e.id}
            className="card-pad"
            style={{
              border: '1px solid var(--border)',
              borderRadius: 12,
              background: 'var(--bg-card)',
              display: 'flex',
              gap: 12,
            }}
          >
            {selectedPerson?.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={selectedPerson.photoUrl}
                alt={displayName(e.persona)}
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
                {initialsOf(e.persona)}
              </div>
            )}
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <strong style={{ fontSize: 14 }}>{displayName(e.persona)}</strong>
                <span className="badge badge-primary">{TYPE_LABEL[e.employeeType]}</span>
                <StatusBadge value={e.isActive ? 'ACTIVE' : 'INACTIVE'} />
              </div>
              <div className="text-muted text-sm" style={{ marginTop: 4 }}>
                {e.employeeCode} · CI {e.persona?.ci ?? '—'}
              </div>
              {e.position && <div className="text-muted text-sm">📌 {e.position}</div>}
              {e.hireDate && <div className="text-muted text-sm">📅 {String(e.hireDate).slice(0, 10)}</div>}
              <div className="flex gap-2" style={{ marginTop: 8 }}>
                <button className="btn btn-soft btn-sm" onClick={() => openEdit(e)}>Editar</button>
                {e.isActive && (
                  <button className="btn btn-outline btn-sm" onClick={() => deactivate(e)}>Deshabilitar</button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal
        open={modalOpen}
        title={editing ? 'Editar empleado' : 'Nuevo empleado'}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setModalOpen(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={submit} disabled={saving || (!editing && !form.personId)}>
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
          </>
        }
      >
        <div className="form-grid">
          {!editing && (
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Persona</label>
              <select
                className="select"
                value={form.personId}
                onChange={(e) => setForm({ ...form, personId: e.target.value })}
              >
                <option value="">Seleccionar persona…</option>
                {personOptions.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              {form.personId && selectedPerson && (
                <span className="text-muted text-sm" style={{ marginTop: 4 }}>
                  CI {selectedPerson.ci}{selectedPerson.ciExtension ? ` (${selectedPerson.ciExtension})` : ''} · {selectedPerson.email}
                </span>
              )}
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Tipo</label>
            <select
              className="select"
              value={form.employeeType}
              onChange={(e) => setForm({ ...form, employeeType: e.target.value as EmployeeType })}
            >
              {EMPLOYEE_TYPES.map((t) => (
                <option key={t.key} value={t.key}>{t.label}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Cargo / Especialidad</label>
            <input
              className="form-control"
              value={form.position}
              onChange={(e) => setForm({ ...form, position: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Fecha de contratación</label>
            <input
              className="form-control"
              type="date"
              value={form.hireDate}
              onChange={(e) => setForm({ ...form, hireDate: e.target.value })}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
