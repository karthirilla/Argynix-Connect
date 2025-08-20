// /app/(dashboard)/layout.tsx
"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('tb_auth_token');
    if (token) {
      setIsAuthenticated(true);
    } else {
      router.replace('/login');
    }
    setIsAuthenticating(false);

    const savedState = localStorage.getItem('sidebarCollapsed') === 'true';
    setIsSidebarCollapsed(savedState);
  }, [router]);

  const handleSetIsSidebarCollapsed = (collapsed: boolean) => {
    setIsSidebarCollapsed(collapsed);
    localStorage.setItem('sidebarCollapsed', String(collapsed));
  };


  if (isAuthenticating) {
    return (
        <div className="flex h-screen w-screen items-center justify-center bg-background">
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
    <div 
      className={cn(
        "grid min-h-screen w-full transition-[grid-template-columns] duration-300 ease-in-out",
        isSidebarCollapsed 
          ? "md:grid-cols-[72px_1fr]" 
          : "md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]"
      )}
    >
      <AppSidebar 
        isCollapsed={isSidebarCollapsed} 
        setIsCollapsed={handleSetIsSidebarCollapsed}
      />
      <div className="flex flex-col h-screen">
        <AppHeader />
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          {children}
        </main>
        <Toaster />
      </div>
    </div>
  );
}
