import * as React from 'react';
import {
  LayoutDashboardIcon,
  UsersIcon,
  FolderIcon,
  BarChartIcon,
  SettingsIcon,
  BuildingIcon,
  CheckSquareIcon,
  ClipboardListIcon,
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
} from '@/components/ui/sidebar';
import { useAuthStore } from '@/store/auth.store';

const NAV_BY_ROLE: Record<string, { title: string; url: string; icon: any }[]> =
  {
    SUPER_ADMIN: [
      { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboardIcon },
      { title: 'Organizations', url: '/dashboard/orgs', icon: BuildingIcon },
      { title: 'All Projects', url: '/dashboard/projects', icon: FolderIcon },
      { title: 'All Users', url: '/dashboard/users', icon: UsersIcon },
      { title: 'Analytics', url: '/dashboard/analytics', icon: BarChartIcon },
    ],
    ADMIN: [
      { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboardIcon },
      { title: 'User Management', url: '/dashboard/users', icon: UsersIcon },
      { title: 'Projects', url: '/dashboard/projects', icon: FolderIcon },
      { title: 'Analytics', url: '/dashboard/analytics', icon: BarChartIcon },
      { title: 'Org Settings', url: '/dashboard/settings', icon: SettingsIcon },
    ],
    MANAGER: [
      { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboardIcon },
      { title: 'My Projects', url: '/dashboard/projects', icon: FolderIcon },
      { title: 'Tasks', url: '/dashboard/tasks', icon: CheckSquareIcon },
      { title: 'Team', url: '/dashboard/team', icon: UsersIcon },
      { title: 'Analytics', url: '/dashboard/analytics', icon: BarChartIcon },
    ],
    LEAD: [
      { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboardIcon },
      { title: 'My Projects', url: '/dashboard/projects', icon: FolderIcon },
      { title: 'Tasks', url: '/dashboard/tasks', icon: CheckSquareIcon },
      { title: 'My Team', url: '/dashboard/team', icon: UsersIcon },
    ],
    REVISER: [
      { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboardIcon },
      {
        title: 'Review Queue',
        url: '/dashboard/review',
        icon: ClipboardListIcon,
      },
      { title: 'Projects', url: '/dashboard/projects', icon: FolderIcon },
    ],
    MEMBER: [
      { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboardIcon },
      { title: 'My Tasks', url: '/dashboard/tasks', icon: CheckSquareIcon },
      { title: 'Projects', url: '/dashboard/projects', icon: FolderIcon },
    ],
  };

// const NAV_SECONDARY = [
//   { title: 'Settings', url: '/dashboard/settings', icon: SettingsIcon },
//   { title: 'Get Help', url: '#', icon: HelpCircleIcon },
//   { title: 'Search', url: '#', icon: SearchIcon },
// ];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const user = useAuthStore((s) => s.user);
  const role = user?.role?.name ?? 'MEMBER';
  console.log("===========",role)
  const navItems = NAV_BY_ROLE[role] ?? NAV_BY_ROLE.MEMBER;

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <div className="w-[170px] h-[70px]">
                <img src="/axon_logo.png" alt="logo" />
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
