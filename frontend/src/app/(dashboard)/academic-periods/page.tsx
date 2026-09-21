'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiDelete, apiGet, apiPatch, apiPost, extractError } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { AcademicPeriod, PeriodStatus } from '@/lib/types';
import { PageHeader } from '@/components/ui/page-header';
import { Modal } from '@/components/ui/modal';
import { LoadingState, ErrorState } from '@/components/ui/state';

const EMPTY_PERIOD = {
  year: String(new Date().getFullYear()),
  sequence: '1',
  startDate: '',
  endDate: '',
  status: 'PLANNED' as PeriodStatus,
};

const SEQUENCES_PER_YEAR = 2;

function toRoman(n: number): string {
  const map: Array<[number, string]> = [
    [10, 'X'],
    [9, 'IX'],
    [5, 'V'],
    [4, 'IV'],
    [1, 'I'],
  ];
  let result = '';
  let value = n;
  for (const [num, sym] of map) {
    while (value >= num) {
      result += sym;
      value -= num;
    }
  }
  return result || String(n);
}

function parseISODate(iso?: string | null): Date | null {
  if (!iso) return null;
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function isoDay(iso?: string | null): string | null {
  if (!iso) return null;
  return iso.slice(0, 10);
}

function isPastPeriod(p: AcademicPeriod): boolean {
  const end = isoDay(p.endDate);
  return !!end && end < todayISO();
}

function hasNoDates(p: AcademicPeriod): boolean {
  return !isoDay(p.startDate) || !isoDay(p.endDate);
}

function isNotStartedPeriod(p: AcademicPeriod): boolean {
  const start = isoDay(p.startDate);
  return !!start && start > todayISO();
}

function isCurrentPeriod(p: AcademicPeriod): boolean {
  const today = todayISO();
  const start = isoDay(p.startDate);
  const end = isoDay(p.endDate);
  return !!start && !!end && start <= today && today <= end;
}

function fmtDate(iso?: string | null): string {
  if (!iso) return '—';
  const d = parseISODate(iso);
  if (!d) return iso;
  return d.toLocaleDateString('es-BO', { day: 'numeric', month: 'short', year: 'numeric' });
}

const STATUS_META: Record<PeriodStatus, { label: string; color: string; bg: string }> = {
  OPEN: { label: 'Abierto', color: 'var(--success)', bg: 'var(--success-soft)' },
  CLOSED: { label: 'Cerrado', color: 'var(--text-muted)', bg: '#f1f5f9' },
  PLANNED: { label: 'Planificado', color: 'var(--warning)', bg: 'var(--warning-soft)' },
};

export default function AcademicPeriodsPage() {
  const { user } = useAuth();
  const canCreatePeriod = hasPermission(user, 'periods.create');
  const canUpdatePeriod = hasPermission(user, 'periods.update');

  const [periods, setPeriods] = useState<AcademicPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');

  const [periodModalOpen, setPeriodModalOpen] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<AcademicPeriod | null>(null);
  const [periodForm, setPeriodForm] = useState(EMPTY_PERIOD);

  async function load() {
    setLoading(true);
    try {
      const p = await apiGet<AcademicPeriod[]>('/academic-periods');
      setPeriods(p);
    } catch (err) {
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const years = useMemo(
    () => Array.from(new Set(periods.map((p) => p.year))).sort().reverse(),
    [periods],
  );

  const filteredPeriods = filter
    ? periods.filter((p) => p.status === filter || p.year === filter)
    : periods;

  if (loading) return <LoadingState />;

  const openCount = periods.filter((p) => p.status === 'OPEN').length;
  const closedCount = periods.filter((p) => p.status === 'CLOSED').length;
  const plannedCount = periods.filter((p) => p.status === 'PLANNED').length;

  function openCreatePeriod() {
    setEditingPeriod(null);
    let year = String(new Date().getFullYear());
    let sequence = '1';
    if (periods.length > 0) {
      const sorted = [...periods].sort((a, b) =>
        a.year !== b.year ? Number(b.year) - Number(a.year) : (b.sequence ?? 0) - (a.sequence ?? 0),
      );
      const last = sorted[0];
      const lastSeq = last.sequence ?? 1;
      if (lastSeq >= SEQUENCES_PER_YEAR) {
        year = String(Number(last.year) + 1);
        sequence = '1';
      } else {
        year = last.year;
        sequence = String(lastSeq + 1);
      }
    }
    setPeriodForm({ ...EMPTY_PERIOD, year, sequence });
    setPeriodModalOpen(true);
  }

  function openEditPeriod(p: AcademicPeriod) {
    setEditingPeriod(p);
    setPeriodForm({
      year: p.year,
      sequence: String(p.sequence ?? 1),
      startDate: p.startDate ?? '',
      endDate: p.endDate ?? '',
      status: p.status,
    });
    setPeriodModalOpen(true);
  }

  async function submitPeriod() {
    if ((!periodForm.startDate || !periodForm.endDate) && periodForm.status !== 'PLANNED') {
      setError('Solo un periodo planificado puede guardarse sin fechas');
      return;
    }
    if (periodForm.startDate && periodForm.endDate && periodForm.endDate <= periodForm.startDate) {
      setError('La fecha de fin debe ser posterior a la fecha de inicio');
      return;
    }
    try {
      const payload = {
        year: periodForm.year,
        sequence: Number(periodForm.sequence) || 1,
        startDate: periodForm.startDate || undefined,
        endDate: periodForm.endDate || undefined,
        status: periodForm.status,
      };
      if (editingPeriod) await apiPatch(`/academic-periods/${editingPeriod.id}`, payload);
      else await apiPost('/academic-periods', payload);
      setPeriodModalOpen(false);
      await load();
    } catch (err) {
      setError(extractError(err));
    }
  }

  async function togglePeriodStatus(p: AcademicPeriod) {
    try {
      await apiPatch(`/academic-periods/${p.id}/${p.status === 'OPEN' ? 'close' : 'open'}`);
      await load();
    } catch (err) {
      setError(extractError(err));
    }
  }

  const periodPreviewName = periodForm.year
    ? `${toRoman(Number(periodForm.sequence) || 1)}/${periodForm.year}`
    : '';
  const periodPreview = editingPeriod ? editingPeriod.periodName : periodPreviewName;

  return (
    <div>
      <PageHeader
        title="Periodos Académicos"
        subtitle="Gestión de periodos académicos"
        actions={
          canCreatePeriod && (
            <button className="btn btn-primary" onClick={openCreatePeriod}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Nuevo periodo
            </button>
          )
        }
      />

      {error && <ErrorState message={error} />}

      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card" style={{ borderLeft: '4px solid var(--primary)' }}>
          <div className="stat-label">Total periodos</div>
          <div className="stat-value" style={{ color: 'var(--primary)' }}>{periods.length}</div>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid var(--success)' }}>
          <div className="stat-label">Abiertos</div>
          <div className="stat-value" style={{ color: 'var(--success)' }}>{openCount}</div>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid var(--text-muted)' }}>
          <div className="stat-label">Cerrados</div>
          <div className="stat-value" style={{ color: 'var(--text-muted)' }}>{closedCount}</div>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid var(--warning)' }}>
          <div className="stat-label">Planificados</div>
          <div className="stat-value" style={{ color: 'var(--warning)' }}>{plannedCount}</div>
        </div>
      </div>

      <div className="card" style={{ padding: '14px 20px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Filtrar:</span>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            onClick={() => setFilter('')}
            style={{
              padding: '5px 14px', borderRadius: 6, border: '1px solid',
              borderColor: !filter ? 'var(--primary)' : 'var(--border)',
              background: !filter ? 'var(--primary-soft)' : 'transparent',
              color: !filter ? 'var(--primary)' : 'var(--text-muted)',
              fontSize: 12.5, fontWeight: 600, cursor: 'pointer', transition: 'all 0.12s',
            }}
          >Todos</button>
          {years.map((y) => (
            <button
              key={y}
              onClick={() => setFilter(y)}
              style={{
                padding: '5px 14px', borderRadius: 6, border: '1px solid',
                borderColor: filter === y ? 'var(--primary)' : 'var(--border)',
                background: filter === y ? 'var(--primary-soft)' : 'transparent',
                color: filter === y ? 'var(--primary)' : 'var(--text-muted)',
                fontSize: 12.5, fontWeight: 600, cursor: 'pointer', transition: 'all 0.12s',
              }}
            >{y}</button>
          ))}
          <button
            onClick={() => setFilter('OPEN')}
            style={{
              padding: '5px 14px', borderRadius: 6, border: '1px solid',
              borderColor: filter === 'OPEN' ? 'var(--success)' : 'var(--border)',
              background: filter === 'OPEN' ? 'var(--success-soft)' : 'transparent',
              color: filter === 'OPEN' ? 'var(--success)' : 'var(--text-muted)',
              fontSize: 12.5, fontWeight: 600, cursor: 'pointer', transition: 'all 0.12s',
            }}
          >Abiertos</button>
          <button
            onClick={() => setFilter('CLOSED')}
            style={{
              padding: '5px 14px', borderRadius: 6, border: '1px solid',
              borderColor: filter === 'CLOSED' ? 'var(--text-muted)' : 'var(--border)',
              background: filter === 'CLOSED' ? '#f1f5f9' : 'transparent',
              color: filter === 'CLOSED' ? 'var(--text-muted)' : 'var(--text-muted)',
              fontSize: 12.5, fontWeight: 600, cursor: 'pointer', transition: 'all 0.12s',
            }}
          >Cerrados</button>
          <button
            onClick={() => setFilter('PLANNED')}
            style={{
              padding: '5px 14px', borderRadius: 6, border: '1px solid',
              borderColor: filter === 'PLANNED' ? 'var(--warning)' : 'var(--border)',
              background: filter === 'PLANNED' ? 'var(--warning-soft)' : 'transparent',
              color: filter === 'PLANNED' ? 'var(--warning)' : 'var(--text-muted)',
              fontSize: 12.5, fontWeight: 600, cursor: 'pointer', transition: 'all 0.12s',
            }}
          >Planificados</button>
        </div>
      </div>

      {filteredPeriods.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '60px 40px' }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 16px' }}>
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <h3 style={{ marginBottom: 8, fontWeight: 700 }}>Sin periodos registrados</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>Crea el primer periodo académico para comenzar.</p>
          {canCreatePeriod && (
            <button className="btn btn-primary" onClick={openCreatePeriod}>Crear periodo</button>
          )}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filteredPeriods.map((p) => {
          const meta = STATUS_META[p.status];
          const current = isCurrentPeriod(p);
          return (
            <div key={p.id} className="card" style={{
              padding: 0, overflow: 'hidden',
              borderLeft: `4px solid ${meta.color}`,
              transition: 'box-shadow 0.15s ease',
            }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-lg)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow)'; }}
            >
              <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>{p.periodName}</h3>
                    <span style={{
                      padding: '2px 10px', borderRadius: 999,
                      background: meta.bg, color: meta.color,
                      fontSize: 11.5, fontWeight: 700,
                    }}>{meta.label}</span>
                    {current && (
                      <span style={{
                        padding: '2px 10px', borderRadius: 999,
                        background: 'var(--success-soft)', color: 'var(--success)',
                        fontSize: 11.5, fontWeight: 700,
                      }}>En curso</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12.5, color: 'var(--text-muted)' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      {fmtDate(p.startDate)} — {fmtDate(p.endDate)}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {canUpdatePeriod && (
                    <>
                      <button className="btn btn-outline btn-sm" onClick={() => openEditPeriod(p)}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                        Editar
                      </button>
                      {p.status === 'OPEN' ? (
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => togglePeriodStatus(p)}
                          disabled={current}
                          title={current ? 'No se puede cerrar el periodo en curso' : 'Cerrar'}
                          style={{ display: 'flex', alignItems: 'center', gap: 5 }}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                            <line x1="9" y1="9" x2="15" y2="15" /><line x1="15" y1="9" x2="9" y2="15" />
                          </svg>
                          Cerrar
                        </button>
                      ) : (
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => togglePeriodStatus(p)}
                          disabled={isPastPeriod(p) || hasNoDates(p) || isNotStartedPeriod(p)}
                          title={isPastPeriod(p) ? 'No se puede abrir un periodo cuya fecha de fin ya pasó' : hasNoDates(p) ? 'El periodo aún no tiene fechas definidas' : isNotStartedPeriod(p) ? 'El periodo aún no inicia' : 'Abrir'}
                          style={{ display: 'flex', alignItems: 'center', gap: 5 }}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          Abrir
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Modal
        open={periodModalOpen}
        title={editingPeriod ? `Editar periodo ${editingPeriod.periodName}` : 'Nuevo periodo'}
        onClose={() => setPeriodModalOpen(false)}
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setPeriodModalOpen(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={submitPeriod}>Guardar</button>
          </>
        }
      >
        <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 16, lineHeight: 1.5 }}>
          El periodo es global para todas las carreras. El nombre se genera automáticamente: <strong>{periodPreview}</strong>. Un periodo planificado puede crearse sin fechas y completarlas después con <strong>Editar</strong>.
        </p>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Año</label>
            <input className="form-control" value={periodForm.year} maxLength={4} onChange={(e) => setPeriodForm({ ...periodForm, year: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Secuencia (1 = I, 2 = II)</label>
            <input className="form-control" type="number" min={1} value={periodForm.sequence} onChange={(e) => setPeriodForm({ ...periodForm, sequence: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Fecha de inicio</label>
            <input className="form-control" type="date" value={periodForm.startDate} onChange={(e) => setPeriodForm({ ...periodForm, startDate: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Fecha de fin</label>
            <input className="form-control" type="date" value={periodForm.endDate} onChange={(e) => setPeriodForm({ ...periodForm, endDate: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Estado</label>
            <select className="select" value={periodForm.status} onChange={(e) => setPeriodForm({ ...periodForm, status: e.target.value as PeriodStatus })}>
              <option value="PLANNED">Planificado</option>
              <option value="OPEN">Abierto</option>
              <option value="CLOSED">Cerrado</option>
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
}
