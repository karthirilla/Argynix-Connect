
"use client";

import { useRouter, usePathname } from 'next/navigation';
import { CircleUser, Menu, ArrowLeft, Download } from 'lucide-react';
import Link from 'next/link';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

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

  const handleExport = (format: 'png' | 'jpeg' | 'pdf') => {
    const mainContent = document.querySelector('main');
    if (!mainContent) return;

    html2canvas(mainContent, {
        allowTaint: true,
        useCORS: true,
        scale: 2
    }).then((canvas) => {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `${getTitle().toLowerCase().replace(/\s/g, '_')}_${timestamp}`;

        if (format === 'pdf') {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
                unit: 'px',
                format: [canvas.width, canvas.height]
            });
            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
            pdf.save(`${filename}.pdf`);
        } else {
            const image = canvas.toDataURL(`image/${format}`, 1.0);
            const link = document.createElement('a');
            link.href = image;
            link.download = `${filename}.${format}`;
            link.click();
        }
    });
  };
  
  const isIframePage = pathname.includes('/iframe');

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
           <Button asChild variant="outline" size="sm">
            <Link href="/dashboards">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
        )}
        <h1 className="font-semibold text-lg md:text-xl">{getTitle()}</h1>
      </div>
      <div className="flex items-center gap-2">
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="rounded-full">
                    <Download className="h-5 w-5" />
                    <span className="sr-only">Export Page</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Export Page As</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleExport('png')}>PNG Image</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('jpeg')}>JPEG Image</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('pdf')}>PDF Document</DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>

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
