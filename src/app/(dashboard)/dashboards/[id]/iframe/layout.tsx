// /app/(dashboard)/dashboards/[id]/iframe/layout.tsx
"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardIframeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(true);

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
  
  // This layout is intentionally minimal. It doesn't render its own header or sidebar,
  // as it relies on the parent layout to provide the main application shell.
  // Its primary purpose is to ensure the iframe content area has no padding.
  return (
    <>
      {children}
    </>
  );
}
