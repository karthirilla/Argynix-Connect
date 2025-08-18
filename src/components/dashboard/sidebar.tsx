
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart, HardDrive, Download, Package, Siren, Home, CalendarClock, Users, History } from 'lucide-react';
import { Logo } from '../icons/logo';
import { cn } from '@/lib/utils';
import { SheetHeader, SheetTitle } from '../ui/sheet';
import { useEffect, useState } from 'react';
import { getUser } from '@/lib/api';

const navItems = [
  { href: '/', label: 'Home', icon: Home, exact: true },
  { href: '/dashboards', label: 'Dashboards', icon: BarChart },
  { href: '/devices', label: 'Devices', icon: HardDrive },
  { href: '/assets', label: 'Assets', icon: Package },
  { href: '/alarms', label: 'Alarms', icon: Siren },
  { href: '/scheduler', label: 'Scheduler', icon: CalendarClock },
  { href: '/data-export', label: 'Data Export', icon: Download },
];

const adminNavItems = [
    {
        href: '/users',
        label: 'Users',
        icon: Users,
    },
    {
        href: '/audit-logs',
        label: 'Audit Logs',
        icon: History,
    }
]

export function AppSidebar({ isMobile = false }: { isMobile?: boolean }) {
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);
  
  useEffect(() => {
    const fetchUser = async () => {
        const token = localStorage.getItem('tb_auth_token');
        const instanceUrl = localStorage.getItem('tb_instance_url');
        if (!token || !instanceUrl) return;

        try {
            const user = await getUser(token, instanceUrl);
            if(user.authority === 'SYS_ADMIN' || user.authority === 'TENANT_ADMIN') {
                setIsAdmin(true);
            }
        } catch(e) {
            console.error("Could not fetch user to determine role", e);
        }
    }
    fetchUser();
  }, [])


  const renderNavItem = (item: typeof navItems[0]) => {
     const isActive = item.exact 
          ? pathname === item.href 
          : (pathname.startsWith(item.href) && item.href !== '/');
    return (
         <Link
            key={item.label}
            href={item.href}
            className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
                { 'bg-muted text-primary': isActive }
            )}
        >
            <item.icon className="h-4 w-4" />
            {item.label}
        </Link>
    );
  };

  const navContent = (
    <nav className={cn(
        "grid items-start text-sm font-medium",
        isMobile ? "px-2" : "px-2 lg:px-4"
    )}>
      {navItems.map(item => renderNavItem(item))}
      {isAdmin && adminNavItems.map(item => renderNavItem(item))}
    </nav>
  );

  if (isMobile) {
    return (
        <>
            <SheetHeader className="h-14 flex flex-row items-center border-b px-4 lg:h-[60px] lg:px-6">
                 <Link href="/" className="flex items-center gap-2 font-semibold">
                    <Logo className="h-6 w-6 text-primary" />
                    <SheetTitle className="text-base">Argynic-Connect</SheetTitle>
                </Link>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto">
                {navContent}
            </div>
        </>
    )
  }

  return (
    <div className="hidden border-r bg-card md:block">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Logo className="h-6 w-6 text-primary" />
            <span className="">Argynic-Connect</span>
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto">
          {navContent}
        </div>
      </div>
    </div>
  );
}
