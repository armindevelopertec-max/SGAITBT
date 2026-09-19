'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { NAV_SECTIONS } from '@/lib/nav';
import { hasAnyPermission } from '@/lib/permissions';
import { Icon } from '@/components/ui/icons';

function SidebarLink({ href, label, icon }: { href: string; label: string; icon: string }) {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));
  return (
    <Link href={href} className={`sidebar-link ${isActive ? 'active' : ''}`}>
      <div className="sidebar-link-inner">
        <span className="sidebar-link-icon">
          <Icon name={icon} />
        </span>
        <span className="sidebar-link-label">{label}</span>
        {isActive && <span className="sidebar-active-dot" />}
      </div>
    </Link>
  );
}

export function AppSidebar() {
  const { user } = useAuth();

  const sections = NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter(
      (item) => !item.permissions || hasAnyPermission(user, item.permissions),
    ),
  })).filter((s) => s.items.length > 0);

  const roleLabel = user?.role
    ? ({ ADMIN: 'Administrador', SECRETARY: 'Secretaría', TEACHER: 'Docente', STUDENT: 'Estudiante' }[user.role] ?? user.role)
    : '';

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-logo-wrap">
          <img src="/logo.png" alt="Logo ITBT" className="sidebar-logo-img" />
        </div>
        <div className="sidebar-brand-text">
          <h1>Instituto Tecnológico</h1>
          <p>&quot;Boliviana de Tecnología&quot;</p>
        </div>
      </div>

      <div className="sidebar-subtitle">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        Sistema de Gestión Académica
      </div>

      <nav className="sidebar-nav">
        {sections.map((section) => (
          <div key={section.title} className="sidebar-section-group">
            <div className="sidebar-section-title">{section.title}</div>
            {section.items.map((item) => (
              <SidebarLink key={item.href} {...item} />
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        {user && (
          <div className="sidebar-footer-user">
            <div className="sidebar-footer-avatar">
              {user.username?.slice(0, 2).toUpperCase() ?? '??'}
            </div>
            <div className="sidebar-footer-info">
              <span className="sidebar-footer-username">{user.username}</span>
              <span className="sidebar-footer-role">{roleLabel}</span>
            </div>
          </div>
        )}
        <div className="sidebar-footer-meta">
          <span>SGA ITBT · Gestión 2026</span>
          <span className="sidebar-footer-dot">·</span>
          <span>Versión 1.0</span>
        </div>
      </div>
    </aside>
  );
}
