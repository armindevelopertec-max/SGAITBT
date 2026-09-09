'use client';

import { useEffect, useState } from 'react';
import { apiGet, apiPatch, apiPost, extractError } from '@/lib/api';
import { Subject, Career } from '@/lib/types';
import { PageHeader } from '@/components/ui/page-header';
import { Modal } from '@/components/ui/modal';
import { LoadingState, ErrorState } from '@/components/ui/state';

const EMPTY = {
  code: '',
  name: '',
  semester: 1,
  weeklyHours: 4,
  totalHours: 68,
  careerId: '',
};

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
    setForm({ ...EMPTY, careerId: careers[0]?.id ?? '' });
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
    });
    setModalOpen(true);
  }

  const filtered = subjects.filter(
    (s) =>
      (!careerFilter || s.careerId === careerFilter) &&
      (!semesterFilter || String(s.semester) === semesterFilter),
  );

  if (loading) return <LoadingState />;

  return (
    <div>
      <PageHeader
        title="Materias"
        subtitle="Materias del plan de estudios por carrera"
        actions={
          <button className="btn btn-primary" onClick={openCreate}>
            Nueva materia
          </button>
        }
      />

      {error && <ErrorState message={error} />}

      <div className="card card-pad mb-3">
        <div className="flex gap-3 items-center" style={{ flexWrap: 'wrap' }}>
          <label className="form-label" style={{ margin: 0 }}>Carrera:</label>
          <select className="select" style={{ width: 220 }} value={careerFilter} onChange={(e) => setCareerFilter(e.target.value)}>
            <option value="">Todas</option>
            {careers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <label className="form-label" style={{ margin: 0 }}>Semestre:</label>
          <select className="select" style={{ width: 140 }} value={semesterFilter} onChange={(e) => setSemesterFilter(e.target.value)}>
            <option value="">Todos</option>
            {[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n}º</option>)}
          </select>
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Materia</th>
                <th>Carrera</th>
                <th>Semestre</th>
                <th>Horas sem.</th>
                <th>Horas totales</th>
                <th>Prerrequisitos</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8}>
                    <div className="empty-state">
                      <div className="empty-state-icon">📘</div>
                      No hay materias registradas.
                    </div>
                  </td>
                </tr>
              )}
              {filtered.map((s) => (
                <tr key={s.id}>
                  <td>{s.code}</td>
                  <td><strong>{s.name}</strong></td>
                  <td>{s.career?.name ?? '—'}</td>
                  <td>{s.semester}º</td>
                  <td>{s.weeklyHours}</td>
                  <td>{s.totalHours}</td>
                  <td>{s.prerequisites?.length ? s.prerequisites.join(', ') : '—'}</td>
                  <td>
                    <button className="btn btn-soft btn-sm" onClick={() => openEdit(s)}>Editar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

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
        </div>
      </Modal>
    </div>
  );
}