import * as React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { useAuthStore } from '@/store/auth.store';

import UserManagementPage from '@/pages/Usermanagementpage';
import SuperAdminOrgsPage from './SuperAdminPage';

function RequireRole({
  allowed,
  children,
}: {
  allowed: string[];
  children: React.ReactNode;
}) {
  const user = useAuthStore((s) => s.user);
  const roleName = user?.role?.name ?? '';
  if (!allowed.includes(roleName)) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function DashboardHome() {
  const user = useAuthStore((s) => s.user);
  const roleName = user?.role?.name ?? 'MEMBER';

  const greeting: Record<string, { title: string; subtitle: string }> = {
    SUPER_ADMIN: {
      title: 'Super Admin Overview',
      subtitle: 'Manage all organizations and platform settings.',
    },
    ADMIN: {
      title: 'Organization Dashboard',
      subtitle: 'Manage your team, projects, and settings.',
    },
    MANAGER: {
      title: 'Project Dashboard',
      subtitle: 'Oversee your assigned projects and team.',
    },
    LEAD: {
      title: 'Team Dashboard',
      subtitle: 'Manage tasks and your team members.',
    },
    REVISER: {
      title: 'Review Dashboard',
      subtitle: 'Review and approve assets in your queue.',
    },
    MEMBER: {
      title: 'My Dashboard',
      subtitle: 'Track your tasks and project progress.',
    },
  };

  const { subtitle } = greeting[roleName] ?? greeting.MEMBER;

  return (
    <div className="flex flex-col gap-6 px-4 py-6 lg:px-96">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome back, {user?.username} 👋
        </h1>
        <p className="text-muted-foreground text-sm mt-1">{subtitle}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {roleName === 'SUPER_ADMIN' && (
          <>
            <QuickLink
              title="Organizations"
              description="Create and manage all organizations"
              href="/dashboard/orgs"
            />
            <QuickLink
              title="All Users"
              description="View users across the platform"
              href="/dashboard/users"
            />
          </>
        )}
        {roleName === 'ADMIN' && (
          <>
            <QuickLink
              title="User Management"
              description="Add or manage org members"
              href="/dashboard/users"
            />
            <QuickLink
              title="Projects"
              description="Create and manage projects"
              href="/dashboard/projects"
            />
          </>
        )}
        {roleName === 'MANAGER' && (
          <>
            <QuickLink
              title="My Projects"
              description="View your assigned projects"
              href="/dashboard/projects"
            />
            <QuickLink
              title="Tasks"
              description="Manage project tasks"
              href="/dashboard/tasks"
            />
            <QuickLink
              title="Team"
              description="View your team members"
              href="/dashboard/team"
            />
          </>
        )}
        {(roleName === 'LEAD' ||
          roleName === 'MEMBER' ||
          roleName === 'REVISER') && (
          <>
            <QuickLink
              title="My Tasks"
              description="View your assigned tasks"
              href="/dashboard/tasks"
            />
            <QuickLink
              title="Projects"
              description="Browse your projects"
              href="/dashboard/projects"
            />
          </>
        )}
      </div>
    </div>
  );
}

function ComingSoon({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-2">
      <p className="text-lg font-semibold">{title}</p>
      <p className="text-muted-foreground text-sm">
        This section is coming soon.
      </p>
    </div>
  );
}

export default function Dashboard() {
  return (
    <SidebarProvider
      style={
        {
          '--sidebar-width': 'calc(var(--spacing) * 72)',
          '--header-height': 'calc(var(--spacing) * 12)',
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col min-h-0">
          <Routes>
            <Route index element={<DashboardHome />} />

            <Route path="orgs" element={<SuperAdminOrgsPage />} />

            <Route
              path="users"
              element={
                <RequireRole allowed={['ADMIN']}>
                  <UserManagementPage />
                </RequireRole>
              }
            />

            <Route path="projects" element={<ComingSoon title="Projects" />} />
            <Route path="tasks" element={<ComingSoon title="Tasks" />} />
            <Route path="team" element={<ComingSoon title="Team" />} />
            <Route
              path="review"
              element={<ComingSoon title="Review Queue" />}
            />
            <Route
              path="analytics"
              element={<ComingSoon title="Analytics" />}
            />
            <Route path="settings" element={<ComingSoon title="Settings" />} />
            <Route path="orgs" element={<ComingSoon title="Organizations" />} />

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

function QuickLink({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <a
      href={href}
      className="block rounded-lg border p-5 hover:bg-muted/50 transition-colors"
    >
      <p className="font-semibold text-sm">{title}</p>
      <p className="text-xs text-muted-foreground mt-1">{description}</p>
    </a>
  );
}
