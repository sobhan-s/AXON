import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';

export function ProtectedRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}

export function PublicRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Outlet />;
}

export function RoleRoute({ allowed }: { allowed: string[] }) {
  const user     = useAuthStore((s) => s.user);
  const roleName = user?.role?.name ?? '';
  return allowed.includes(roleName) ? <Outlet /> : <Navigate to="/dashboard" replace />;
}