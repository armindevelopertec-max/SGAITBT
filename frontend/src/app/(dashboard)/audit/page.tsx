'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiGet, extractError } from '@/lib/api';
import { AuditLog } from '@/lib/types';
import { PageHeader } from '@/components/ui/page-header';
import { Modal } from '@/components/ui/modal';
import { Badge } from '@/components/ui/badge';
import { LoadingState, ErrorState } from '@/components/ui/state';

const MODULE_OPTIONS = [
  'roles',
  'persons',
  'employees',
  'users',
  'institution',
  'careers',
  'subjects',
  'periods',
  'students',
  'deposits',
  'enrollments',
  'grades',
];

const ACTION_OPTIONS = ['CREATE', 'UPDATE', 'UPDATE_PERMISSIONS', 'DELETE'];

const ACTION_COLOR: Record<string, 'success' | 'info' | 'warning' | 'danger' | 'neutral'> = {
  CREATE: 'success',
  UPDATE: 'info',
  UPDATE_PERMISSIONS: 'warning',
  DELETE: 'danger',
};

interface AuditResponse {
  items: AuditLog[];
  total: number;
}

const PAGE_SIZE = 50;

function timeLabel(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('es-BO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export default function AuditPage() {
  const [items, setItems] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [module, setModule] = useState('');
  const [action, setAction] = useState('');
  const [page, setPage] = useState(0);
  const [detail, setDetail] = useState<AuditLog | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiGet<AuditResponse>('/audit', {
        module: module || undefined,
        action: action || undefined,
        take: PAGE_SIZE,
        skip: page * PAGE_SIZE,
      });
      setItems(data.items);
      setTotal(data.total);
    } catch (err) {
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  }, [module, action, page]);

  useEffect(() => {
    load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <PageHeader
        title="Auditoría"
        subtitle="Bitácora de acciones registradas en el sistema"
      />

      {error && <ErrorState message={error} />}

      <div className="card mb-3">
        <div className="card-pad flex gap-3" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            className="select"
            value={module}
            onChange={(e) => {
              setModule(e.target.value);
              setPage(0);
            }}
            style={{ maxWidth: 220 }}
          >
            <option value="">Todos los módulos</option>
            {MODULE_OPTIONS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <select
            className="select"
            value={action}
            onChange={(e) => {
              setAction(e.target.value);
              setPage(0);
            }}
            style={{ maxWidth: 200 }}
          >
            <option value="">Todas las acciones</option>
            {ACTION_OPTIONS.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          <button
            className="btn btn-outline btn-sm"
            onClick={() => {
              setPage(0);
              load();
            }}
          >
            Actualizar
          </button>
          <span className="text-muted text-sm" style={{ marginLeft: 'auto' }}>
            Total: {total} registro(s)
          </span>
        </div>
      </div>

      {loading ? (
        <LoadingState />
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Usuario</th>
                  <th>Módulo</th>
                  <th>Acción</th>
                  <th>Entidad</th>
                  <th>IP</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 && (
                  <tr>
                    <td colSpan={7}>
                      <div className="empty-state">
                        <div className="empty-state-icon">🕵️</div>
                        No hay registros de auditoría con los filtros seleccionados.
                      </div>
                    </td>
                  </tr>
                )}
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>{timeLabel(item.createdAt)}</td>
                    <td>
                      <strong>{item.username ?? '—'}</strong>
                      {item.description && (
                        <div className="text-muted text-sm">{item.description}</div>
                      )}
                    </td>
                    <td><Badge label={item.module} color="info" /></td>
                    <td>
                      <Badge label={item.action} color={ACTION_COLOR[item.action] ?? 'neutral'} />
                    </td>
                    <td>
                      <span className="text-sm">
                        {item.entityType ?? '—'}
                        {item.entityId ? ` · ${item.entityId.slice(0, 8)}…` : ''}
                      </span>
                    </td>
                    <td>{item.ip ?? '—'}</td>
                    <td>
                      {(isRecord(item.newValue) || isRecord(item.previousValue)) && (
                        <button className="btn btn-soft btn-sm" onClick={() => setDetail(item)}>
                          Ver detalle
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="card-pad flex gap-2" style={{ alignItems: 'center', justifyContent: 'flex-end' }}>
              <button
                className="btn btn-outline btn-sm"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                ← Anterior
              </button>
              <span className="text-sm">
                Página {page + 1} de {totalPages}
              </span>
              <button
                className="btn btn-outline btn-sm"
                disabled={page + 1 >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Siguiente →
              </button>
            </div>
          )}
        </div>
      )}

      <Modal
        open={detail !== null}
        title="Detalle de auditoría"
        onClose={() => setDetail(null)}
        footer={
          <button className="btn btn-outline" onClick={() => setDetail(null)}>
            Cerrar
          </button>
        }
      >
        {detail && (
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Acción</label>
              <Badge label={detail.action} color={ACTION_COLOR[detail.action] ?? 'neutral'} />
            </div>
            <div className="form-group">
              <label className="form-label">Entidad</label>
              <span className="text-sm">
                {detail.entityType ?? '—'} {detail.entityId ? `(${detail.entityId})` : ''}
              </span>
            </div>
            {isRecord(detail.previousValue) && (
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Valor anterior</label>
                <pre className="audit-json">{JSON.stringify(detail.previousValue, null, 2)}</pre>
              </div>
            )}
            {isRecord(detail.newValue) && (
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Valor nuevo</label>
                <pre className="audit-json">{JSON.stringify(detail.newValue, null, 2)}</pre>
              </div>
            )}
          </div>
        )}
      </Modal>

      <style>{`
        .audit-json {
          background: #0f172a;
          color: #e2e8f0;
          border-radius: 10px;
          padding: 12px 14px;
          font-size: 12px;
          line-height: 1.5;
          overflow: auto;
          max-height: 40vh;
          margin: 0;
        }
      `}</style>
    </div>
  );
}