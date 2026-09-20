'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiGet, apiPatch, apiPost, extractError } from '@/lib/api';
import { Subject, Career } from '@/lib/types';
import { PageHeader } from '@/components/ui/page-header';
import { Modal } from '@/components/ui/modal';
import { Badge } from '@/components/ui/badge';
import { LoadingState, ErrorState } from '@/components/ui/state';

const EMPTY = {
  code: '',
  name: '',
  semester: 1,
  weeklyHours: 4,
  totalHours: 68,
  careerId: '',
  prerequisites: [] as string[],
  isElective: false,
};

const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI'];

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [careers, setCareers] = useState<Career[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Subject | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [careerFilter, setCareerFilter] = useState('');
  const [semesterFilter, setSemesterFilter] = useState('');

  async function load() {
    setLoading(true);
    try {
      const [s, c] = await Promise.all([
        apiGet<Subject[]>('/subjects'),
        apiGet<Career[]>('/careers'),
      ]);
      setSubjects(s);
      setCareers(c);
      // Por defecto se muestra una carrera (la primera), no todas de golpe.
      setCareerFilter((prev) => prev || c[0]?.id || '');
    } catch (err) {
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function submit() {
    setSaving(true);
    (editing
      ? apiPatch(`/subjects/${editing.id}`, form)
      : apiPost('/subjects', form)
    )
      .then(() => {
        setModalOpen(false);
        return load();
      })
      .catch((err) => setError(extractError(err)))
      .finally(() => setSaving(false));
  }

  function openCreate() {
    setEditing(null);
    setForm({ ...EMPTY, careerId: careerFilter || careers[0]?.id || '' });
    setModalOpen(true);
  }

  function openEdit(s: Subject) {
    setEditing(s);
    setForm({
      code: s.code,
      name: s.name,
      semester: s.semester,
      weeklyHours: s.weeklyHours,
      totalHours: s.totalHours,
      careerId: s.careerId,
      prerequisites: s.prerequisites ?? [],
      isElective: s.isElective ?? false,
    });
    setModalOpen(true);
  }

  const countsByCareer = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of subjects) map.set(s.careerId, (map.get(s.careerId) ?? 0) + 1);
    return map;
  }, [subjects]);

  const inCareer = useMemo(
    () => subjects.filter((s) => !careerFilter || s.careerId === careerFilter),
    [subjects, careerFilter],
  );

  const semesters = useMemo(() => {
    const set = new Set(inCareer.map((s) => s.semester));
    return Array.from(set).sort((a, b) => a - b);
  }, [inCareer]);

  const visibleSemesters = useMemo(
    () => (semesterFilter ? semesters.filter((n) => String(n) === semesterFilter) : semesters),
    [semesters, semesterFilter],
  );

  const bySemester = useMemo(() => {
    const map = new Map<number, Subject[]>();
    for (const s of inCareer) {
      if (!map.has(s.semester)) map.set(s.semester, []);
      map.get(s.semester)!.push(s);
    }
    for (const list of map.values()) list.sort((a, b) => a.code.localeCompare(b.code));
    return map;
  }, [inCareer]);

  const totalHours = useMemo(
    () => inCareer.reduce((acc, s) => acc + (s.totalHours ?? 0), 0),
    [inCareer],
  );

  const activeCareer = careers.find((c) => c.id === careerFilter);

  if (loading) return <LoadingState />;

  return (
    <div>
      <PageHeader
        title="Materias"
        subtitle={
          activeCareer
            ? `Plan de estudios · ${activeCareer.name}`
            : 'Plan de estudios de todas las carreras'
        }
        actions={
          <button className="btn btn-primary" onClick={openCreate}>
            Nueva materia
          </button>
        }
      />

      {error && <ErrorState message={error} />}

      <div className="card card-pad mb-3">
        <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
          {careers.map((c) => (
            <button
              key={c.id}
              className={`btn btn-sm ${careerFilter === c.id ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setCareerFilter(c.id)}
            >
              {c.name}
              <span
                style={{
                  marginLeft: 8,
                  fontSize: 11,
                  fontWeight: 700,
                  background: careerFilter === c.id ? 'rgba(255,255,255,.25)' : 'var(--primary-soft)',
                  color: careerFilter === c.id ? '#fff' : 'var(--primary)',
                  borderRadius: 999,
                  padding: '1px 8px',
                }}
              >
                {countsByCareer.get(c.id) ?? 0}
              </span>
            </button>
          ))}
          <button
            className={`btn btn-sm ${!careerFilter ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setCareerFilter('')}
          >
            Todas
          </button>
        </div>
      </div>

      <div
        className="mb-3"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}
      >
        <div className="stat-card">
          <div className="stat-value">{inCareer.length}</div>
          <div className="stat-label">Materias</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{semesters.length}</div>
          <div className="stat-label">Semestres</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{totalHours.toLocaleString('es-BO')}</div>
          <div className="stat-label">Horas totales</div>
        </div>
      </div>

      <div className="card card-pad mb-3">
        <div className="flex gap-2 items-center" style={{ flexWrap: 'wrap' }}>
          <span className="form-label" style={{ margin: 0 }}>Semestre:</span>
          <button
            className={`btn btn-sm ${!semesterFilter ? 'btn-soft' : 'btn-outline'}`}
            onClick={() => setSemesterFilter('')}
          >
            Todos
          </button>
          {semesters.map((n) => (
            <button
              key={n}
              className={`btn btn-sm ${semesterFilter === String(n) ? 'btn-soft' : 'btn-outline'}`}
              onClick={() => setSemesterFilter(semesterFilter === String(n) ? '' : String(n))}
            >
              {ROMAN[n] ?? n}º
            </button>
          ))}
        </div>
      </div>

      {visibleSemesters.length === 0 && (
        <div className="card card-pad">
          <div className="empty-state">
            <div className="empty-state-icon">📘</div>
            No hay materias registradas.
          </div>
        </div>
      )}

      {visibleSemesters.map((sem) => {
        const list = bySemester.get(sem) ?? [];
        const semHours = list.reduce((acc, s) => acc + (s.totalHours ?? 0), 0);
        return (
          <div key={sem} className="card mb-3">
            <div
              className="card-header"
              style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}
            >
              <span
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  background: 'var(--primary)',
                  color: '#fff',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: 14,
                }}
              >
                {ROMAN[sem] ?? sem}
              </span>
              <strong style={{ fontSize: 15 }}>Semestre {sem}º</strong>
              <Badge label={`${list.length} materias`} color="info" />
              <span className="text-muted text-sm">{semHours.toLocaleString('es-BO')} h totales</span>
            </div>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: 110 }}>Código</th>
                    <th>Materia</th>
                    {!careerFilter && <th>Carrera</th>}
                    <th style={{ width: 100 }}>Horas sem.</th>
                    <th style={{ width: 110 }}>Horas tot.</th>
                    <th>Prerrequisitos</th>
                    <th style={{ width: 90 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((s) => (
                    <tr key={s.id}>
                      <td>
                        <Badge label={s.code} color="neutral" />
                      </td>
                      <td>
                        <strong>{s.name}</strong>
                        {s.isElective && (
                          <span className="text-muted text-sm"> · Electiva</span>
                        )}
                      </td>
                      {!careerFilter && <td>{s.career?.name ?? '—'}</td>}
                      <td>{s.weeklyHours}</td>
                      <td>{s.totalHours}</td>
                      <td className="text-muted text-sm">
                        {s.prerequisites?.length ? s.prerequisites.join(', ') : '—'}
                      </td>
                      <td>
                        <button className="btn btn-soft btn-sm" onClick={() => openEdit(s)}>
                          Editar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      <Modal open={modalOpen} title={editing ? 'Editar materia' : 'Nueva materia'} onClose={() => setModalOpen(false)}
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setModalOpen(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={submit} disabled={saving}>Guardar</button>
          </>
        }
      >
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Carrera</label>
            <select className="select" value={form.careerId} onChange={(e) => setForm({ ...form, careerId: e.target.value })} disabled={!!editing}>
              {careers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Código</label>
            <input className="form-control" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
          </div>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Nombre</label>
            <input className="form-control" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Semestre</label>
            <input className="form-control" type="number" min={1} value={form.semester} onChange={(e) => setForm({ ...form, semester: Number(e.target.value) })} />
          </div>
          <div className="form-group">
            <label className="form-label">Carga horaria semanal</label>
            <input className="form-control" type="number" min={0} value={form.weeklyHours} onChange={(e) => setForm({ ...form, weeklyHours: Number(e.target.value) })} />
          </div>
          <div className="form-group">
            <label className="form-label">Carga horaria total</label>
            <input className="form-control" type="number" min={0} value={form.totalHours} onChange={(e) => setForm({ ...form, totalHours: Number(e.target.value) })} />
          </div>
          <div className="form-group">
            <label className="form-label">Prerrequisitos</label>
            <input
              className="form-control"
              value={(form.prerequisites ?? []).join(', ')}
              onChange={(e) => setForm({ ...form, prerequisites: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
              placeholder="Ej: MAT-101, MAT-102"
            />
            <span className="text-muted text-sm">Códigos separados por coma</span>
          </div>
          <div className="form-group">
            <label className="form-label">¿Es electiva?</label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
              <input
                type="checkbox"
                checked={form.isElective}
                onChange={(e) => setForm({ ...form, isElective: e.target.checked })}
              />
              Materia electiva
            </label>
          </div>
        </div>
      </Modal>
    </div>
  );
}
