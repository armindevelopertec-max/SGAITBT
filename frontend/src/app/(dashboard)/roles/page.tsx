'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiDelete, apiGet, apiPatch, apiPost, extractError } from '@/lib/api';
import { PermissionInfo, RoleItem } from '@/lib/types';
import { PageHeader } from '@/components/ui/page-header';
import { Modal } from '@/components/ui/modal';
import { LoadingState, ErrorState } from '@/components/ui/state';
import { MICROLEGEND } from '@/lib/nav';

export default function RolesPage() {
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [permissions, setPermissions] = useState<PermissionInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', description: '', parentKey: '' });

  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<RoleItem | null>(null);
  const [selected, setSelected] = useState<string[]>([]);

  async function load() {
    setLoading(true);
    try {
      const [rs, ps] = await Promise.all([
        apiGet<RoleItem[]>('/roles'),
        apiGet<PermissionInfo[]>('/roles/permissions'),
      ]);
      setRoles(rs);
      setPermissions(ps);
    } catch (err) {
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const groups = useMemo(() => {
    const map = new Map<string, PermissionInfo[]>();
    for (const p of permissions) {
      const key = p.module ?? 'otros';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    }
    return Array.from(map.entries());
  }, [permissions]);

const roleLabel = (key?: string | null) =>
  key ? (MICROLEGEND[key] ?? key) : '—';
const parentName = (r: RoleItem) => r.parentName ?? '—';

  function openEdit(r: RoleItem) {
    setEditing(r);
    setSelected(r.permissions);
    setEditOpen(true);
  }

  async function submitCreate() {
    setSaving(true);
    try {
      await apiPost('/roles', createForm);
      setCreateOpen(false);
      setCreateForm({ name: '', description: '', parentKey: '' });
      await load();
    } catch (err) {
      setError(extractError(err));
    } finally {
      setSaving(false);
    }
  }

  async function submitPermissions() {
    if (!editing) return;
    setSaving(true);
    try {
      await apiPatch(`/roles/${editing.id}/permissions`, { permissionKeys: selected });
      setEditOpen(false);
      await load();
    } catch (err) {
      setError(extractError(err));
    } finally {
      setSaving(false);
    }
  }

  async function removeRole(r: RoleItem) {
    if (!window.confirm(`¿Eliminar el rol ${r.name}? Esta acción no se puede deshacer.`)) return;
    try {
      await apiDelete(`/roles/${r.id}`);
      await load();
    } catch (err) {
      setError(extractError(err));
    }
  }

  if (loading) return <LoadingState />;

  return (
    <div>
      <PageHeader
        title="Roles y permisos"
        subtitle="Gestión de roles del sistema y sus permisos"
        actions={
          <button className="btn btn-primary" onClick={() => setCreateOpen(true)}>
            Nuevo rol
          </button>
        }
      />

      {error && <ErrorState message={error} />}

      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Rol</th>
                <th>Hereda de</th>
                <th>Permisos</th>
                <th>Tipo</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {roles.map((r) => (
                <tr key={r.id}>
                  <td>
                    <strong>{roleLabel(r.name)}</strong>
                    <div className="text-muted text-sm">{r.description}</div>
                    <div className="text-muted text-xs" style={{ fontSize: 11 }}>clave: {r.name}</div>
                  </td>
                  <td>{parentName(r)}</td>
                  <td>
                    <span className="text-sm">{r.permissions.length} permisos</span>
                  </td>
                  <td>
                    {r.isSystem ? (
                      <span className="badge badge-purple">Sistema</span>
                    ) : (
                      <span className="badge badge-soft">Personalizado</span>
                    )}
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <button className="btn btn-soft btn-sm" onClick={() => openEdit(r)}>
                        {r.isSystem ? 'Ver permisos' : 'Editar permisos'}
                      </button>
                      {!r.isSystem && (
                        <button className="btn btn-outline btn-sm" onClick={() => removeRole(r)}>Eliminar</button>
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
        open={createOpen}
        title="Nuevo rol"
        onClose={() => setCreateOpen(false)}
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setCreateOpen(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={submitCreate} disabled={saving || !createForm.name.trim()}>
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
          </>
        }
      >
        <div className="form-grid">
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Nombre / clave (ej. CAJA)</label>
            <input className="form-control" value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} />
          </div>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Descripción</label>
            <input className="form-control" value={createForm.description} onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })} />
          </div>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Hereda de</label>
            <select className="select" value={createForm.parentKey} onChange={(e) => setCreateForm({ ...createForm, parentKey: e.target.value })}>
              <option value="">Sin rol padre</option>
              {roles.map((r) => (
                <option key={r.id} value={r.name}>{roleLabel(r.name)}</option>
              ))}
            </select>
          </div>
        </div>
      </Modal>

      <Modal
        open={editOpen}
        title={
          editing ? (editing.isSystem ? `Permisos de ${roleLabel(editing.name)}` : `Permisos de ${roleLabel(editing.name)}`) : ''
        }
        onClose={() => setEditOpen(false)}
        footer={
          editing?.isSystem ? (
            <button className="btn btn-outline" onClick={() => setEditOpen(false)}>Cerrar</button>
          ) : (
            <>
              <button className="btn btn-outline" onClick={() => setEditOpen(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={submitPermissions} disabled={saving}>
                {saving ? 'Guardando…' : 'Guardar permisos'}
              </button>
            </>
          )
        }
      >
        {editing?.isSystem && (
          <p className="text-muted text-sm mb-3">
            Rol de sistema: sus permisos se restablecen automáticamente al iniciar el servidor.
          </p>
        )}
        <div className="permission-groups">
          {groups.map(([module, perms]) => (
            <div key={module} className="permission-group">
              <div className="permission-group-title">{module}</div>
              <div className="permission-grid">
                {perms.map((p) => {
                  const checked = selected.includes(p.key);
                  return (
                    <label key={p.id} className={`permission-chip ${checked ? 'checked' : ''}`}>
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={editing?.isSystem}
                        onChange={() =>
                          setSelected((prev) =>
                            checked ? prev.filter((k) => k !== p.key) : [...prev, p.key],
                          )
                        }
                      />
                      {p.key}
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </Modal>

      {(createOpen || editOpen) && (
        <style>{`
          .permission-groups { display: flex; flex-direction: column; gap: 14px; max-height: 55vh; overflow: auto; padding-right: 4px; }
          .permission-group-title { text-transform: uppercase; font-size: 11px; font-weight: 800; letter-spacing: 0.06em; color: var(--text-muted); margin-bottom: 8px; }
          .permission-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap: 8px; }
          .permission-chip { display: flex; align-items: center; gap: 8px; border: 1px solid var(--border); border-radius: 8px; padding: 7px 10px; font-size: 12.5px; cursor: pointer; user-select: none; }
          .permission-chip.checked { border-color: var(--primary); background: var(--primary-soft); color: var(--primary); }
          .permission-chip input { accent-color: var(--primary); }
        `}</style>
      )}
    </div>
  );
}