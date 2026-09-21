'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiDelete, apiGet, apiPatch, apiPost, extractError } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { AcademicPeriod, CalendarEvent, CalendarEventCategory } from '@/lib/types';
import { PageHeader } from '@/components/ui/page-header';
import { Modal } from '@/components/ui/modal';
import { StatusBadge } from '@/components/ui/badge';
import { LoadingState, ErrorState } from '@/components/ui/state';

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

function parseISODate(iso?: string | null): Date | null {
  if (!iso) return null;
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function fmtRange(start?: string | null, end?: string | null): string {
  const s = parseISODate(start);
  if (!s) return '—';
  const e = parseISODate(end);
  if (!e || end === start) return s.toLocaleDateString('es-BO', { day: 'numeric', month: 'short', year: 'numeric' });
  const sameMonth = s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear();
  if (sameMonth) {
    const monthYear = s.toLocaleDateString('es-BO', { month: 'long', year: 'numeric' });
    return `${s.getDate()} – ${e.getDate()} de ${monthYear}`;
  }
  return `${s.toLocaleDateString('es-BO', { day: 'numeric', month: 'short', year: 'numeric' })} – ${e.toLocaleDateString('es-BO', { day: 'numeric', month: 'short', year: 'numeric' })}`;
}

export default function CalendarPage() {
  const { user } = useAuth();
  const canCreateEvent = hasPermission(user, 'calendar.create');
  const canUpdateEvent = hasPermission(user, 'calendar.update');
  const canDeleteEvent = hasPermission(user, 'calendar.delete');

  const [periods, setPeriods] = useState<AcademicPeriod[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
  }, []);

  const periodEvents = useMemo(
    () =>
      events
        .filter((e) => !selectedPeriodId || e.academicPeriodId === selectedPeriodId)
        .sort((a, b) => (a.startDate < b.startDate ? -1 : a.startDate > b.startDate ? 1 : 0)),
    [events, selectedPeriodId],
  );

  const selectedPeriod = periods.find((p) => p.id === selectedPeriodId);

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

  if (loading) return <LoadingState />;

  return (
    <div>
      <PageHeader
        title="Calendario Institucional"
        subtitle="Eventos del calendario académico"
        actions={
          canCreateEvent && (
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
