'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { NAV_SECTIONS, MICROLEGEND } from '@/lib/nav';
import { Icon } from '@/components/ui/icons';

function SidebarLink({ href, label, icon }: { href: string; label: string; icon: string }) {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));
  return (
    <Link href={href} className={`sidebar-link ${isActive ? 'active' : ''}`}>
      <Icon name={icon} />
      <span>{label}</span>
    </Link>
  );
}

export function AppSidebar() {
  const { user } = useAuth();

  const sections = NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => !item.roles || !user || item.roles.includes(user.role)),
  })).filter((s) => s.items.length > 0);

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <img src="/logo.jpeg" alt="Logo ITBT" className="sidebar-logo-img" />
        <div>
          <h1>Instituto Tecnológico &quot;Boliviana de Tecnología&quot;</h1>
          <p>Sistema de Gestión Académica</p>
        </div>
      </div>

      <nav className="sidebar-nav">
        {sections.map((section) => (
          <div key={section.title}>
            <div className="sidebar-section">{section.title}</div>
            {section.items.map((item) => (
              <SidebarLink key={item.href} {...item} />
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        SGA ITBT · Gestión 2026
        <br />
        Pasantía · Armin Tec
      </div>
    </aside>
  );
}