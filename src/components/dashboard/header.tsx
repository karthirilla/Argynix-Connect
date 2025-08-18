
"use client";

import { useRouter, usePathname } from 'next/navigation';
import { CircleUser, Menu, Printer, ArrowLeft } from 'lucide-react';
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

interface AppHeaderProps {
    onPrint?: () => void;
    isIframePage?: boolean;
}


export function AppHeader({ onPrint, isIframePage = false }: AppHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('tb_user');
    setUsername(storedUser);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    router.push('/login');
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
    <header className="flex h-14 shrink-0 items-center gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6">
        {!isIframePage ? (
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
        ) : (
             <Button onClick={() => router.back()} variant="outline" size="icon" className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back</span>
            </Button>
        )}
      <div className="w-full flex-1 flex items-center gap-4">
        <h1 className="font-semibold text-lg md:text-xl">{getTitle()}</h1>
      </div>
      <div className="flex items-center gap-2">
         {isIframePage && onPrint && (
            <Button variant="outline" size="icon" onClick={onPrint}>
                <Printer className="h-4 w-4" />
                <span className="sr-only">Print / Save as PDF</span>
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
