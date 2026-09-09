'use client';

import { useEffect, useState } from 'react';
import { apiGet, apiPatch, apiPost, extractError } from '@/lib/api';
import { Student, Career } from '@/lib/types';
import { PageHeader } from '@/components/ui/page-header';
import { Modal } from '@/components/ui/modal';
import { StatusBadge } from '@/components/ui/badge';
import { LoadingState, ErrorState } from '@/components/ui/state';

const EMPTY = {
  firstName: '',
  lastName: '',
  ci: '',
  ciExtension: '',
  birthDate: '',
  sex: '',
  phone: '',
  address: '',
  email: '',
  careerId: '',
  currentLevel: 1,
};

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [careers, setCareers] = useState<Career[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  async function load() {
    setLoading(true);
    try {
      const [s, c] = await Promise.all([
        apiGet<Student[]>('/students'),
        apiGet<Career[]>('/careers'),
      ]);
      setStudents(s);
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

  function openCreate() {
    setEditing(null);
    setForm({ ...EMPTY, careerId: careers[0]?.id ?? '' });
    setModalOpen(true);
  }

  function openEdit(s: Student) {
    setEditing(s);
    setForm({
      firstName: s.firstName,
      lastName: s.lastName,
      ci: s.ci,
      ciExtension: s.ciExtension ?? '',
      birthDate: s.birthDate,
      sex: s.sex ?? '',
      phone: s.phone ?? '',
      address: s.address ?? '',
      email: s.email,
      careerId: s.careerId ?? '',
      currentLevel: s.currentLevel,
    });
    setModalOpen(true);
  }

  async function submit() {
    try {
      if (editing) await apiPatch(`/students/${editing.id}`, form);
      else await apiPost('/students', form);
      setModalOpen(false);
      await load();
    } catch (err) {
      setError(extractError(err));
    }
  }

  async function createUser(s: Student) {
    try {
      await apiPost(`/users/student/${s.id}`);
      await load();
    } catch (err) {
      setError(extractError(err));
    }
  }

  const filtered = students.filter((s) => {
    const matchesSearch =
      !search ||
      s.firstName.toLowerCase().includes(search.toLowerCase()) ||
      s.lastName.toLowerCase().includes(search.toLowerCase()) ||
      s.ci.includes(search) ||
      s.studentCode.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) return <LoadingState />;

  return (
    <div>
      <PageHeader
        title="Estudiantes"
        subtitle="Registro de estudiantes del instituto"
        actions={
          <button className="btn btn-primary" onClick={openCreate}>
            Nuevo estudiante
          </button>
        }
      />

      {error && <ErrorState message={error} />}

      <div className="card card-pad mb-3">
        <div className="flex gap-3 items-center" style={{ flexWrap: 'wrap' }}>
          <input
            className="form-control"
            placeholder="Buscar por nombre, CI o código…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ minWidth: 260, flex: 1 }}
          />
          <select className="select" style={{ width: 200 }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">Todos los estados</option>
            <option value="PRE_ENROLLED">Preinscrito</option>
            <option value="ACTIVE">Activo</option>
            <option value="WITHDRAWN">Retirado</option>
            <option value="GRADUATE">Egresado</option>
            <option value="TITLED">Titulado</option>
            <option value="INACTIVE">Inactivo</option>
          </select>
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Estudiante</th>
                <th>CI</th>
                <th>Carrera</th>
                <th>Nivel</th>
                <th>Correo</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8}>
                    <div className="empty-state">
                      <div className="empty-state-icon">👤</div>
                      No se encontraron estudiantes.
                    </div>
                  </td>
                </tr>
              )}
              {filtered.map((s) => (
                <tr key={s.id}>
                  <td>{s.studentCode}</td>
                  <td>
                    <strong>{s.firstName} {s.lastName}</strong>
                  </td>
                  <td>{s.ci} {s.ciExtension ? `(${s.ciExtension})` : ''}</td>
                  <td>{s.career?.name ?? '—'}</td>
                  <td>{s.currentLevel}º</td>
                  <td>{s.email}</td>
                  <td><StatusBadge value={s.status} /></td>
                  <td>
                    <div className="flex gap-2">
                      <button className="btn btn-soft btn-sm" onClick={() => openEdit(s)}>Editar</button>
                      <button className="btn btn-outline btn-sm" onClick={() => createUser(s)} title="Crear cuenta de usuario">
                        Usuario
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={modalOpen}
        title={editing ? 'Editar estudiante' : 'Registrar estudiante'}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setModalOpen(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={submit}>Guardar</button>
          </>
        }
      >
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Nombres</label>
            <input className="form-control" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Apellidos</label>
            <input className="form-control" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">CI</label>
            <input className="form-control" value={form.ci} onChange={(e) => setForm({ ...form, ci: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Extensión</label>
            <input className="form-control" value={form.ciExtension} onChange={(e) => setForm({ ...form, ciExtension: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Fecha de nacimiento</label>
            <input className="form-control" type="date" value={form.birthDate} onChange={(e) => setForm({ ...form, birthDate: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Sexo</label>
            <select className="select" value={form.sex} onChange={(e) => setForm({ ...form, sex: e.target.value })}>
              <option value="">—</option>
              <option value="MALE">Masculino</option>
              <option value="FEMALE">Femenino</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Carrera</label>
            <select className="select" value={form.careerId} onChange={(e) => setForm({ ...form, careerId: e.target.value })}>
              <option value="">—</option>
              {careers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Nivel / Semestre</label>
            <input className="form-control" type="number" min={1} value={form.currentLevel} onChange={(e) => setForm({ ...form, currentLevel: Number(e.target.value) })} />
          </div>
          <div className="form-group">
            <label className="form-label">Teléfono</label>
            <input className="form-control" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Correo electrónico</label>
            <input className="form-control" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Dirección</label>
            <input className="form-control" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
        </div>
      </Modal>
    </div>
  );
}