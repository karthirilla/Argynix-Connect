// /app/dashboards/[id]/iframe/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export default function DashboardIframePage() {
  const params = useParams();
  const id = params.id as string;
  const [iframeSrc, setIframeSrc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setError('No dashboard ID provided.');
      setIsLoading(false);
      return;
    }

    const instanceUrl = localStorage.getItem('tb_instance_url');
    if (instanceUrl) {
      // We no longer add `?kiosk=true` so the dashboard's own sidebar is available
      setIframeSrc(`${instanceUrl}/dashboard/${id}`);
    } else {
      setError('ThingsBoard instance URL not found in local storage.');
    }
  }, [id]);

  const handleIframeLoad = () => {
    // A slight delay ensures that the content inside the iframe has had time to render,
    // reducing the visual "flicker" of the skeleton disappearing.
    setTimeout(() => {
      setIsLoading(false);
    }, 1500); 
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
    <div className="flex-grow h-full w-full relative -m-4 md:-m-8 lg:-m-10">
        {isLoading && <Skeleton className="absolute inset-0 w-full h-full rounded-lg" />}
        {iframeSrc && (
            <iframe
            src={iframeSrc}
            title="ThingsBoard Dashboard"
            className="w-full h-full border-0 rounded-lg"
            onLoad={handleIframeLoad}
            style={{ visibility: isLoading ? 'hidden' : 'visible' }}
            />
        )}
    </div>
  );
}
