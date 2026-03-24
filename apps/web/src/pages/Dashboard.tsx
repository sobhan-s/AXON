import { useAuthStore } from '@/store/auth.store';
import { SuperAdminDashboard } from './dashboard/SuperadminDashboard';
import { AdminDashboard } from './dashboard/AdminDashboard';

export default function DashboardHome() {
  const user = useAuthStore((s) => s.user);
  const roleName = user?.role?.name ?? 'MEMBER';

  if (roleName === 'SUPER_ADMIN') return <SuperAdminDashboard />;
  if (roleName === 'ADMIN') return <AdminDashboard />;

  return (
    <div className="flex h-full min-h-[60vh] items-center justify-center">
      <div className="text-center space-y-1">
        <p className="text-sm text-muted-foreground">
          Welcome back,{' '}
          <span className="font-medium text-foreground">{user?.username}</span>
        </p>
        <p className="text-xs text-muted-foreground">
          {roleName === 'MANAGER' || roleName === 'LEAD'
            ? 'Select a project from the sidebar to view analytics.'
            : 'Analytics is not available for your role.'}
        </p>
      </div>
    </div>
  );
}
