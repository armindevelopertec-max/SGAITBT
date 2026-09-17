'use client';

import { useEffect, useState } from 'react';
import { apiGet, apiPatch, apiPost, extractError } from '@/lib/api';
import { RoleItem, User, Student } from '@/lib/types';
import { PageHeader } from '@/components/ui/page-header';
import { Modal } from '@/components/ui/modal';
import { StatusBadge } from '@/components/ui/badge';
import { LoadingState, ErrorState } from '@/components/ui/state';
import { MICROLEGEND } from '@/lib/nav';

const EMPTY = {
  username: '',
  fullName: '',
  email: '',
  password: 'estudiante2026',
  roleKeys: ['ESTUDIANTE'],
};

function roleKeyLabel(key?: string): string {
  return key ? (MICROLEGEND[key] ?? key) : '—';
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [roleOptions, setRoleOptions] = useState<RoleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);

  async function load() {
    setLoading(true);
    try {
      const [u, s, rs] = await Promise.all([
        apiGet<User[]>('/users'),
        apiGet<Student[]>('/students'),
        apiGet<RoleItem[]>('/users/roles'),
      ]);
      setUsers(u);
      setStudents(s);
      setRoleOptions(rs);
    } catch (err) {
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function assignRole(u: User, roleKey: string) {
    try {
      await apiPatch(`/users/${u.id}/roles`, { roleKeys: [roleKey] });
      await load();
    } catch (err) {
      setError(extractError(err));
    }
  }

  async function submit() {
    try {
      await apiPost('/users', form);
      setModalOpen(false);
      await load();
    } catch (err) {
      setError(extractError(err));
    }
  }

  async function createFromStudent(studentId: string) {
    try {
      await apiPost(`/users/student/${studentId}`);
      await load();
    } catch (err) {
      setError(extractError(err));
    }
  }

  if (loading) return <LoadingState />;

  return (
    <div>
      <PageHeader
        title="Usuarios"
        subtitle="Gestión de cuentas y roles del sistema"
        actions={
          <button className="btn btn-primary" onClick={() => { setForm(EMPTY); setModalOpen(true); }}>
            Nuevo usuario
          </button>
        }
      />

      {error && <ErrorState message={error} />}

      <div className="card">
        <div className="card-header">
          <div className="card-title">Usuarios del sistema</div>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Nombre completo</th>
                <th>Correo</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 && (
                <tr>
                  <td colSpan={6}>
                    <div className="empty-state">
                      <div className="empty-state-icon">🔑</div>
                      No hay usuarios registrados.
                    </div>
                  </td>
                </tr>
              )}
              {users.map((u) => (
                <tr key={u.id}>
                  <td><strong>{u.username}</strong></td>
                  <td>{u.fullName}</td>
                  <td>{u.email}</td>
                  <td>
                    <div className="flex gap-1" style={{ flexWrap: 'wrap', gap: 4 }}>
                      {(u.roles ?? []).map((r) => (
                        <span key={r} className="badge badge-soft">{roleKeyLabel(r)}</span>
                      ))}
                      {(u.roles?.length ?? 0) === 0 && (
                        <span className="badge badge-neutral">{roleKeyLabel(u.role)}</span>
                      )}
                    </div>
                  </td>
                  <td><StatusBadge value={u.status} /></td>
                  <td>
                    <div className="flex gap-2" style={{ alignItems: 'center' }}>
                      <select
                        className="select"
                        style={{ minWidth: 150 }}
                        value={u.roles?.[0] ?? ''}
                        onChange={(e) => {
                          if (e.target.value) assignRole(u, e.target.value);
                        }}
                      >
                        <option value="">Asignar rol…</option>
                        {roleOptions.map((r) => (
                          <option key={r.id} value={r.name}>{roleKeyLabel(r.name)}</option>
                        ))}
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card mt-4">
        <div className="card-header">
          <div className="card-title">Generar cuenta de estudiante</div>
        </div>
        <div className="card-pad">
          <p className="text-muted text-sm mb-3">
            Crea automáticamente una cuenta de usuario (rol Estudiante) a partir del registro del estudiante.
            La contraseña inicial será el CI del estudiante.
          </p>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Estudiante</th>
                  <th>Carrera</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {students.filter((s) => !users.some((u) => u.studentId === s.id)).map((s) => (
                  <tr key={s.id}>
                    <td>{s.studentCode}</td>
                    <td>{s.firstName} {s.lastName}</td>
                    <td>{s.career?.name ?? '—'}</td>
                    <td>
                      <button className="btn btn-soft btn-sm" onClick={() => createFromStudent(s.id)}>
                        Crear usuario
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal open={modalOpen} title="Nuevo usuario" onClose={() => setModalOpen(false)}
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setModalOpen(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={submit}>Guardar</button>
          </>
        }
      >
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Nombre de usuario</label>
            <input className="form-control" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Nombre completo</label>
            <input className="form-control" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Correo</label>
            <input className="form-control" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Contraseña inicial</label>
            <input className="form-control" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Rol</label>
            <select className="select" value={form.roleKeys[0]} onChange={(e) => setForm({ ...form, roleKeys: [e.target.value] })}>
              {roleOptions.map((r) => (
                <option key={r.id} value={r.name}>{roleKeyLabel(r.name)}</option>
              ))}
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
}