'use client';

import { ReactNode, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AppSidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';
import { getToken, getSessionUser } from '@/lib/session';
import { NAV_SECTIONS } from '@/lib/nav';
import { hasAnyPermission } from '@/lib/permissions';

const ROUTE_PERMISSIONS: Record<string, string[]> = {};
for (const section of NAV_SECTIONS) {
  for (const item of section.items) {
    if (item.permissions && item.permissions.length > 0) {
      ROUTE_PERMISSIONS[item.href] = item.permissions;
    }
  }
}

function routeDenied(pathname: string): boolean {
  const entry = Object.entries(ROUTE_PERMISSIONS).find(
    ([href]) => pathname === href || pathname.startsWith(`${href}/`),
  );
  if (!entry) return false;
  const user = getSessionUser();
  if (!user) return true;
  return !hasAnyPermission(user, entry[1]);
}

export default function ShellLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  // La sesión vive en localStorage: solo existe en el cliente. Hasta el
  // montaje se renderizan los hijos para que el HTML del servidor coincida
  // con el primer render del cliente (evita hydration mismatch).
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const token = getToken();
    if (!token || !getSessionUser()) {
      router.replace('/login');
    }
  }, [router, pathname]);

  const denied = mounted && routeDenied(pathname);

  return (
    <div className="app-shell">
      <AppSidebar />
      <div className="main-area">
        <Topbar />
        <main className="content-area">
          {denied ? (
            <div className="card">
              <div className="empty-state">
                <div className="empty-state-icon">🚫</div>
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>
                  Acceso denegado
                </div>
                <div>No tienes permisos para ver esta sección.</div>
              </div>
            </div>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}