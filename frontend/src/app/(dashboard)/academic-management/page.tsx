'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiDelete, apiGet, apiPatch, apiPost, extractError } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import {
  AcademicPeriod,
  CalendarEvent,
  CalendarEventCategory,
  PeriodStatus,
} from '@/lib/types';
import { PageHeader } from '@/components/ui/page-header';
import { Modal } from '@/components/ui/modal';
import { StatusBadge } from '@/components/ui/badge';
import { LoadingState, ErrorState } from '@/components/ui/state';

const EMPTY_PERIOD = {
  year: String(new Date().getFullYear()),
  sequence: '1',
  startDate: '',
  endDate: '',
  status: 'PLANNED' as PeriodStatus,
};

const EMPTY_EVENT = {
  title: '',
  category: 'OTHER' as CalendarEventCategory,
  startDate: '',
  endDate: '',
  description: '',
  academicPeriodId: '',
};

const CATEGORIES: Array<{ key: CalendarEventCategory; title: string; color: string; bg: string }> = [
  { key: 'PERIODO', title: 'Período académico', color: 'var(--primary)', bg: 'var(--primary-soft)' },
  { key: 'MATRICULA', title: 'Matrícula e inscripciones', color: 'var(--info)', bg: 'var(--info-soft)' },
  { key: 'ACTIVIDAD', title: 'Actividades académicas', color: 'var(--purple)', bg: 'var(--purple-soft)' },
  { key: 'EVALUACION', title: 'Evaluaciones', color: 'var(--warning)', bg: 'var(--warning-soft)' },
  { key: 'RECESO', title: 'Recesos y feriados', color: 'var(--success)', bg: 'var(--success-soft)' },
  { key: 'CIERRE', title: 'Cierre', color: 'var(--danger)', bg: 'var(--danger-soft)' },
  { key: 'OTHER', title: 'Otros', color: 'var(--text-muted)', bg: '#f1f5f9' },
];

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

function fmtRange(start?: string | null, end?: string | null): string {
  const s = parseISODate(start);
  if (!s) return '—';
  const e = parseISODate(end);
  if (!e || end === start) return fmtDate(start);
  const sameMonth = s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear();
  if (sameMonth) {
    const monthYear = s.toLocaleDateString('es-BO', { month: 'long', year: 'numeric' });
    return `${s.getDate()} – ${e.getDate()} de ${monthYear}`;
  }
  return `${fmtDate(start)} – ${fmtDate(end)}`;
}

const STATUS_META: Record<PeriodStatus, { label: string; color: string; bg: string }> = {
  OPEN: { label: 'Abierto', color: 'var(--success)', bg: 'var(--success-soft)' },
  CLOSED: { label: 'Cerrado', color: 'var(--text-muted)', bg: '#f1f5f9' },
  PLANNED: { label: 'Planificado', color: 'var(--warning)', bg: 'var(--warning-soft)' },
};

