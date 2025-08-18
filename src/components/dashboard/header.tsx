
"use client";

import { useRouter, usePathname } from 'next/navigation';
import { CircleUser, Menu, Download, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '../ui/sheet';
import { AppSidebar } from './sidebar';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

// This is a global event bus to communicate between a page and this header
const eventBus = {
  subscribe: (event: string, callback: EventListener) => {
    document.addEventListener(event, callback);
  },
  unsubscribe: (event: string, callback: EventListener) => {
    document.removeEventListener(event, callback);
  },
  dispatch: (event: string, data?: any) => {
    document.dispatchEvent(new CustomEvent(event, { detail: data }));
  }
};

export function AppHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const [username, setUsername] = useState<string | null>(null);
  const [isIframePage, setIsIframePage] = useState(false);
  const [isIframeReady, setIsIframeReady] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('tb_user');
    setUsername(storedUser);
    
    const onIframePage = pathname.includes('/iframe');
    setIsIframePage(onIframePage);

    const handleIframeReady = () => setIsIframeReady(true);
    const handleExportStart = () => setIsExporting(true);
    const handleExportEnd = () => setIsExporting(false);

    if(onIframePage) {
        eventBus.subscribe('iframe:ready', handleIframeReady);
        eventBus.subscribe('export:start', handleExportStart);
        eventBus.subscribe('export:end', handleExportEnd);
    }
    
    return () => {
        if(onIframePage) {
            eventBus.unsubscribe('iframe:ready', handleIframeReady);
            eventBus.unsubscribe('export:start', handleExportStart);
            eventBus.unsubscribe('export:end', handleExportEnd);
        }
    }

  }, [pathname]);

  const handleLogout = () => {
    localStorage.clear();
    router.push('/login');
  };

  const handleExportRequest = () => {
    eventBus.dispatch('export:request');
  };

  const getTitle = () => {
    if (isIframePage) return 'Dashboard';
    if (pathname === '/') return 'Home';
    if (pathname.startsWith('/dashboards')) return 'Dashboards';
    if (pathname.startsWith('/devices')) return 'Devices';
    if (pathname.startsWith('/assets')) return 'Assets';
    if (pathname.startsWith('/alarms')) return 'Alarms';
    if (pathname.startsWith('/scheduler')) return 'Scheduler';
    if (pathname.startsWith('/data-export')) return 'Data Export';
    if (pathname.startsWith('/profile')) return 'User Profile';
    if (pathname.startsWith('/users')) return 'User Management';
    if (pathname.startsWith('/audit-logs')) return 'Audit Logs';
    return 'Home';
  }
  
  return (
    <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6">
        <Sheet>
            <SheetTrigger asChild>
            <Button
                variant="outline"
                size="icon"
                className="shrink-0 md:hidden"
            >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
            </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col w-[250px] p-0">
                <AppSidebar isMobile />
            </SheetContent>
        </Sheet>
      <div className="w-full flex-1 flex items-center gap-4">
        {isIframePage && (
             <Button onClick={() => router.back()} variant="outline" size="icon" className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back</span>
            </Button>
        )}
        <h1 className={cn(
            "font-semibold text-lg md:text-xl",
            isIframePage && "text-base md:text-lg"
            )}>{getTitle()}</h1>
      </div>
      <div className="flex items-center gap-2">
        {isIframePage && (
             <Button onClick={handleExportRequest} disabled={!isIframeReady || isExporting} size="sm">
                {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Download className="mr-2 h-4 w-4"/>}
                {isExporting ? 'Exporting...' : 'Export as PDF'}
            </Button>
        )}
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="icon" className="rounded-full">
                <CircleUser className="h-5 w-5" />
                <span className="sr-only">Toggle user menu</span>
            </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
            <DropdownMenuLabel>{username || 'My Account'}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
                <Link href="/profile">Profile</Link>
            </DropdownMenuItem>
            <DropdownMenuItem disabled>Support</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
       </div>
    </header>
  );
}
