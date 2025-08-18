// /app/dashboards/[id]/iframe/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function DashboardIframePage() {
  const params = useParams();
  const id = params.id as string;
  const [iframeSrc, setIframeSrc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) {
        setError("No dashboard ID provided.");
        setIsLoading(false);
        return;
    };

    const instanceUrl = localStorage.getItem('tb_instance_url');
    if (instanceUrl) {
      setIframeSrc(`${instanceUrl}/dashboards/${id}?kiosk=true`);
    } else {
      setError("ThingsBoard instance URL not found in local storage.");
    }
    // Give a small delay for the iframe to start loading, then turn off the skeleton
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);

  }, [id]);
  
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
    <div className="h-full w-full flex flex-col">
        <div className="p-4 border-b">
             <Button asChild variant="outline" size="sm">
                <Link href="/dashboards">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Dashboards
                </Link>
            </Button>
        </div>
        <div className="flex-1 relative">
            {isLoading && <Skeleton className="absolute inset-0 w-full h-full" />}
            {iframeSrc && (
                <iframe
                    src={iframeSrc}
                    title="ThingsBoard Dashboard"
                    className="w-full h-full border-0"
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                    }}
                />
            )}
        </div>
    </div>
  );
}
