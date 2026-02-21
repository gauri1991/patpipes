'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Menu,
  X,
  BarChart3,
  FileText,
  Search,
  Shield,
  Users,
  Settings,
  User,
  LogOut,
  ChevronDown,
  Moon,
  Sun,
  Palette,
  FolderOpen,
  ChevronLeft,
  ChevronRight,
  Workflow,
  Scale,
  HelpCircle,
  SearchCheck,
  Tags
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAuth } from '@/domains/accounts/hooks/useAuth';
import { useUserPermissions } from '@/domains/accounts/hooks/useUserPermissions';
import { cn } from '@/lib/utils';
import { NotificationCenter } from '@/components/ui/NotificationCenter';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  description?: string;
  permission: string; // Required permission to show this item
}

const navigation: NavigationItem[] = [
  { 
    name: 'Dashboard', 
    href: '/dashboard', 
    icon: BarChart3,
    description: 'Overview and analytics',
    permission: 'sidebar_dashboard'
  },
  {
    name: 'Search Patents',
    href: '/dashboard/patent-search',
    icon: SearchCheck,
    description: 'Look up patent details by number',
    permission: 'sidebar_patent_search'
  },
  {
    name: 'Projects',
    href: '/dashboard/projects',
    icon: FolderOpen,
    description: 'Project management and tracking',
    permission: 'sidebar_projects'
  },
  { 
    name: 'Workflows', 
    href: '/dashboard/workflows', 
    icon: Workflow,
    description: 'Process automation and quality control',
    permission: 'sidebar_workflows'
  },
  { 
    name: 'Portfolio',
    href: '/dashboard/portfolio',
    icon: FileText,
    description: 'Portfolio management and analytics',
    permission: 'sidebar_patents'
  },
  { 
    name: 'Patent Prosecution', 
    href: '/dashboard/prosecution', 
    icon: Scale,
    description: 'Application drafting and prosecution',
    permission: 'sidebar_prosecution'
  },
  { 
    name: 'Prior Art', 
    href: '/dashboard/prior-art', 
    icon: Search,
    description: 'Search and analysis',
    permission: 'sidebar_prior_art'
  },
  { 
    name: 'Infringement', 
    href: '/dashboard/infringement', 
    icon: Shield,
    badge: 'Pro',
    description: 'Infringement analysis',
    permission: 'sidebar_infringement'
  },
  {
    name: 'Analytics',
    href: '/dashboard/analytics',
    icon: BarChart3,
    description: 'Landscape and trends',
    permission: 'sidebar_analytics'
  },
  {
    name: 'Classifications',
    href: '/dashboard/classifications',
    icon: Tags,
    description: 'IPC & CPC classification browser',
    permission: 'sidebar_classifications'
  },
  { 
    name: 'Attorney Network', 
    href: '/dashboard/attorney', 
    icon: Users,
    description: 'Professional directory',
    permission: 'sidebar_attorney_network'
  },
];

const bottomNavigation: NavigationItem[] = [
  { name: 'Help', href: '/dashboard/help', icon: HelpCircle, description: 'Documentation and guides', permission: 'sidebar_help' },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings, permission: 'sidebar_settings' },
];

