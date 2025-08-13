import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { getAuth, isTokenExpired } from '../utils/auth';

type AdminRouteProps = { children: ReactNode };

export default function AdminRoute({ children }: AdminRouteProps){
  const { token, user } = getAuth();
  if (!token || isTokenExpired(token) || user?.role !== 'Admin') return <Navigate to="/login" replace />;
  return children;
}
