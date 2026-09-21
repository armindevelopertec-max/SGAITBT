'use client';

import { useEffect, useRef, useState } from 'react';
import { apiGet, apiPatch, apiPost, apiUpload, extractError } from '@/lib/api';
import { Institution } from '@/lib/types';
import { PageHeader } from '@/components/ui/page-header';
import { Modal } from '@/components/ui/modal';
import { LoadingState, ErrorState } from '@/components/ui/state';

const EMPTY = {
  name: '',
  slug: '',
  code: '',
  description: '',
  address: '',
  phone: '',
  email: '',
  rectorName: '',
  rectorSignature: '',
};

export default function InstitutionPage() {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Institution | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoTargetId, setLogoTargetId] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  async function load() {
    setLoading(true);
    try {
      setInstitutions(await apiGet<Institution[]>('/institutions'));
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
    setForm(EMPTY);
    setModalOpen(true);
  }

  function openEdit(inst: Institution) {
    setEditing(inst);
    setForm({
      name: inst.name,
      slug: inst.slug,
      code: inst.code,
      description: inst.description ?? '',
      address: inst.address ?? '',
      phone: inst.phone ?? '',
      email: inst.email ?? '',
      rectorName: inst.rectorName ?? '',
      rectorSignature: inst.rectorSignature ?? '',
    });
    setModalOpen(true);
  }

  async function submit() {
    setSaving(true);
    try {
      if (editing) {
        await apiPatch(`/institutions/${editing.id}`, form);
      } else {
        await apiPost('/institutions', form);
      }
      setModalOpen(false);
      await load();
    } catch (err) {
      setError(extractError(err));
    } finally {
      setSaving(false);
    }
  }

  function pickLogo(institutionId: string) {
    setLogoTargetId(institutionId);
    logoInputRef.current?.click();
  }

  async function onLogoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !logoTargetId) return;
    setUploadingLogo(true);
    try {
      const { url } = await apiUpload<{ url: string }>('/uploads/logo', file);
      await apiPatch(`/institutions/${logoTargetId}/logo`, { logoUrl: url });
      await load();
    } catch (err) {
      setError(extractError(err));
    } finally {
      setUploadingLogo(false);
      setLogoTargetId(null);
    }
  }

  if (loading) return <LoadingState />;

  return (
    <div>
      <PageHeader
        title="Institución"
        subtitle="Información general del instituto"
        actions={
          <button className="btn btn-primary" onClick={openCreate}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            {institutions.length === 0 ? 'Registrar institución' : 'Nueva institución'}
          </button>
        }
      />

      {error && <ErrorState message={error} />}

      {institutions.length === 0 ? (
        <div className="card card-pad" style={{ textAlign: 'center', padding: '60px 40px' }}>
          <div style={{ marginBottom: 16 }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto' }}>
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <h3 style={{ marginBottom: 8, fontWeight: 700 }}>Sin institución registrada</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>Registra la información de tu instituto para comenzar.</p>
          <button className="btn btn-primary" onClick={openCreate}>
            Registrar institución
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {institutions.map((inst) => (
            <div key={inst.id} className="card" style={{ overflow: 'hidden' }}>
              <div style={{ display: 'flex', gap: 0, minHeight: 200 }}>
                {inst.logoUrl ? (
                  <div style={{
                    width: 240,
                    flexShrink: 0,
                    background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 24,
                  }}>
                    <img
                      src={inst.logoUrl}
                      alt={inst.name}
                      style={{ maxWidth: '100%', maxHeight: 160, objectFit: 'contain', borderRadius: 8 }}
                    />
                  </div>
                ) : (
                  <div style={{
                    width: 240,
                    flexShrink: 0,
                    background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 12,
                    color: 'rgba(255,255,255,0.4)',
                  }}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                    <span style={{ fontSize: 12 }}>Sin logo</span>
                  </div>
                )}

                <div style={{ flex: 1, padding: 28 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
                    <div>
                      <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4, color: 'var(--text)' }}>{inst.name}</h2>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                        {inst.slug && (
                          <span className="badge badge-neutral">{inst.slug}</span>
                        )}
                        {inst.code && (
                          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Código: {inst.code}</span>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => pickLogo(inst.id)}
                        disabled={uploadingLogo}
                      >
                        {uploadingLogo ? 'Subiendo…' : inst.logoUrl ? (
                          <>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                              <polyline points="17 8 12 3 7 8" />
                              <line x1="12" y1="3" x2="12" y2="15" />
                            </svg>
                            Cambiar logo
                          </>
                        ) : (
                          <>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                              <polyline points="17 8 12 3 7 8" />
                              <line x1="12" y1="3" x2="12" y2="15" />
                            </svg>
                            Subir logo
                          </>
                        )}
                      </button>
                      <button className="btn btn-soft btn-sm" onClick={() => openEdit(inst)}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                        Editar
                      </button>
                    </div>
                  </div>

                  {inst.description && (
                    <p style={{ color: 'var(--text-muted)', fontSize: 13.5, marginBottom: 20, lineHeight: 1.6 }}>
                      {inst.description}
                    </p>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
                    {inst.address && (
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: 8,
                          background: 'var(--primary-soft)', color: 'var(--primary)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                        }}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                            <circle cx="12" cy="10" r="3" />
                          </svg>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Dirección</div>
                          <div style={{ fontSize: 13.5, fontWeight: 500 }}>{inst.address}</div>
                        </div>
                      </div>
                    )}
                    {inst.phone && (
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: 8,
                          background: 'var(--success-soft)', color: 'var(--success)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                        }}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.5a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2.77h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 10.1a16 16 0 0 0 5.88 5.88l.93-.93a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 21.73 17z" />
                          </svg>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Teléfono</div>
                          <div style={{ fontSize: 13.5, fontWeight: 500 }}>{inst.phone}</div>
                        </div>
                      </div>
                    )}
                    {inst.email && (
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: 8,
                          background: 'var(--info-soft)', color: 'var(--info)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                        }}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                            <polyline points="22,6 12,13 2,6" />
                          </svg>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Correo</div>
                          <div style={{ fontSize: 13.5, fontWeight: 500 }}>{inst.email}</div>
                        </div>
                      </div>
                    )}
                    {inst.rectorName && (
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: 8,
                          background: 'var(--purple-soft)', color: 'var(--purple)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                        }}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                          </svg>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Rector</div>
                          <div style={{ fontSize: 13.5, fontWeight: 500 }}>{inst.rectorName}</div>
                        </div>
                      </div>
                    )}
                    {inst.rectorSignature && (
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: 8,
                          background: 'var(--purple-soft)', color: 'var(--purple)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                        }}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                          </svg>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Firma del Rector</div>
                          <img src={inst.rectorSignature} alt="Firma del rector" style={{ maxHeight: 40, maxWidth: 150, objectFit: 'contain' }} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <input
        ref={logoInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        style={{ display: 'none' }}
        onChange={onLogoFile}
      />

      <Modal
        open={modalOpen}
        title={editing ? 'Editar institución' : 'Nueva institución'}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </button>
            <button className="btn btn-primary" onClick={submit} disabled={saving}>
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
          </>
        }
      >
        <div className="form-grid">
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Nombre de la institución</label>
            <input className="form-control" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ej: Instituto Tecnológico Boliviana de Tecnología" />
          </div>
          <div className="form-group">
            <label className="form-label">Sigla</label>
            <input className="form-control" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="Ej: ITBT" />
          </div>
          <div className="form-group">
            <label className="form-label">Código</label>
            <input className="form-control" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="Ej: 0001" />
          </div>
          <div className="form-group">
            <label className="form-label">Teléfono</label>
            <input className="form-control" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Ej: +591 2 1234567" />
          </div>
          <div className="form-group">
            <label className="form-label">Correo institucional</label>
            <input className="form-control" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Ej: contacto@itbt.edu.bo" />
          </div>
          <div className="form-group">
            <label className="form-label">Nombre del rector</label>
            <input className="form-control" value={form.rectorName} onChange={(e) => setForm({ ...form, rectorName: e.target.value })} placeholder="Ej: MSc. Juan Pérez" />
          </div>
          <div className="form-group">
            <label className="form-label">Firma del rector (URL)</label>
            <input className="form-control" value={form.rectorSignature} onChange={(e) => setForm({ ...form, rectorSignature: e.target.value })} placeholder="https://example.com/firma.png" />
          </div>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Dirección</label>
            <input className="form-control" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Ej: Av. Busch #123, La Paz, Bolivia" />
          </div>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Descripción</label>
            <textarea className="textarea" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Breve descripción de la institución..." />
          </div>
        </div>
      </Modal>
    </div>
  );
}
