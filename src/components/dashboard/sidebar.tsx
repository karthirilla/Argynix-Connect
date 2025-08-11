
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, PanelLeft, Settings, BarChart, HardDrive, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Logo } from '../icons/logo';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard/dashboards', label: 'Dashboards', icon: BarChart },
  { href: '/dashboard/devices', label: 'Devices', icon: HardDrive },
  { href: '/dashboard/data-export', label: 'Data Export', icon: Download },
];

export function AppSidebar() {
  const pathname = usePathname();

  const navContent = (
    <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
      {navItems.map((item) => (
        <Link
          key={item.label}
          href={item.href}
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
            { 'bg-muted text-primary': pathname.startsWith(item.href) }
          )}
        >
          <item.icon className="h-4 w-4" />
          {item.label}
        </Link>
      ))}
    </nav>
  );

  return (
    <>
      <div className="hidden border-r bg-card md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
              <Logo className="h-6 w-6 text-primary" />
              <span className="">Argynix IOT</span>
            </Link>
          </div>
          <div className="flex-1">
            {navContent}
          </div>
        </div>
      </div>
      <div className="md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="shrink-0">
              <PanelLeft className="h-5 w-5" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="flex flex-col">
            {navContent}
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
