import * as React from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboardIcon,
  UsersIcon,
  FolderIcon,
  SettingsIcon,
  BuildingIcon,
  CheckSquareIcon,
  ClipboardListIcon,
  UploadCloudIcon,
  BarChart2Icon,
  ChevronLeftIcon,
  UsersRoundIcon,
  GalleryThumbnailsIcon,
} from 'lucide-react';

import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { useAuthStore } from '@/store/auth.store';
import { projectService, type Project } from '@/services/Project.service';

const NAV_BY_ROLE: Record<string, { title: string; url: string; icon: any }[]> =
  {
    SUPER_ADMIN: [
      { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboardIcon },
      { title: 'Organizations', url: '/dashboard/orgs', icon: BuildingIcon },
      { title: 'All Users', url: '/dashboard/users', icon: UsersIcon },
    ],
    ADMIN: [
      { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboardIcon },
      { title: 'Projects', url: '/dashboard/projects', icon: FolderIcon },

      {
        title: 'User Management',
        url: '/dashboard/users',
        icon: UsersRoundIcon,
      },
      { title: 'Settings', url: '/dashboard/settings', icon: SettingsIcon },
    ],
    MANAGER: [
      { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboardIcon },
      { title: 'Projects', url: '/dashboard/projects', icon: FolderIcon },

      { title: 'Team', url: '/dashboard/team', icon: UsersIcon },
    ],
    LEAD: [
      { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboardIcon },
      { title: 'Projects', url: '/dashboard/projects', icon: FolderIcon },
    ],
    REVIEWER: [
      { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboardIcon },
      { title: 'Projects', url: '/dashboard/projects', icon: FolderIcon },
      {
        title: 'Review Queue',
        url: '/dashboard/review',
        icon: ClipboardListIcon,
      },
    ],
    MEMBER: [
      { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboardIcon },
      { title: 'Projects', url: '/dashboard/projects', icon: FolderIcon },
    ],
  };

function getProjectNav(projectId: string, role: string) {
  const base = `/projects/${projectId}`;

  const all = [
    { title: 'Board', url: `${base}/board`, icon: CheckSquareIcon },
    { title: 'Review Queue', url: `${base}/reviews`, icon: ClipboardListIcon },
    {
      title: 'Finalized',
      url: `${base}/finalized`,
      icon: GalleryThumbnailsIcon,
    },
    { title: 'My Tasks', url: `${base}/mytask`, icon: CheckSquareIcon },
  ];

  if (role !== 'REVIEWER') {
    all.splice(1, 0, {
      title: 'Upload',
      url: `${base}/upload`,
      icon: UploadCloudIcon,
    });
  }

  if (['LEAD', 'MANAGER', 'ADMIN'].includes(role)) {
    all.push({ title: 'Reports', url: `${base}/reports`, icon: BarChart2Icon });
  }

  if (['MANAGER', 'ADMIN'].includes(role)) {
    all.push({ title: 'Members', url: `${base}/members`, icon: UsersIcon });
  }

  return all;
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const user = useAuthStore((s) => s.user);
  const orgId = user?.organizationId as number;
  const role = user?.role?.name ?? 'MEMBER';
  const navigate = useNavigate();

  const { projectId } = useParams<{ projectId?: string }>();
  const location = useLocation();
  const inProject = !!projectId || location.pathname.startsWith('/projects/');

  const resolvedProjectId =
    projectId ?? location.pathname.match(/\/projects\/(\d+)/)?.[1];

  const [project, setProject] = React.useState<Project | null>(null);

  React.useEffect(() => {
    if (!resolvedProjectId) {
      setProject(null);
      return;
    }
    projectService
      .getById(orgId, Number(resolvedProjectId))
      .then(setProject)
      .catch(() => setProject(null));
  }, [resolvedProjectId]);

  if (inProject && resolvedProjectId) {
    const projectNav = getProjectNav(resolvedProjectId, role);

    return (
      <Sidebar collapsible="offcanvas" {...props} className="w-[250px]">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => navigate('/dashboard/projects')}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
              >
                <ChevronLeftIcon className="h-4 w-4 shrink-0" />
                <span className="text-xs font-medium">Back to Projects</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>

          <SidebarSeparator />

          {/* Project name */}
          <SidebarMenu>
            <SidebarMenuItem>
              <div className="px-2 py-1.5">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Project
                </p>
                <p className="text-sm font-semibold truncate mt-0.5">
                  {project?.name ?? '...'}
                </p>
              </div>
            </SidebarMenuItem>
          </SidebarMenu>

          <SidebarSeparator />
        </SidebarHeader>

        <SidebarContent>
          <NavMain items={projectNav} />
        </SidebarContent>

        <SidebarFooter>
          <NavUser />
        </SidebarFooter>
      </Sidebar>
    );
  }

  const navItems = NAV_BY_ROLE[role] ?? NAV_BY_ROLE.MEMBER;

  return (
    <Sidebar collapsible="offcanvas" {...props} className="w-[250px]">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <div className="max-w-[140px] h-[70px]">
                <img src="/axon_logo.png" alt="Axon" />
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={navItems} />
      </SidebarContent>

      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
