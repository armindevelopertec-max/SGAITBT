'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiGet, apiPatch, apiPost, extractError } from '@/lib/api';
import { Student, Career } from '@/lib/types';
import { PageHeader } from '@/components/ui/page-header';
import { Modal } from '@/components/ui/modal';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/badge';
import { LoadingState, ErrorState } from '@/components/ui/state';

const EMPTY = {
  firstName: '',
  paternalSurname: '',
  maternalSurname: '',
  lastName: '',
  diplomaNumber: '',
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

function fullName(s: Student): string {
  return `${s.person?.firstName || ''} ${s.person?.lastName || ''}`.trim();
}

function initialsOf(s: Student): string {
  return fullName(s)
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

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
  const [careerFilter, setCareerFilter] = useState('');
  const [studentTypeFilter, setStudentTypeFilter] = useState('');

  async function load() {
    setLoading(true);
    try {
      const [s, c] = await Promise.all([
        apiGet<Student[]>('/students'),
        apiGet<Career[]>('/careers'),
      ]);
      setStudents(s);
      setCareers(c);
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

  function openCreate() {
    setEditing(null);
    setForm({ ...EMPTY, careerId: careerFilter || careers[0]?.id || '' });
    setModalOpen(true);
  }

  function openEdit(s: Student) {
    setEditing(s);
    setForm({
      firstName: s.person?.firstName || '',
      paternalSurname: s.person?.paternalSurname ?? '',
      maternalSurname: s.person?.maternalSurname ?? '',
      lastName: s.person?.lastName ?? '',
      diplomaNumber: s.diplomaNumber ?? '',
      ci: s.person?.ci ?? '',
      ciExtension: s.person?.ciExtension ?? '',
      birthDate: s.person?.birthDate ?? '',
      sex: s.person?.sex ?? '',
      phone: s.person?.phone ?? '',
      address: s.person?.address ?? '',
      email: s.person?.email ?? '',
      careerId: s.careerId ?? '',
      currentLevel: s.currentLevel,
    });
    setModalOpen(true);
  }

  async function submit() {
    try {
      if (editing) {
        await apiPatch(`/students/${editing.id}`, {
          diplomaNumber: form.diplomaNumber,
          currentLevel: form.currentLevel,
          careerId: form.careerId || undefined,
        });
      } else {
        const lastName = [form.paternalSurname.trim(), form.maternalSurname.trim()].filter(Boolean).join(' ') || form.lastName.trim();
        const person = await apiPost<{ id: string }>('/persons', {
          ci: form.ci,
          ciExtension: form.ciExtension || undefined,
          firstName: form.firstName,
          paternalSurname: form.paternalSurname || undefined,
          maternalSurname: form.maternalSurname || undefined,
          lastName,
          birthDate: form.birthDate || undefined,
          sex: form.sex || undefined,
          phone: form.phone || undefined,
          email: form.email,
          address: form.address || undefined,
        });
        await apiPost('/students', {
          personId: person.id,
          diplomaNumber: form.diplomaNumber || undefined,
          currentLevel: form.currentLevel,
          careerId: form.careerId || undefined,
        });
      }
      setModalOpen(false);
      await load();
    } catch (err) {
      setError(extractError(err));
    }
  }

  async function resetPassword(s: Student) {
    if (!window.confirm(`¿Restablecer la contraseña de ${fullName(s)}?`)) return;
    try {
      const result = await apiPost<{ username: string; password: string }>(`/users/student/${s.id}/reset-password`);
      alert(`Contraseña restablecida para ${fullName(s)}\n\nUsuario: ${result.username}\nNueva contraseña: ${result.password}\n\nEntregue estas credenciales al estudiante.`);
      await load();
    } catch (err) {
      setError(extractError(err));
    }
  }

  const countsByCareer = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of students) {
      if (s.careerId) map.set(s.careerId, (map.get(s.careerId) ?? 0) + 1);
    }
    return map;
  }, [students]);

  const inCareer = useMemo(
    () => students.filter((s) => !careerFilter || s.careerId === careerFilter),
    [students, careerFilter],
  );

  const activeCount = useMemo(
    () => inCareer.filter((s) => s.status === 'ACTIVE').length,
    [inCareer],
  );

  const filtered = inCareer.filter((s) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      (s.person?.firstName?.toLowerCase().includes(q) ?? false) ||
      (s.person?.lastName?.toLowerCase().includes(q) ?? false) ||
      (s.person?.ci?.includes(search) ?? false) ||
      s.studentCode.toLowerCase().includes(q);
    const matchesStatus = !statusFilter || s.status === statusFilter;
    const matchesType =
      !studentTypeFilter ||
      (studentTypeFilter === 'NEW' && s.currentLevel === 1) ||
      (studentTypeFilter === 'OLD' && s.currentLevel > 1);
    return matchesSearch && matchesStatus && matchesType;
  });

  const activeCareer = careers.find((c) => c.id === careerFilter);

  if (loading) return <LoadingState />;

  return (
    <div>
      <PageHeader
        title="Estudiantes"
        subtitle={
          activeCareer
            ? `Registro de estudiantes · ${activeCareer.name}`
            : 'Registro de estudiantes del instituto'
        }
        actions={
          <button className="btn btn-primary" onClick={openCreate}>
            Nuevo estudiante
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
            Todos
          </button>
        </div>
      </div>

      <div
        className="mb-3"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}
      >
        <div className="stat-card">
          <div className="stat-value">{inCareer.length}</div>
          <div className="stat-label">Estudiantes</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{activeCount}</div>
          <div className="stat-label">Activos</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{filtered.length}</div>
          <div className="stat-label">En vista</div>
        </div>
      </div>

      <div className="flex gap-2 mb-3">
        <button
          className={`btn ${studentTypeFilter === '' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setStudentTypeFilter('')}
        >
          Todos
        </button>
        <button
          className={`btn ${studentTypeFilter === 'NEW' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setStudentTypeFilter('NEW')}
        >
          Estudiantes Nuevos
        </button>
        <button
          className={`btn ${studentTypeFilter === 'OLD' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setStudentTypeFilter('OLD')}
        >
          Estudiantes Antiguos
        </button>
      </div>

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

      {filtered.length === 0 && (
        <div className="card card-pad">
          <div className="empty-state">
            <div className="empty-state-icon">👤</div>
            No se encontraron estudiantes.
          </div>
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: 12,
        }}
      >
        {filtered.map((s) => (
          <div
            key={s.id}
            className="card-pad"
            style={{
              border: '1px solid var(--border)',
              borderRadius: 12,
              background: 'var(--bg-card)',
              display: 'flex',
              gap: 12,
            }}
          >
            {s.person?.photoUrl ? (
              <img
                src={s.person.photoUrl}
                alt={fullName(s)}
                style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
              />
            ) : (
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background: 'var(--primary-soft)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: 18,
                  flexShrink: 0,
                }}
              >
                {initialsOf(s)}
              </div>
            )}
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <strong style={{ fontSize: 14 }}>{fullName(s)}</strong>
                <StatusBadge value={s.status} />
              </div>
              <div style={{ marginTop: 4 }}>
                <Badge label={s.studentCode} color="info" />
              </div>
              <div className="text-muted text-sm" style={{ marginTop: 4 }}>
                CI {s.person?.ci}{s.person?.ciExtension ? ` (${s.person?.ciExtension})` : ''} · {s.currentLevel}º nivel
              </div>
              {!careerFilter && (
                <div className="text-muted text-sm">{s.career?.name ?? '—'}</div>
              )}
              <div className="flex gap-2" style={{ marginTop: 8 }}>
                <button className="btn btn-soft btn-sm" onClick={() => openEdit(s)}>Editar</button>
                <button className="btn btn-outline btn-sm" onClick={() => resetPassword(s)}>Restablecer contraseña</button>
              </div>
            </div>
          </div>
        ))}
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
            <label className="form-label">Apellido paterno</label>
            <input className="form-control" value={form.paternalSurname} onChange={(e) => setForm({ ...form, paternalSurname: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Apellido materno</label>
            <input className="form-control" value={form.maternalSurname} onChange={(e) => setForm({ ...form, maternalSurname: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Apellidos (automático)</label>
            <input className="form-control" readOnly
              value={[form.paternalSurname.trim(), form.maternalSurname.trim()].filter(Boolean).join(' ') || form.lastName}
            />
          </div>
          <div className="form-group">
            <label className="form-label">DIP. BACH.</label>
            <input className="form-control" value={form.diplomaNumber} onChange={(e) => setForm({ ...form, diplomaNumber: e.target.value })} />
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
