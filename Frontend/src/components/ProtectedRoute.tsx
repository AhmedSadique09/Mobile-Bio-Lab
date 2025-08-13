import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { getAuth, isTokenExpired } from '../utils/auth';

type ProtectedRouteProps = { children: ReactNode };

export default function ProtectedRoute({ children }: ProtectedRouteProps){
  const { token } = getAuth();
  if (!token || isTokenExpired(token)) return <Navigate to="/login" replace />;
  return children;
}
