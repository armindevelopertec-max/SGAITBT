'use client';

import { ReactNode } from 'react';

export function LoadingState({ label = 'Cargando…' }: { label?: string }) {
  return (
    <div className="empty-state">
      <span className="spinner" style={{ margin: '0 auto 12px' }} />
      <div>{label}</div>
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return <div className="alert-error">{message}</div>;
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <div className="empty-state">{children}</div>;
}