// /app/(dashboard)/layout.tsx
"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AppSidebar } from '@/components/dashboard/sidebar';
import { AppHeader } from '@/components/dashboard/header';
import { Skeleton } from '@/components/ui/skeleton';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  
  const isIframePage = pathname.includes('/iframe');

  useEffect(() => {
    const token = localStorage.getItem('tb_auth_token');
    if (token) {
        setIsAuthenticated(true);
    } else {
        router.replace('/login');
    }
    setIsAuthenticating(false);
  }, [router]);

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

  if (!isAuthenticated) {
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
