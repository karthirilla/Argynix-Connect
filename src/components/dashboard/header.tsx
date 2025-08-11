
"use client";

import { useRouter, usePathname } from 'next/navigation';
import { CircleUser, Menu } from 'lucide-react';
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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../ui/sheet';
import { AppSidebar } from './sidebar';
import { useState, useEffect } from 'react';

export function AppHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('tb_user');
    setUsername(storedUser);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('tb_auth_token');
    localStorage.removeItem('tb_refresh_token');
    localStorage.removeItem('tb_instance_url');
    localStorage.removeItem('tb_user');
    localStorage.removeItem('tb_customer_id');
    router.push('/login');
  };

  const getTitle = () => {
    if (pathname.includes('/dashboard/dashboards')) return 'Dashboards';
    if (pathname.includes('/dashboard/devices')) return 'Devices';
    if (pathname.includes('/dashboard/assets')) return 'Assets';
    if (pathname.includes('/dashboard/data-export')) return 'Data Export';
    if (pathname.includes('/dashboard/profile')) return 'User Profile';
    return 'Dashboard';
  }

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6">
        <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="shrink-0">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle navigation menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[250px] p-0 flex flex-col">
                 <AppSidebar isMobile />
              </SheetContent>
            </Sheet>
        </div>
      <div className="w-full flex-1">
        <h1 className="font-semibold text-xl">{getTitle()}</h1>
      </div>
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
             <Link href="/dashboard/profile">Profile</Link>
          </DropdownMenuItem>
          <DropdownMenuItem>Support</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
