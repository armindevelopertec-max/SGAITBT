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
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [permissions]);

  const roleLabel = (key?: string | null) => (key ? (MICROLEGEND[key] ?? key) : '—');

  const systemRoles = useMemo(() => roles.filter((r) => r.isSystem).length, [roles]);
  const customRoles = roles.length - systemRoles;

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

      <div className="mb-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
        <div className="stat-card">
          <div className="stat-value">{roles.length}</div>
          <div className="stat-label">Roles totales</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{systemRoles}</div>
          <div className="stat-label">De sistema</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{customRoles}</div>
          <div className="stat-label">Personalizados</div>
        </div>
      </div>

      <div className="card card-pad mb-3">
        <div className="flex gap-2 mb-3" style={{ flexWrap: 'wrap' }}>
          {groups.map(([module, perms]) => (
            <span
              key={module}
              className="badge badge-soft"
              style={{ fontSize: 12, cursor: 'default' }}
              title={`${perms.length} permisos`}
            >
              {module}
              <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 700, background: 'rgba(255,255,255,.2)', borderRadius: 999, padding: '0 6px' }}>
                {perms.length}
              </span>
            </span>
          ))}
        </div>
      </div>

      {roles.length === 0 && (
        <div className="card card-pad">
          <div className="empty-state">
            <div className="empty-state-icon">🔐</div>
            No hay roles registrados.
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
        {roles.map((r) => (
          <div
            key={r.id}
            className="card-pad"
            style={{
              border: '1px solid var(--border)',
              borderRadius: 12,
              background: 'var(--bg-card)',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <strong style={{ fontSize: 14 }}>{roleLabel(r.name)}</strong>
                  {r.isSystem ? (
                    <span className="badge badge-purple">Sistema</span>
                  ) : (
                    <span className="badge badge-soft">Personalizado</span>
                  )}
                </div>
                {r.description && <div className="text-muted text-sm" style={{ marginTop: 2 }}>{r.description}</div>}
                <div className="text-muted text-xs" style={{ fontSize: 11, marginTop: 2 }}>clave: {r.name}</div>
                {r.parentName && (
                  <div className="text-muted text-xs" style={{ fontSize: 11 }}>
                    Hereda de: {r.parentName}
                  </div>
                )}
              </div>
            </div>

            <div className="text-sm text-muted" style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <span>🔑 {r.permissions.length} permisos</span>
              {r.parentName && <span>↳ {r.parentName}</span>}
            </div>

            <div className="flex gap-2" style={{ marginTop: 4, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
              <button className="btn btn-soft btn-sm" onClick={() => openEdit(r)}>
                {r.isSystem ? 'Ver permisos' : 'Editar permisos'}
              </button>
              {!r.isSystem && (
                <button className="btn btn-outline btn-sm" onClick={() => removeRole(r)}>Eliminar</button>
              )}
            </div>
          </div>
        ))}
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
        title={editing ? `Permisos de ${roleLabel(editing.name)}` : ''}
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