export default function AcademicManagementPage() {
  const { user } = useAuth();
  const canCreatePeriod = hasPermission(user, 'periods.create');
  const canUpdatePeriod = hasPermission(user, 'periods.update');
  const canCreateEvent = hasPermission(user, 'calendar.create');
  const canUpdateEvent = hasPermission(user, 'calendar.update');
  const canDeleteEvent = hasPermission(user, 'calendar.delete');

  const [tab, setTab] = useState<'periodos' | 'calendario'>('periodos');
  const [periods, setPeriods] = useState<AcademicPeriod[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');

  const [periodModalOpen, setPeriodModalOpen] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<AcademicPeriod | null>(null);
  const [periodForm, setPeriodForm] = useState(EMPTY_PERIOD);

  const [selectedPeriodId, setSelectedPeriodId] = useState('');
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [eventForm, setEventForm] = useState(EMPTY_EVENT);

  async function load() {
    setLoading(true);
    try {
      const [p, e] = await Promise.all([
        apiGet<AcademicPeriod[]>('/academic-periods'),
        apiGet<CalendarEvent[]>('/calendar-events'),
      ]);
      setPeriods(p);
      setEvents(e);
      setSelectedPeriodId((prev) => {
        if (prev && p.some((x) => x.id === prev)) return prev;
        const open = p.find((x) => x.status === 'OPEN');
        return open?.id ?? p[0]?.id ?? '';
      });
    } catch (err) {
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const years = useMemo(
    () => Array.from(new Set(periods.map((p) => p.year))).sort().reverse(),
    [periods],
  );

  const eventsByPeriod = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of events) {
      map.set(e.academicPeriodId, (map.get(e.academicPeriodId) ?? 0) + 1);
    }
    return map;
  }, [events]);

  const periodEvents = useMemo(
    () =>
      events
        .filter((e) => !selectedPeriodId || e.academicPeriodId === selectedPeriodId)
        .sort((a, b) => (a.startDate < b.startDate ? -1 : a.startDate > b.startDate ? 1 : 0)),
    [events, selectedPeriodId],
  );

  const selectedPeriod = periods.find((p) => p.id === selectedPeriodId);

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

  function openCreateEvent() {
    setEditingEvent(null);
    setEventForm({ ...EMPTY_EVENT, academicPeriodId: selectedPeriodId });
    setEventModalOpen(true);
  }

  function openEditEvent(e: CalendarEvent) {
    setEditingEvent(e);
    setEventForm({
      title: e.title,
      category: e.category,
      startDate: e.startDate,
      endDate: e.endDate ?? '',
      description: e.description ?? '',
      academicPeriodId: e.academicPeriodId,
    });
    setEventModalOpen(true);
  }

  async function submitEvent() {
    try {
      const payload = {
        title: eventForm.title,
        category: eventForm.category,
        startDate: eventForm.startDate,
        endDate: eventForm.endDate || undefined,
        description: eventForm.description || undefined,
        academicPeriodId: eventForm.academicPeriodId,
      };
      if (editingEvent) await apiPatch(`/calendar-events/${editingEvent.id}`, payload);
      else await apiPost('/calendar-events', payload);
      setEventModalOpen(false);
      await load();
    } catch (err) {
      setError(extractError(err));
    }
  }

  async function toggleEventStatus(e: CalendarEvent) {
    try {
      await apiPatch(`/calendar-events/${e.id}`, {
        status: e.status === 'ACTIVE' ? 'CANCELLED' : 'ACTIVE',
      });
      await load();
    } catch (err) {
      setError(extractError(err));
    }
  }

  async function deleteEvent(e: CalendarEvent) {
    if (!window.confirm(`¿Eliminar el evento "${e.title}"?`)) return;
    try {
      await apiDelete(`/calendar-events/${e.id}`);
      await load();
    } catch (err) {
      setError(extractError(err));
    }
  }

  const periodPreviewName = periodForm.year
    ? `${toRoman(Number(periodForm.sequence) || 1)}/${periodForm.year}`
    : '';
  const periodPreview = editingPeriod ? editingPeriod.periodName : periodPreviewName;

  const filteredPeriods = filter
    ? periods.filter((p) => p.status === filter || p.year === filter)
    : periods;

  if (loading) return <LoadingState />;

  const openCount = periods.filter((p) => p.status === 'OPEN').length;
  const closedCount = periods.filter((p) => p.status === 'CLOSED').length;
  const plannedCount = periods.filter((p) => p.status === 'PLANNED').length;

  return (
    <div>
      <PageHeader
        title="Gestión Académica"
        subtitle="Periodos académicos y calendario institucional"
        actions={
          tab === 'periodos'
            ? canCreatePeriod && (
                <button className="btn btn-primary" onClick={openCreatePeriod}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Nuevo periodo
                </button>
              )
            : canCreateEvent && (
                <button className="btn btn-primary" onClick={openCreateEvent}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Nuevo evento
                </button>
              )
        }
      />

      {error && <ErrorState message={error} />}

      <div style={{
        display: 'flex',
        gap: 6,
        background: 'var(--bg)',
        padding: '4px',
        borderRadius: 10,
        border: '1px solid var(--border)',
        width: 'fit-content',
        marginBottom: 24,
      }}>
        <button
          onClick={() => setTab('periodos')}
          style={{
            padding: '8px 20px',
            borderRadius: 8,
            border: 'none',
            fontSize: 13.5,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            background: tab === 'periodos' ? '#fff' : 'transparent',
            color: tab === 'periodos' ? 'var(--primary)' : 'var(--text-muted)',
            boxShadow: tab === 'periodos' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            Periodos académicos
          </span>
        </button>
        <button
          onClick={() => setTab('calendario')}
          style={{
            padding: '8px 20px',
            borderRadius: 8,
            border: 'none',
            fontSize: 13.5,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            background: tab === 'calendario' ? '#fff' : 'transparent',
            color: tab === 'calendario' ? 'var(--primary)' : 'var(--text-muted)',
            boxShadow: tab === 'calendario' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            Calendario académico
          </span>
        </button>
      </div>

      {tab === 'periodos' && (
        <>
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
              const eventCount = eventsByPeriod.get(p.id) ?? 0;
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
                      <button
                        className="btn btn-soft btn-sm"
                        onClick={() => { setSelectedPeriodId(p.id); setTab('calendario'); }}
                        style={{ display: 'flex', alignItems: 'center', gap: 5 }}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                        </svg>
                        {eventCount} evento{eventCount !== 1 ? 's' : ''}
                      </button>

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
        </>
      )}

      {tab === 'calendario' && (
        <>
          <div className="card" style={{ padding: '16px 20px', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Periodo:</span>
              <select
                className="select"
                style={{ width: 300 }}
                value={selectedPeriodId}
                onChange={(e) => setSelectedPeriodId(e.target.value)}
              >
                {periods.map((p) => (
                  <option key={p.id} value={p.id}>{p.periodName}</option>
                ))}
              </select>
              {selectedPeriod && <StatusBadge value={selectedPeriod.status} />}
              <span style={{ marginLeft: 'auto', fontSize: 12.5, color: 'var(--text-muted)' }}>
                {periodEvents.length} evento{periodEvents.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {periodEvents.length === 0 && (
            <div className="card" style={{ textAlign: 'center', padding: '60px 40px' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 16px' }}>
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <h3 style={{ marginBottom: 8, fontWeight: 700 }}>Sin eventos en este periodo</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>Agrega eventos al calendario académico.</p>
              {canCreateEvent && (
                <button className="btn btn-primary" onClick={openCreateEvent}>Agregar evento</button>
              )}
            </div>
          )}

          {CATEGORIES.map((cat) => {
            const items = periodEvents.filter((e) => e.category === cat.key);
            if (items.length === 0) return null;
            return (
              <div key={cat.key} style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <span style={{
                    padding: '4px 12px', borderRadius: 999,
                    background: cat.bg, color: cat.color,
                    fontSize: 12.5, fontWeight: 700,
                  }}>{cat.title}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{items.length}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {items.map((e) => (
                    <div key={e.id} className="card" style={{
                      padding: '14px 16px',
                      borderLeft: `3px solid ${cat.color}`,
                      opacity: e.status === 'CANCELLED' ? 0.55 : 1,
                      transition: 'box-shadow 0.15s ease',
                    }}
                      onMouseEnter={(ev) => { (ev.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-lg)'; }}
                      onMouseLeave={(ev) => { (ev.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow)'; }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: 160 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <h4 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>{e.title}</h4>
                            {e.status === 'CANCELLED' && (
                              <span style={{ padding: '1px 8px', borderRadius: 999, background: '#f1f5f9', color: 'var(--text-muted)', fontSize: 11, fontWeight: 700 }}>Cancelado</span>
                            )}
                          </div>
                          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12.5, color: 'var(--text-muted)' }}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                              </svg>
                              {fmtRange(e.startDate, e.endDate)}
                            </span>
                            {e.description && (
                              <span style={{ fontSize: 12.5, color: 'var(--text-muted)', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {e.description}
                              </span>
                            )}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                          {canUpdateEvent && (
                            <>
                              <button className="btn btn-soft btn-sm" onClick={() => openEditEvent(e)}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                                Editar
                              </button>
                              <button className="btn btn-outline btn-sm" onClick={() => toggleEventStatus(e)}>
                                {e.status === 'ACTIVE' ? 'Cancelar' : 'Reactivar'}
                              </button>
                            </>
                          )}
                          {canDeleteEvent && (
                            <button className="btn btn-outline btn-sm" onClick={() => deleteEvent(e)} style={{ color: 'var(--danger)' }}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </>
      )}

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

      <Modal
        open={eventModalOpen}
        title={editingEvent ? 'Editar evento' : 'Nuevo evento del calendario'}
        onClose={() => setEventModalOpen(false)}
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setEventModalOpen(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={submitEvent}>Guardar</button>
          </>
        }
      >
        <div className="form-grid">
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Nombre del evento</label>
            <input className="form-control" value={eventForm.title} maxLength={150} onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Categoría</label>
            <select className="select" value={eventForm.category} onChange={(e) => setEventForm({ ...eventForm, category: e.target.value as CalendarEventCategory })}>
              {CATEGORIES.map((c) => (
                <option key={c.key} value={c.key}>{c.title}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Periodo académico</label>
            <select className="select" value={eventForm.academicPeriodId} onChange={(e) => setEventForm({ ...eventForm, academicPeriodId: e.target.value })}>
              {periods.map((p) => (
                <option key={p.id} value={p.id}>{p.periodName}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Fecha de inicio</label>
            <input className="form-control" type="date" value={eventForm.startDate} onChange={(e) => setEventForm({ ...eventForm, startDate: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Fecha de fin (opcional)</label>
            <input className="form-control" type="date" value={eventForm.endDate} onChange={(e) => setEventForm({ ...eventForm, endDate: e.target.value })} />
          </div>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Descripción (opcional)</label>
            <textarea className="form-control" rows={2} value={eventForm.description} onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })} />
          </div>
        </div>
      </Modal>
    </div>
  );
}
