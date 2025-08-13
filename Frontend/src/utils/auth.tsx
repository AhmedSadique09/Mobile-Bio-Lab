import { jwtDecode } from 'jwt-decode';

type StoredUser = {
  role?: string;
  [key: string]: unknown;
};

export const saveAuth = (token: string, user: StoredUser): void => {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
};

export const clearAuth = (): void => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

export const getAuth = (): { token: string | null; user: StoredUser | null } => {
  const token: string | null = localStorage.getItem('token');
  const user: StoredUser | null = JSON.parse(localStorage.getItem('user') || 'null');
  return { token, user };
};

export const isTokenExpired = (token: string | null | undefined): boolean => {
  if (!token) return true;
  try {
    const { exp } = jwtDecode<{ exp?: number }>(token);
    if (!exp) return true;
    return Date.now() >= exp * 1000;
  } catch {
    return true;
  }
};
