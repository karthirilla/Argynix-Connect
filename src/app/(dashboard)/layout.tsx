// /app/(dashboard)/layout.tsx
"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AppSidebar } from '@/components/dashboard/sidebar';
import { AppHeader } from '@/components/dashboard/header';
import { Skeleton } from '@/components/ui/skeleton';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import { getUser } from '@/lib/api';
import type { ThingsboardUser } from '@/lib/types';


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<ThingsboardUser | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  
  const isIframePage = pathname.includes('/iframe');

  useEffect(() => {
    const checkAuthAndFetchUser = async () => {
        const token = localStorage.getItem('tb_auth_token');
        const instanceUrl = localStorage.getItem('tb_instance_url');

        if (!token || !instanceUrl) {
            router.replace('/login');
            setIsAuthenticating(false);
            return;
        }

        try {
            const userData = await getUser(token, instanceUrl);
            setUser(userData);
            
            const userIsAdmin = userData.authority === 'SYS_ADMIN' || userData.authority === 'TENANT_ADMIN';
            
            // Redirect non-admins away from admin pages
            if ((pathname.startsWith('/users') || pathname.startsWith('/tenant-profiles')) && !userIsAdmin) {
                 router.replace('/');
            }


        } catch (e) {
            // Token might be expired, log out
            console.error('Failed to fetch user, logging out', e);
            localStorage.clear();
            router.replace('/login');
        } finally {
            setIsAuthenticating(false);
        }
    };
    
    checkAuthAndFetchUser();

  }, [router, pathname]);

  if (isAuthenticating) {
    return (
        <div className="flex h-screen w-screen items-center justify-center">
            <div className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                </div>
            </div>
        </div>
    );
  }

  if (!user) {
    return null; // Render nothing while redirecting
  }

  return (
    <div className="flex min-h-screen w-full">
      {!isIframePage && <AppSidebar />}
      <div className="flex flex-1 flex-col">
        <AppHeader />
        <main className={cn(
            "flex-1 bg-background/50",
            !isIframePage && "p-4 md:p-8 lg:p-10"
          )}>
          {children}
        </main>
        <Toaster />
      </div>
    </div>
  );
}
