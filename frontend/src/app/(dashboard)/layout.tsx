'use client';

import { ReactNode, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AppSidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';
import { getToken, getSessionUser } from '@/lib/session';

export default function ShellLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const token = getToken();
    if (!token || !getSessionUser()) {
      router.replace('/login');
    }
  }, [router, pathname]);

  return (
    <div className="app-shell">
      <AppSidebar />
      <div className="main-area">
        <Topbar />
        <main className="content-area">{children}</main>
      </div>
    </div>
  );
}