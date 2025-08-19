"use client";

import { Logo } from '@/components/icons/logo';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const LoginForm = dynamic(() => import('@/components/auth/login-form'), {
  ssr: false,
  loading: () => (
    <div className="space-y-4">
        <div className="space-y-2">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-10 w-full" />
        </div>
        <Skeleton className="h-10 w-full" />
    </div>
  )
});

export default function LoginPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-start md:justify-center bg-background p-4 pt-20 md:pt-4">
        <div className="w-full max-w-sm mx-auto flex flex-col items-center justify-center gap-8">
          <div className="grid gap-4 text-center animate-in fade-in-50 zoom-in-95 duration-500">
             <Logo className="mx-auto h-16 w-16 text-primary" />
             <div>
                <h1 className="text-3xl font-bold text-foreground">Argynix-Connect</h1>
             </div>
          </div>
          <div className="w-full animate-in fade-in-50 zoom-in-95 duration-500 delay-200">
            <LoginForm />
          </div>
        </div>
    </div>
  );
}
