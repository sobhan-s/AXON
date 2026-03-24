import { Suspense } from 'react'; // Import Suspense
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';

 const GuardLoader = () => (
  <div className="p-4 text-xs animate-pulse">Loading route...</div>
);

export function ProtectedRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? (
    <Suspense fallback={<GuardLoader />}>
      <Outlet />
    </Suspense>
  ) : (
    <Navigate to="/login" replace />
  );
}

export function PublicRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? (
    <Navigate to="/dashboard" replace />
  ) : (
    <Suspense fallback={<GuardLoader />}>
      <Outlet />
    </Suspense>
  );
}

export function RoleRoute({ allowed }: { allowed: string[] }) {
  const user = useAuthStore((s) => s.user);
  const roleName = user?.role?.name ?? '';
  return allowed.includes(roleName) ? (
    <Suspense fallback={<GuardLoader />}>
      <Outlet />
    </Suspense>
  ) : (
    <Navigate to="/dashboard" replace />
  );
}