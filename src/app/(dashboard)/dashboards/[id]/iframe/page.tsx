// /app/dashboards/[id]/iframe/page.tsx
"use client";

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
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
  const { toast } = useToast();

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
  
  const handleExport = useCallback(async (event: CustomEvent) => {
    const format = event.detail.format;
    if (!format) return;

    eventBus.dispatch('export:start');
    toast({ title: "Capturing Dashboard...", description: `Please wait while we generate the ${format.toUpperCase()} file.` });
    
    try {
        const canvas = await html2canvas(document.body, {
            useCORS: true,
            allowTaint: true,
            scale: 2,
        });

        const capturedImage = canvas.toDataURL(`image/${format === 'pdf' ? 'png' : format}`, 1.0);
        
        const downloadFile = (uri: string, fileName: string) => {
            const link = document.createElement("a");
            link.href = uri;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        };
        
        const fileName = `dashboard_${id}_${new Date().toISOString()}`;

        if (format === 'pdf') {
            const doc = new jsPDF('l', 'px', [document.body.scrollWidth, document.body.scrollHeight]);
            doc.addImage(capturedImage, 'PNG', 0, 0, document.body.scrollWidth, document.body.scrollHeight);
            doc.save(`${fileName}.pdf`);
        } else if (format === 'png') {
            downloadFile(capturedImage, `${fileName}.png`);
        } else if (format === 'jpeg') {
            downloadFile(capturedImage, `${fileName}.jpeg`);
        }


        toast({ title: "Export Complete", description: `Your ${format.toUpperCase()} has been downloaded.` });

    } catch (err) {
        console.error("Failed to export dashboard", err);
        toast({ variant: 'destructive', title: 'Export Failed', description: 'Could not capture the dashboard for export.' });
    } finally {
        eventBus.dispatch('export:end');
    }
  }, [id, toast]);


  useEffect(() => {
    eventBus.subscribe('export:request', handleExport as EventListener);
    return () => {
      eventBus.unsubscribe('export:request', handleExport as EventListener);
    };
  }, [handleExport]);

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
