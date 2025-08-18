// /app/dashboards/[id]/iframe/page.tsx
"use client";

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// This is a global event bus to communicate between the header and this page
const eventBus = {
  subscribe: (event: string, callback: EventListener) => {
    document.addEventListener(event, callback);
  },
  unsubscribe: (event: string, callback: EventListener) => {
    document.removeEventListener(event, callback);
  },
  dispatch: (event: string, data?: any) => {
    document.dispatchEvent(new CustomEvent(event, { detail: data }));
  }
};


export default function DashboardIframePage() {
  const params = useParams();
  const id = params.id as string;
  const [iframeSrc, setIframeSrc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!id) {
      setError('No dashboard ID provided.');
      setIsLoading(false);
      return;
    }

    const instanceUrl = localStorage.getItem('tb_instance_url');
    if (instanceUrl) {
      setIframeSrc(`${instanceUrl}/dashboard/${id}?kiosk=true`);
    } else {
      setError('ThingsBoard instance URL not found in local storage.');
    }
  }, [id]);

  const handleIframeLoad = () => {
    // Wait for the iframe content to render before signaling readiness
    setTimeout(() => {
        setIsLoading(false);
        eventBus.dispatch('iframe:ready'); // Signal to header that it can enable the export button
    }, 2000); // 2-second delay to allow complex widgets to load
  };
  
  const handlePrintRequest = () => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.print();
    }
  };


  useEffect(() => {
    eventBus.subscribe('print:request', handlePrintRequest as EventListener);
    return () => {
      eventBus.unsubscribe('print:request', handlePrintRequest as EventListener);
    };
  }, []);

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
    <div className="h-full w-full relative">
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
    </div>
  );
}
