
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart, HardDrive, Download, Package, Siren, Home } from 'lucide-react';
import { Logo } from '../icons/logo';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/home', label: 'Home', icon: Home, exact: true },
  { href: '/dashboards', label: 'Dashboards', icon: BarChart },
  { href: '/devices', label: 'Devices', icon: HardDrive },
  { href: '/assets', label: 'Assets', icon: Package },
  { href: '/alarms', label: 'Alarms', icon: Siren },
  { href: '/data-export', label: 'Data Export', icon: Download },
];

export function AppSidebar({ isMobile = false }: { isMobile?: boolean }) {
  const pathname = usePathname();

  const navContent = (
    <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
      {navItems.map((item) => {
        const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href) && item.href !== '/home';
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
        )
      })}
    </nav>
  );

  if (isMobile) {
    return (
        <div className="flex h-full flex-col gap-2">
            <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                <Link href="/" className="flex items-center gap-2 font-semibold">
                    <Logo className="h-6 w-6 text-primary" />
                    <span className="">Argynix-TB</span>
                </Link>
            </div>
            <div className="flex-1">
                {navContent}
            </div>
        </div>
    )
  }

  return (
    <div className="hidden border-r bg-card md:block">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <Link href="/home" className="flex items-center gap-2 font-semibold">
            <Logo className="h-6 w-6 text-primary" />
            <span className="">Argynix-TB</span>
          </Link>
        </div>
        <div className="flex-1">
          {navContent}
        </div>
      </div>
    </div>
  );
}