interface DashboardShellProps {
  children: React.ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    // Load collapsed state from localStorage
    if (typeof window !== 'undefined') {
      return localStorage.getItem('sidebar-collapsed') === 'true';
    }
    return false;
  });
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { hasPermission } = useUserPermissions();

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const getUserInitials = () => {
    if (!user) return 'U';
    return `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`.toUpperCase();
  };

  // Filter navigation items based on user permissions
  const visibleNavigation = navigation.filter(item => hasPermission(item.permission));
  const visibleBottomNavigation = bottomNavigation.filter(item => hasPermission(item.permission));

  // Toggle sidebar collapse
  const toggleSidebarCollapse = () => {
    const newCollapsedState = !sidebarCollapsed;
    setSidebarCollapsed(newCollapsedState);
    localStorage.setItem('sidebar-collapsed', newCollapsedState.toString());
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar */}
      <div className={cn(
        "fixed inset-0 z-50 lg:hidden",
        sidebarOpen ? "block" : "hidden"
      )}>
        <div className="fixed inset-0 bg-gray-600/80" onClick={() => setSidebarOpen(false)} />
        <div className="relative flex w-full max-w-xs flex-1 flex-col bg-background border-r">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(false)}
              className="text-gray-300 hover:text-white"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
          <SidebarContent />
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className={cn(
        "hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:flex-col transition-all duration-300 ease-in-out",
        sidebarCollapsed ? "lg:w-16" : "lg:w-72"
      )}>
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r bg-background">
          <SidebarContent />
        </div>
      </div>

      {/* Main content */}
      <div className={cn(
        "transition-all duration-300 ease-in-out",
        sidebarCollapsed ? "lg:pl-16" : "lg:pl-72"
      )}>
        {/* Top navigation */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b bg-background/95 backdrop-blur px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden"
          >
            <Menu className="h-6 w-6" />
          </Button>

          {/* Desktop sidebar collapse toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebarCollapse}
            className="hidden lg:flex"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>

          {/* Breadcrumb area */}
          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex items-center">
              <h1 className="text-lg font-semibold text-foreground">
                {visibleNavigation.find(item => isActive(item.href))?.name || 'Dashboard'}
              </h1>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-x-4 lg:gap-x-6">
            {/* Notifications */}
            <NotificationCenter />

            {/* Profile dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 h-auto p-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.avatar} alt={user?.firstName} />
                    <AvatarFallback className="text-xs">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:block text-left">
                    <div className="text-sm font-medium">{user?.firstName} {user?.lastName}</div>
                    <div className="text-xs text-muted-foreground capitalize">{user?.role}</div>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{user?.firstName} {user?.lastName}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/dashboard/profile')}>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/dashboard/settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                {(user?.role === 'admin' || user?.role === 'manager') && (
                  <DropdownMenuItem onClick={() => router.push('/dashboard/admin')}>
                    <Shield className="mr-2 h-4 w-4" />
                    Admin Panel
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem>
                  <Palette className="mr-2 h-4 w-4" />
                  Theme
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Page content */}
        <main className="py-6">
          <div className="px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );

  function SidebarContent() {
    return (
      <TooltipProvider delayDuration={250}>
        {/* Logo */}
        <div className={cn(
          "flex h-16 shrink-0 items-center transition-all duration-300",
          sidebarCollapsed ? "px-2 justify-center" : "px-6"
        )}>
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="h-8 w-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-sm font-bold text-white">PP</span>
            </div>
            {!sidebarCollapsed && (
              <span className="text-lg font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">PatPipes</span>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className={cn(
          "flex flex-1 flex-col transition-all duration-300",
          sidebarCollapsed ? "px-2" : "px-6"
        )}>
          <ul role="list" className="flex flex-1 flex-col gap-y-7">
            <li>
              <ul role="list" className={cn(
                "space-y-1",
                sidebarCollapsed ? "mx-0" : "-mx-2"
              )}>
                {visibleNavigation.map((item) => {
                  const linkContent = (
                    <Link
                      href={item.href}
                      className={cn(
                        "group flex rounded-md text-sm leading-6 font-semibold transition-colors",
                        sidebarCollapsed 
                          ? "p-2 justify-center" 
                          : "gap-x-3 p-2",
                        isActive(item.href)
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      )}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
                      {!sidebarCollapsed && (
                        <>
                          <span className="flex-1">{item.name}</span>
                          {item.badge && (
                            <Badge variant="secondary" className="ml-auto">
                              {item.badge}
                            </Badge>
                          )}
                        </>
                      )}
                    </Link>
                  );

                  return (
                    <li key={item.name}>
                      {sidebarCollapsed ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            {linkContent}
                          </TooltipTrigger>
                          <TooltipContent side="right">
                            <p>{item.name}</p>
                            {item.description && (
                              <p className="text-xs text-muted-foreground">
                                {item.description}
                              </p>
                            )}
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <>
                          {linkContent}
                          {item.description && (
                            <p className="ml-10 text-xs text-muted-foreground">
                              {item.description}
                            </p>
                          )}
                        </>
                      )}
                    </li>
                  );
                })}
              </ul>
            </li>

            {/* Bottom navigation */}
            {visibleBottomNavigation.length > 0 && (
              <li className="mt-auto">
                <ul role="list" className={cn(
                  "space-y-1",
                  sidebarCollapsed ? "mx-0" : "-mx-2"
                )}>
                  {visibleBottomNavigation.map((item) => {
                    const linkContent = (
                      <Link
                        href={item.href}
                        className={cn(
                          "group flex rounded-md text-sm leading-6 font-semibold transition-colors",
                          sidebarCollapsed 
                            ? "p-2 justify-center" 
                            : "gap-x-3 p-2",
                          isActive(item.href)
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        )}
                        onClick={() => setSidebarOpen(false)}
                      >
                        <item.icon className="h-5 w-5 shrink-0" />
                        {!sidebarCollapsed && item.name}
                      </Link>
                    );

                    return (
                      <li key={item.name}>
                        {sidebarCollapsed ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              {linkContent}
                            </TooltipTrigger>
                            <TooltipContent side="right">
                              <p>{item.name}</p>
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          linkContent
                        )}
                      </li>
                    );
                  })}
                </ul>
              </li>
            )}
          </ul>
        </nav>
      </TooltipProvider>
    );
  }
}