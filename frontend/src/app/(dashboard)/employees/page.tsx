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

const TYPES_WITH_ACCOUNT: EmployeeType[] = ['DIRECTIVO', 'DOCENTE', 'ADMINISTRATIVO'];

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

interface EmployeeForm {
  personId: string;
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
  employeeType: EmployeeType;
  position: string;
  hireDate: string;
}

const EMPTY_FORM: EmployeeForm = {
  personId: '',
  ci: '',
  ciExtension: '',
  firstName: '',
  paternalSurname: '',
  maternalSurname: '',
  lastName: '',
  birthDate: '',
  sex: '',
  phone: '',
  email: '',
  address: '',
  employeeType: 'ADMINISTRATIVO',
  position: '',
  hireDate: '',
};

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [persons, setPersons] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [form, setForm] = useState<EmployeeForm>(EMPTY_FORM);
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
    setForm(EMPTY_FORM);
    setModalOpen(true);
  }

  function openEdit(e: Employee) {
    setEditing(e);
    setForm({
      personId: e.personId,
      ci: e.person?.ci ?? '',
      ciExtension: e.person?.ciExtension ?? '',
      firstName: e.person?.firstName ?? '',
      paternalSurname: e.person?.paternalSurname ?? '',
      maternalSurname: e.person?.maternalSurname ?? '',
      lastName: e.person?.lastName ?? '',
      birthDate: e.person?.birthDate ? String(e.person.birthDate).slice(0, 10) : '',
      sex: e.person?.sex ?? '',
      phone: e.person?.phone ?? '',
      email: e.person?.email ?? '',
      address: e.person?.address ?? '',
      employeeType: e.employeeType,
      position: e.position ?? '',
      hireDate: e.hireDate ? String(e.hireDate).slice(0, 10) : '',
    });
    setModalOpen(true);
  }

  async function submit() {
    setSaving(true);
    try {
      if (editing) {
        await apiPatch(`/employees/${editing.id}`, {
          employeeType: form.employeeType,
          position: form.position,
          hireDate: form.hireDate || undefined,
        });
      } else {
        const lastName = [form.paternalSurname.trim(), form.maternalSurname.trim()].filter(Boolean).join(' ') || form.lastName.trim();
        const person = await apiPost<{ id: string }>('/persons', {
          ci: form.ci,
          ciExtension: form.ciExtension || undefined,
          firstName: form.firstName,
          paternalSurname: form.paternalSurname || undefined,
          maternalSurname: form.maternalSurname || undefined,
          lastName,
          birthDate: form.birthDate || undefined,
          sex: form.sex || undefined,
          phone: form.phone || undefined,
          email: form.email,
          address: form.address || undefined,
        });
        const employee = await apiPost<{ id: string }>('/employees', {
          personId: person.id,
          employeeType: form.employeeType,
          position: form.position,
          hireDate: form.hireDate || undefined,
        });

        if (TYPES_WITH_ACCOUNT.includes(form.employeeType)) {
          const result = await apiPost<{ user: { username: string }; password: string }>(`/users/employee/${employee.id}`, {
            roleKey: form.employeeType,
          });
          alert(`Cuenta creada para ${displayName({ firstName: form.firstName, paternalSurname: form.paternalSurname, maternalSurname: form.maternalSurname } as Person)}\n\nUsuario: ${result.user.username}\nContraseña: ${result.password}\n\nEntregue estas credenciales al empleado.`);
        }
      }
      setModalOpen(false);
      await load();
    } catch (err) {
      setError(extractError(err));
    } finally {
      setSaving(false);
    }
  }

  async function deactivate(e: Employee) {
    if (!window.confirm(`¿Deshabilitar a ${displayName(e.person)}?`)) return;
    try {
      await apiDelete(`/employees/${e.id}`);
      await load();
    } catch (err) {
      setError(extractError(err));
    }
  }

  async function createUserAccount(e: Employee) {
    if (!window.confirm(`¿Crear cuenta de usuario para ${displayName(e.person)}?`)) return;
    try {
      const result = await apiPost<{ user: { username: string }; password: string }>(`/users/employee/${e.id}`, {
        roleKey: e.employeeType,
      });
      alert(`Cuenta creada para ${displayName(e.person)}\n\nUsuario: ${result.user.username}\nContraseña: ${result.password}\n\nEntregue estas credenciales al empleado.`);
      await load();
    } catch (err) {
      setError(extractError(err));
    }
  }

  async function resetPassword(e: Employee) {
    if (!window.confirm(`¿Restablecer contraseña de ${displayName(e.person)}?`)) return;
    try {
      const result = await apiPost<{ username: string; password: string }>(`/users/employee/${e.id}/reset-password`);
      alert(`Contraseña restablecida para ${displayName(e.person)}\n\nUsuario: ${result.username}\nNueva contraseña: ${result.password}\n\nEntregue estas credenciales al empleado.`);
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
        const p = e.person;
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

  const selectedPerson = editing?.person ?? persons.find((p) => p.id === form.personId);

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
                alt={displayName(e.person)}
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
                {initialsOf(e.person)}
              </div>
            )}
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <strong style={{ fontSize: 14 }}>{displayName(e.person)}</strong>
                <span className="badge badge-primary">{TYPE_LABEL[e.employeeType]}</span>
                <StatusBadge value={e.isActive ? 'ACTIVE' : 'INACTIVE'} />
              </div>
              <div className="text-muted text-sm" style={{ marginTop: 4 }}>
                {e.employeeCode} · CI {e.person?.ci ?? '—'}
              </div>
              {e.position && <div className="text-muted text-sm">📌 {e.position}</div>}
              {e.hireDate && <div className="text-muted text-sm">📅 {String(e.hireDate).slice(0, 10)}</div>}
              {e.user && <div className="text-muted text-sm">🔑 Cuenta: {e.user.username}</div>}
              <div className="flex gap-2" style={{ marginTop: 8 }}>
                <button className="btn btn-soft btn-sm" onClick={() => openEdit(e)}>Editar</button>
                {e.user && TYPES_WITH_ACCOUNT.includes(e.employeeType) && (
                  <button className="btn btn-outline btn-sm" onClick={() => resetPassword(e)}>Restablecer contraseña</button>
                )}
                {!e.user && (
                  <button className="btn btn-outline btn-sm" onClick={() => createUserAccount(e)}>Crear cuenta</button>
                )}
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
            <button className="btn btn-primary" onClick={submit} disabled={saving}>
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
          </>
        }
      >
        <div className="form-grid">
          {!editing && (
            <>
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
                <label className="form-label">CI</label>
                <input className="form-control" value={form.ci} onChange={(e) => setForm({ ...form, ci: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Ext.</label>
                <input className="form-control" value={form.ciExtension} onChange={(e) => setForm({ ...form, ciExtension: e.target.value })} />
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
                  <option value="">—</option>
                  <option value="MALE">Masculino</option>
                  <option value="FEMALE">Femenino</option>
                </select>
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Dirección</label>
                <input className="form-control" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>
            </>
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
