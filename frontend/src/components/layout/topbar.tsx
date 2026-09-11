'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { MICROLEGEND } from '@/lib/nav';

export function Topbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const current =
    pathname === '/login' ? 'Iniciar sesión' : 'Panel de control';

  const initials = user?.fullName
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="topbar">
      <div className="topbar-title">{current}</div>

      <div className="topbar-right">
        {user && (
          <div className="user-menu">
            <div className="user-avatar">
              {user.photoUrl ? (
                <img
                  src={user.photoUrl}
                  alt={user.fullName}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                initials
              )}
            </div>
            <div>
              <div className="user-info-name">{user.fullName}</div>
              <div className="user-info-role">
                {MICROLEGEND[user.role] ?? user.role}
              </div>
            </div>
            <button className="btn btn-outline btn-sm" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? 'Cerrar' : 'Salir'}
            </button>
          </div>
        )}
      </div>

      {menuOpen && user && (
        <div
          style={{
            position: 'absolute',
            top: 56,
            right: 24,
            background: '#fff',
            border: '1px solid var(--border)',
            borderRadius: 10,
            boxShadow: 'var(--shadow-lg)',
            padding: 12,
            zIndex: 50,
            minWidth: 160,
          }}
        >
          <div className="text-muted text-sm mb-2">{user.email}</div>
          <button
            className="btn btn-danger-solid btn-sm w-full"
            onClick={() => {
              setMenuOpen(false);
              logout();
            }}
          >
            Cerrar sesión
          </button>
        </div>
      )}
    </header>
  );
}