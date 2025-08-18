// /app/dashboards/[id]/iframe/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, ArrowLeft, CircleUser, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import Link from 'next/link';

export default function DashboardIframePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [iframeSrc, setIframeSrc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [username, setUsername] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
     if (typeof window !== 'undefined') {
        const storedUser = localStorage.getItem('tb_user');
        setUsername(storedUser);
     }

    if (!id) {
      setError('No dashboard ID provided.');
      setIsLoading(false);
      return;
    }

    const instanceUrl = localStorage.getItem('tb_instance_url');
    if (instanceUrl) {
      // The "?kiosk=true" parameter hides the default ThingsBoard header and sidebar
      setIframeSrc(`${instanceUrl}/dashboard/${id}?kiosk=true`);
    } else {
      setError('ThingsBoard instance URL not found in local storage.');
    }
  }, [id]);

  const handleIframeLoad = () => {
    // A small delay to allow complex widgets to render before we consider it "loaded"
    setTimeout(() => {
      setIsLoading(false);
    }, 1500); 
  };
  
  const handlePrint = () => {
    toast({
        title: "Opening Print Dialog",
        description: `Please use your browser's print options to "Save as PDF".`,
    });
    window.print();
  }

  const handleLogout = () => {
    localStorage.clear();
    router.push('/login');
  };

  if (error) {
    return (
      <div className="flex h-full w-full items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Dashboard</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen bg-background">
       <header className="flex h-14 shrink-0 items-center gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6 print:hidden">
            <Button onClick={() => router.back()} variant="outline" size="icon" className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back</span>
            </Button>
            <div className="w-full flex-1">
                 <h1 className="font-semibold text-lg md:text-xl">Dashboard</h1>
            </div>
             <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={handlePrint} disabled={isLoading}>
                    <Printer className="h-4 w-4" />
                    <span className="sr-only">Print / Save as PDF</span>
                </Button>

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
       <main id="dashboard-container" className="flex-1 relative">
            {isLoading && <Skeleton className="absolute inset-0 w-full h-full" />}
            {iframeSrc && (
                <iframe
                src={iframeSrc}
                title="ThingsBoard Dashboard"
                className="w-full h-full border-0"
                onLoad={handleIframeLoad}
                style={{ visibility: isLoading ? 'hidden' : 'visible' }}
                />
            )}
       </main>
    </div>
  );
}
