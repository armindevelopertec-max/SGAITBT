'use client';

import { useEffect, useState } from 'react';
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
    setForm({
      personId: '',
      employeeType: 'ADMINISTRATIVO',
      position: '',
      hireDate: '',
    });
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
      if (editing) {
        await apiPatch(`/employees/${editing.id}`, payload);
      } else {
        await apiPost('/employees', {
          personId: form.personId,
          ...payload,
        });
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
    if (!window.confirm(`¿Deshabilitar al empleado ${e.employeeCode}?`)) return;
    try {
      await apiDelete(`/employees/${e.id}`);
      await load();
    } catch (err) {
      setError(extractError(err));
    }
  }

  const personName = (p?: Person) =>
    p ? `${p.firstName} ${p.paternalSurname ?? ''} ${p.lastName}`.trim() : '—';

  if (loading && employees.length === 0) return <LoadingState />;

  return (
    <div>
      <PageHeader
        title="Empleados"
        subtitle="Empleados del instituto vinculados a personas"
        actions={
          <button className="btn btn-primary" onClick={openCreate}>
            Nuevo empleado
          </button>
        }
      />

      {error && <ErrorState message={error} />}

      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Persona</th>
                <th>CI</th>
                <th>Tipo</th>
                <th>Cargo / Especialidad</th>
                <th>Contratación</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {employees.length === 0 && (
                <tr>
                  <td colSpan={8}>
                    <div className="empty-state">
                      <div className="empty-state-icon">🪪</div>
                      No hay empleados registrados.
                    </div>
                  </td>
                </tr>
              )}
              {employees.map((e) => (
                <tr key={e.id}>
                  <td><strong>{e.employeeCode}</strong></td>
                  <td>{personName(e.persona)}</td>
                  <td>{e.persona?.ci ?? '—'}</td>
                  <td>{TYPE_LABEL[e.employeeType] ?? e.employeeType}</td>
                  <td>{e.position ?? '—'}</td>
                  <td>{e.hireDate ? String(e.hireDate).slice(0, 10) : '—'}</td>
                  <td><StatusBadge value={e.isActive ? 'ACTIVE' : 'INACTIVE'} /></td>
                  <td>
                    <div className="flex gap-2">
                      <button className="btn btn-soft btn-sm" onClick={() => openEdit(e)}>Editar</button>
                      {e.isActive && (
                        <button className="btn btn-outline btn-sm" onClick={() => deactivate(e)}>Deshabilitar</button>
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
              <select className="select" value={form.personId} onChange={(e) => setForm({ ...form, personId: e.target.value })}>
                <option value="">Seleccionar persona…</option>
                {persons.map((p) => (
                  <option key={p.id} value={p.id}>
                    {`${p.firstName} ${p.paternalSurname ?? ''} ${p.lastName}`.trim()} — CI {p.ci}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Tipo</label>
            <select className="select" value={form.employeeType} onChange={(e) => setForm({ ...form, employeeType: e.target.value as EmployeeType })}>
              {EMPLOYEE_TYPES.map((t) => (
                <option key={t.key} value={t.key}>{t.label}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Cargo / Especialidad</label>
            <input className="form-control" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Fecha de contratación</label>
            <input className="form-control" type="date" value={form.hireDate} onChange={(e) => setForm({ ...form, hireDate: e.target.value })} />
          </div>
        </div>
      </Modal>
    </div>
  );
}