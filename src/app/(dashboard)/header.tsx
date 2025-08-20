
"use client";

import { useRouter, usePathname } from 'next/navigation';
import { CircleUser, Menu, Printer, ArrowLeft, Maximize, Minimize } from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';
import { logout } from '@/lib/api';
import { Notifications } from '@/components/dashboard/notifications';

export function AppHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const [username, setUsername] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('tb_user');
    setUsername(storedUser);

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        toast({
            variant: 'destructive',
            title: 'Fullscreen Error',
            description: `Error attempting to enable full-screen mode: ${err.message}`,
        });
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const handleLogout = async () => {
    const token = localStorage.getItem('tb_auth_token');
    const instanceUrl = localStorage.getItem('tb_instance_url');
    
    if (token && instanceUrl) {
        try {
            await logout(token, instanceUrl);
        } catch (error) {
            console.error("Logout API call failed, clearing session anyway.", error);
            toast({
                variant: 'destructive',
                title: 'Logout Error',
                description: 'Could not contact server to logout, session cleared locally.'
            })
        }
    }
    
    localStorage.clear();
    window.location.href = '/login';
  };

  const getTitle = () => {
    if (pathname === '/') return 'Home';
    if (pathname.startsWith('/dashboards')) return 'Dashboards';
    if (pathname.startsWith('/devices')) return 'Devices';
    if (pathname.startsWith('/assets')) return 'Assets';
    if (pathname.startsWith('/alarms')) return 'Alarms';
    if (pathname.startsWith('/scheduler')) return 'Scheduler';
    if (pathname.startsWith('/data-export')) return 'Data Export';
    if (pathname.startsWith('/profile')) return 'User Profile';
    if (pathname.startsWith('/users')) return 'User Management';
    if (pathname.startsWith('/customers')) return 'Customer Management';
    if (pathname.startsWith('/audit-logs')) return 'Audit Logs';
    if (pathname.startsWith('/jobs')) return 'Jobs';
    if (pathname.startsWith('/admin/settings')) return 'Admin Settings';
    if (pathname.startsWith('/admin/users')) return 'System Users';
    return 'Home';
  }

  const showBackButton = /^\/(devices|assets|dashboards|alarms)\/[^/]+/.test(pathname) && !pathname.includes('/iframe');
  const showPrintButton = pathname.includes('/iframe');

  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6">
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
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
            <SheetContent side="left" className="flex flex-col w-[250px] p-0 bg-sidebar border-r-0">
                <AppSidebar isMobile onLinkClick={() => setIsMobileMenuOpen(false)} />
            </SheetContent>
        </Sheet>
        <div className="w-full flex-1 flex items-center gap-4">
            {showBackButton && (
                 <Button variant="outline" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                    <span className="sr-only">Back</span>
                </Button>
            )}
            <h1 className="font-semibold text-lg md:text-xl">{getTitle()}</h1>
        </div>
        <div className="flex items-center gap-2">
            {showPrintButton && (
                <Button variant="outline" size="icon" onClick={() => window.print()}>
                    <Printer className="h-5 w-5" />
                    <span className="sr-only">Print</span>
                </Button>
            )}
            <Button variant="outline" size="icon" onClick={toggleFullscreen}>
              {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
              <span className="sr-only">Toggle fullscreen</span>
            </Button>
            <Notifications />
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
