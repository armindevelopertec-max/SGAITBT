export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem('sga_token');
}

export function setToken(token: string): void {
  window.localStorage.setItem('sga_token', token);
}

export function setSessionUser(user: AuthUser): void {
  window.localStorage.setItem('sga_user', JSON.stringify(user));
}

export function getSessionUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem('sga_user');
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function clearAuth(): void {
  window.localStorage.removeItem('sga_token');
  window.localStorage.removeItem('sga_user');
}

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: string;
  studentId?: string;
}