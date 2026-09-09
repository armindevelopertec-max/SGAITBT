'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { extractError } from '@/lib/api';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
    } catch (err) {
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-left">
        <div className="brand">
          <div className="sidebar-logo">SGA</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>SGA ITBT</div>
            <div style={{ fontSize: 12, color: '#a5b4fc' }}>
              Sistema de Gestión Académica
            </div>
          </div>
        </div>

        <div>
          <h2>
            Gestión académica integral para el Instituto Tecnológico Boliviana de Tecnología
          </h2>
          <p>
            Administra estudiantes, matrículas, calificaciones, asistencia, reportes y
            certificados en un solo lugar.
          </p>

          <div className="login-features">
            <div className="login-feature">✓ Gestión de estudiantes y matrículas</div>
            <div className="login-feature">✓ Depósitos y verificación de pagos</div>
            <div className="login-feature">✓ Calificaciones e historial académico</div>
            <div className="login-feature">✓ Reportes, certificados y centralizadores</div>
          </div>
        </div>

        <div style={{ fontSize: 12, color: '#a5b4fc' }}>
          Instituto Tecnológico &quot;Boliviana de Tecnología&quot; · Pasantía 2026
        </div>
      </div>

      <div className="login-right">
        <form className="login-card" onSubmit={handleSubmit}>
          <h1>Iniciar sesión</h1>
          <p className="sub">Ingresa tus credenciales para acceder al sistema</p>

          {error && <div className="alert-error">{error}</div>}

          <div className="form-group mb-3">
            <label className="form-label">Usuario</label>
            <input
              className="form-control"
              placeholder="admin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
            />
          </div>

          <div className="form-group mb-3">
            <label className="form-label">Contraseña</label>
            <input
              className="form-control"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full"
            style={{ marginTop: 8 }}
            disabled={loading || !username || !password}
          >
            {loading ? 'Ingresando…' : 'Ingresar'}
          </button>

          <p className="text-muted mt-4 text-sm" style={{ textAlign: 'center' }}>
            Usuario por defecto: <strong>admin</strong> / <strong>admin2026</strong>
          </p>
        </form>
      </div>
    </div>
  );
}