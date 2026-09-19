'use client';

import { useEffect, useMemo, useState } from 'react';
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

function initialsOf(name?: string): string {
  return (name ?? '')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [roleOptions, setRoleOptions] = useState<RoleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [studentQuery, setStudentQuery] = useState('');
  const [roleTarget, setRoleTarget] = useState<User | null>(null);
  const [roleChoice, setRoleChoice] = useState('');

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
      setRoleTarget(null);
      setRoleChoice('');
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

  const countsByRole = useMemo(() => {
    const map = new Map<string, number>();
    for (const u of users) {
      const keys = u.roles?.length ? u.roles : u.role ? [u.role] : [];
      for (const k of keys) map.set(k, (map.get(k) ?? 0) + 1);
    }
    return map;
  }, [users]);

  const staffUsers = useMemo(() => users.filter((u) => !u.studentId), [users]);
  const studentUsers = useMemo(() => users.filter((u) => !!u.studentId), [users]);

  const usedRoles = useMemo(() => {
    const set = new Set<string>();
    for (const u of staffUsers) {
      for (const k of u.roles ?? []) set.add(k);
      if (u.role) set.add(u.role);
    }
    set.delete('ESTUDIANTE');
    return Array.from(set).sort();
  }, [staffUsers]);

  // Alcance: '' = todo el personal (sin estudiantes), 'ESTUDIANTE' = solo
  // estudiantes, otra clave = ese rol. La búsqueda filtra dentro del alcance.
  const scoped = !roleFilter
    ? staffUsers
    : roleFilter === 'ESTUDIANTE'
      ? studentUsers
      : users;
  const filtered = scoped.filter((u) => {
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      u.username.toLowerCase().includes(q) ||
      u.fullName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q);
    if (!matchesSearch) return false;
    if (!roleFilter || roleFilter === 'ESTUDIANTE') return true;
    const keys = u.roles?.length ? u.roles : u.role ? [u.role] : [];
    return keys.includes(roleFilter);
  });

  const activeCount = users.filter((u) => u.status === 'ACTIVE').length;

  const studentsWithoutUser = useMemo(() => {
    const q = studentQuery.trim().toLowerCase();
    const base = students.filter((s) => !users.some((u) => u.studentId === s.id));
    if (!q) return base;
    return base.filter(
      (s) =>
        s.studentCode.toLowerCase().includes(q) ||
        s.ci.toLowerCase().includes(q) ||
        `${s.firstName} ${s.lastName}`.toLowerCase().includes(q),
    );
  }, [students, users, studentQuery]);

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

      <div
        className="mb-3"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}
      >
        <div className="stat-card">
          <div className="stat-value">{users.length}</div>
          <div className="stat-label">Usuarios</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{activeCount}</div>
          <div className="stat-label">Activos</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{studentsWithoutUser.length}</div>
          <div className="stat-label">Estudiantes sin cuenta</div>
        </div>
      </div>

      <div className="card card-pad mb-3">
        <div className="flex gap-2 mb-3" style={{ flexWrap: 'wrap' }}>
          <button
            className={`btn btn-sm ${!roleFilter ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setRoleFilter('')}
          >
            Todo el personal
            <span
              style={{
                marginLeft: 8, fontSize: 11, fontWeight: 700,
                background: !roleFilter ? 'rgba(255,255,255,.25)' : 'var(--primary-soft)',
                color: !roleFilter ? '#fff' : 'var(--primary)',
                borderRadius: 999, padding: '1px 8px',
              }}
            >
              {staffUsers.length}
            </span>
          </button>
          {usedRoles.map((r) => (
            <button
              key={r}
              className={`btn btn-sm ${roleFilter === r ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setRoleFilter(roleFilter === r ? '' : r)}
            >
              {roleKeyLabel(r)}
              <span
                style={{
                  marginLeft: 8, fontSize: 11, fontWeight: 700,
                  background: roleFilter === r ? 'rgba(255,255,255,.25)' : 'var(--primary-soft)',
                  color: roleFilter === r ? '#fff' : 'var(--primary)',
                  borderRadius: 999, padding: '1px 8px',
                }}
              >
                {countsByRole.get(r) ?? 0}
              </span>
            </button>
          ))}
          <button
            className={`btn btn-sm ${roleFilter === 'ESTUDIANTE' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setRoleFilter(roleFilter === 'ESTUDIANTE' ? '' : 'ESTUDIANTE')}
          >
            Estudiante
            <span
              style={{
                marginLeft: 8, fontSize: 11, fontWeight: 700,
                background: roleFilter === 'ESTUDIANTE' ? 'rgba(255,255,255,.25)' : 'var(--primary-soft)',
                color: roleFilter === 'ESTUDIANTE' ? '#fff' : 'var(--primary)',
                borderRadius: 999, padding: '1px 8px',
              }}
            >
              {studentUsers.length}
            </span>
          </button>
        </div>
        <input
          className="form-control"
          placeholder="Buscar por usuario, nombre o correo…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 && (
        <div className="card card-pad mb-3">
          <div className="empty-state">
            <div className="empty-state-icon">🔑</div>
            No hay usuarios con ese criterio.
          </div>
        </div>
      )}

      <div
        className="mb-3"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 12,
        }}
      >
        {filtered.map((u) => {
          const keys = u.roles?.length ? u.roles : u.role ? [u.role] : [];
          return (
            <div
              key={u.id}
              className="card-pad"
              style={{
                border: '1px solid var(--border)',
                borderRadius: 12,
                background: 'var(--bg-card)',
                display: 'flex',
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 52, height: 52, borderRadius: '50%',
                  background: 'var(--primary-soft)', color: 'var(--primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: 17, flexShrink: 0,
                }}
              >
                {initialsOf(u.fullName)}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <strong style={{ fontSize: 14 }}>{u.username}</strong>
                  <StatusBadge value={u.status} />
                </div>
                <div style={{ fontSize: 13 }}>{u.fullName}</div>
                <div className="text-muted text-sm">{u.email}</div>
                <div className="flex" style={{ gap: 4, flexWrap: 'wrap', marginTop: 6 }}>
                  {keys.map((r) => (
                    <span key={r} className="badge badge-soft">{roleKeyLabel(r)}</span>
                  ))}
                  {keys.length === 0 && <span className="badge badge-neutral">Sin rol</span>}
                </div>
                {u.studentId ? (
                  <div className="text-muted text-sm" style={{ marginTop: 6 }}>
                    Cuenta de estudiante
                  </div>
                ) : (
                  <button
                    className="btn btn-outline btn-sm"
                    style={{ marginTop: 8 }}
                    onClick={() => { setRoleTarget(u); setRoleChoice(keys[0] ?? ''); }}
                  >
                    Cambiar rol
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <div className="card-title">Generar cuenta de estudiante ({studentsWithoutUser.length})</div>
        </div>
        <div className="card-pad">
          <p className="text-muted text-sm mb-3">
            Crea automáticamente una cuenta (rol Estudiante). La contraseña inicial será el CI del estudiante.
          </p>
          <input
            className="form-control mb-3"
            placeholder="Buscar estudiante por código, CI o nombre…"
            value={studentQuery}
            onChange={(e) => setStudentQuery(e.target.value)}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 320, overflowY: 'auto' }}>
            {studentsWithoutUser.slice(0, 30).map((s) => (
              <div
                key={s.id}
                className="flex justify-between items-center"
                style={{ gap: 8, padding: '6px 8px', border: '1px solid var(--border)', borderRadius: 8 }}
              >
                <span style={{ fontSize: 13 }}>
                  <strong>{s.studentCode}</strong> — {s.firstName} {s.lastName}
                  <span className="text-muted"> · {s.career?.name ?? '—'}</span>
                </span>
                <button className="btn btn-soft btn-sm" onClick={() => createFromStudent(s.id)}>
                  Crear usuario
                </button>
              </div>
            ))}
            {studentsWithoutUser.length === 0 && (
              <span className="text-muted text-sm">Todos los estudiantes ya tienen cuenta.</span>
            )}
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

      <Modal
        open={!!roleTarget}
        title={roleTarget ? `Cambiar rol de ${roleTarget.username}` : 'Cambiar rol'}
        onClose={() => setRoleTarget(null)}
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setRoleTarget(null)}>Cancelar</button>
            <button
              className="btn btn-primary"
              disabled={!roleChoice || (!!roleTarget?.studentId && roleChoice !== 'ESTUDIANTE')}
              onClick={() => roleTarget && roleChoice && assignRole(roleTarget, roleChoice)}
            >
              Confirmar cambio
            </button>
          </>
        }
      >
        {roleTarget && (
          <div>
            <p className="text-muted text-sm mb-3">
              <strong>{roleTarget.fullName}</strong> ({roleTarget.email}) tiene actualmente:{' '}
              <strong>
                {((roleTarget.roles?.length ? roleTarget.roles : roleTarget.role ? [roleTarget.role] : []).map(roleKeyLabel).join(', ')) || 'Sin rol'}
              </strong>
            </p>
            {roleTarget.studentId && (
              <p className="text-sm mb-3" style={{ color: 'var(--warning)', fontWeight: 600 }}>
                Cuenta vinculada a un estudiante: debe mantener el rol Estudiante.
              </p>
            )}
            <div className="form-group">
              <label className="form-label">Nuevo rol</label>
              <select className="select" value={roleChoice} onChange={(e) => setRoleChoice(e.target.value)}>
                <option value="">Seleccionar…</option>
                {roleOptions
                  .filter((r) => r.name === 'ESTUDIANTE' ? !!roleTarget?.studentId : true)
                  .map((r) => (
                    <option key={r.id} value={r.name}>{roleKeyLabel(r.name)}</option>
                  ))}
              </select>
              {roleTarget && !roleTarget.studentId && (
                <span className="text-muted text-sm">
                  El rol Estudiante solo aplica a cuentas vinculadas a un estudiante.
                </span>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
