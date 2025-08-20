// src/components/dashboard/sidebar.tsx

"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart, HardDrive, Download, Package, Siren, Home, CalendarClock, Users, History, Settings, Building, ListChecks, Grid, BellRing } from 'lucide-react';
import { Logo } from '../icons/logo';
import { cn } from '@/lib/utils';
import { SheetHeader, SheetTitle } from '../ui/sheet';
import { useEffect, useState } from 'react';
import { getUser } from '@/lib/api';
import type { ThingsboardUser } from '@/lib/types';
import { Skeleton } from '../ui/skeleton';

const navItems = [
  { href: '/', label: 'Home', icon: Home, exact: true, requiredAuth: ['SYS_ADMIN', 'TENANT_ADMIN', 'CUSTOMER_USER'] },
  { href: '/dashboards', label: 'Dashboards', icon: BarChart, requiredAuth: ['SYS_ADMIN', 'TENANT_ADMIN', 'CUSTOMER_USER'] },
  { href: '/devices', label: 'Devices', icon: HardDrive, requiredAuth: ['SYS_ADMIN', 'TENANT_ADMIN', 'CUSTOMER_USER'] },
  { href: '/assets', label: 'Assets', icon: Package, requiredAuth: ['SYS_ADMIN', 'TENANT_ADMIN', 'CUSTOMER_USER'] },
  { href: '/alarms', label: 'Alarms', icon: Siren, requiredAuth: ['SYS_ADMIN', 'TENANT_ADMIN', 'CUSTOMER_USER'] },
  { href: '/scheduler', label: 'Scheduler', icon: CalendarClock, requiredAuth: ['SYS_ADMIN', 'TENANT_ADMIN', 'CUSTOMER_USER'] },
  { href: '/widgets', label: 'Widgets', icon: Grid, requiredAuth: ['SYS_ADMIN', 'TENANT_ADMIN', 'CUSTOMER_USER'] },
  { href: '/data-export', label: 'Data Export', icon: Download, requiredAuth: ['SYS_ADMIN', 'TENANT_ADMIN', 'CUSTOMER_USER'] },
  { href: '/customers', label: 'Customers', icon: Building, requiredAuth: ['TENANT_ADMIN'] },
  { href: '/users', label: 'User Management', icon: Users, requiredAuth: ['TENANT_ADMIN'] },
  { href: '/jobs', label: 'Jobs', icon: ListChecks, requiredAuth: ['TENANT_ADMIN', 'SYS_ADMIN'] },
  { href: '/audit-logs', label: 'Audit Logs', icon: History, requiredAuth: ['TENANT_ADMIN'] },
];

const adminNavItems = [
    { href: '/admin/settings', label: 'Admin Settings', icon: Settings, requiredAuth: ['SYS_ADMIN'] },
    { href: '/admin/users', label: 'System Users', icon: Users, requiredAuth: ['SYS_ADMIN'] },
];


export function AppSidebar({ isMobile = false, onLinkClick }: { isMobile?: boolean, onLinkClick?: () => void }) {
  const pathname = usePathname();
  const [user, setUser] = useState<ThingsboardUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchUser = async () => {
        setIsLoading(true);
        const token = localStorage.getItem('tb_auth_token');
        const instanceUrl = localStorage.getItem('tb_instance_url');
        if (!token || !instanceUrl) {
            setIsLoading(false);
            return;
        }

        try {
            const userData = await getUser(token, instanceUrl);
            setUser(userData);
        } catch(e) {
            console.error("Could not fetch user to determine role", e);
        } finally {
            setIsLoading(false);
        }
    }
    fetchUser();
  }, [])
  
  const getVisibleNavItems = (items: typeof navItems) => {
    if (!user) return [];
    return items.filter(item => item.requiredAuth.includes(user.authority));
  };
  
  const visibleNavItems = getVisibleNavItems(navItems);
  const visibleAdminNavItems = getVisibleNavItems(adminNavItems);

  const renderNavItem = (item: typeof navItems[0]) => {
     const isActive = item.exact 
          ? pathname === item.href 
          : (pathname.startsWith(item.href) && item.href !== '/');
    return (
         <Link
            key={item.label}
            href={item.href}
            onClick={onLinkClick}
            className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sidebar-foreground transition-all hover:text-sidebar-primary',
                { 'bg-sidebar-accent text-sidebar-accent-foreground': isActive }
            )}
        >
            <item.icon className="h-4 w-4" />
            {item.label}
        </Link>
    );
  };
  
  const renderNavSkeleton = () => (
    <div className={cn("grid items-start gap-1 text-sm font-medium", isMobile ? "px-2" : "px-2 lg:px-4")}>
      {[...Array(10)].map((_, i) => (
        <Skeleton key={i} className="h-9 w-full" />
      ))}
    </div>
  );

  const navContent = (
    <div className="flex-1 overflow-y-auto">
        <nav className={cn("grid items-start gap-1 text-sm font-medium", isMobile ? "px-2 py-2" : "px-2 py-4 lg:px-4")}>
            {visibleNavItems.map(item => renderNavItem(item))}
        </nav>
        {visibleAdminNavItems.length > 0 && (
            <div className="mt-auto p-4">
                 <h3 className="px-2 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Admin</h3>
                 <nav className={cn("grid items-start gap-1 text-sm font-medium", isMobile ? "px-2" : "px-2 lg:px-4")}>
                    {visibleAdminNavItems.map(item => renderNavItem(item))}
                </nav>
            </div>
        )}
    </div>
  );

  const finalContent = isLoading ? renderNavSkeleton() : navContent;

  if (isMobile) {
    return (
        <>
            <SheetHeader className="h-14 flex flex-row items-center border-b border-sidebar-border px-4 lg:h-[60px] lg:px-6">
                 <Link href="/" className="flex items-center gap-2 font-semibold" onClick={onLinkClick}>
                    <Logo className="h-6 w-6 text-primary" />
                    <SheetTitle className="text-base">Argynix-Connect</SheetTitle>
                </Link>
            </SheetHeader>
            {finalContent}
        </>
    )
  }

  return (
    <div className="hidden border-r border-sidebar-border bg-sidebar md:flex md:flex-col">
        <div className="flex h-14 items-center border-b border-sidebar-border px-4 lg:h-[60px] lg:px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Logo className="h-6 w-6 text-primary" />
            <span className="">Argynix-Connect</span>
          </Link>
        </div>
        {finalContent}
    </div>
  );
}
