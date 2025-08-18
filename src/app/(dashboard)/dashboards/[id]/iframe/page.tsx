// /app/dashboards/[id]/iframe/page.tsx
"use client";

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, ArrowLeft, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function DashboardIframePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [iframeSrc, setIframeSrc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { toast } = useToast();

  useEffect(() => {
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
      toast({
        title: "Dashboard Ready",
        description: "You can now print or save the dashboard as a PDF.",
      });
    }, 2000); 
  };
  
  const handlePrint = () => {
    // `window.print()` will open the browser's print dialog for the current page,
    // which is exactly what we need to print the dashboard.
    window.print();
  }

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
       <header className="flex h-14 items-center gap-4 border-b bg-card px-4 shrink-0">
         <Button onClick={() => router.back()} variant="outline" size="icon" className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back</span>
            </Button>
            <h1 className="font-semibold text-lg">Dashboard</h1>
            <div className="ml-auto">
                <Button variant="outline" size="icon" disabled={isLoading} onClick={handlePrint}>
                    <Printer className="h-4 w-4" />
                    <span className="sr-only">Print / Save as PDF</span>
                </Button>
            </div>
       </header>
       <main className="flex-1 relative">
            {isLoading && <Skeleton className="absolute inset-0 w-full h-full" />}
            {iframeSrc && (
                <iframe
                ref={iframeRef}
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
