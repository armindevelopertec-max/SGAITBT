import type { Metadata } from 'next';
import { AuthProvider } from '@/lib/auth';
import Fonts from './fonts';
import './globals.css';

export const metadata: Metadata = {
  title: 'SGA ITBT | Sistema de Gestión Académica',
  description:
    'Sistema de Gestión Académica del Instituto Tecnológico Boliviana de Tecnología',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <Fonts />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}