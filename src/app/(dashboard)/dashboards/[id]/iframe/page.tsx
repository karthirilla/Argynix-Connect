
// /app/dashboards/[id]/iframe/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Download, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

export default function DashboardIframePage() {
  const params = useParams();
  const id = params.id as string;
  const [iframeSrc, setIframeSrc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(true);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!id) {
      setError('No dashboard ID provided.');
      setIsCapturing(false);
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
    // Wait for the iframe content to render before capturing
    setTimeout(() => {
      html2canvas(document.body, {
        useCORS: true,
        allowTaint: true,
        scale: 2, // Higher scale for better quality
      }).then(canvas => {
        setCapturedImage(canvas.toDataURL('image/png'));
        setIsCapturing(false);
        toast({
          title: 'Ready to Export',
          description: 'Dashboard preview captured. You can now export it as a PDF.',
        });
      }).catch(err => {
        console.error("Failed to capture dashboard", err);
        setError("Could not capture the dashboard content for export.");
        setIsCapturing(false);
      });
    }, 3000); // 3-second delay to allow complex widgets to load
  };
  
  const handleExport = () => {
    if (!capturedImage) {
        toast({ variant: 'destructive', title: 'Error', description: 'No captured image to export.' });
        return;
    }
    setIsExporting(true);
    const doc = new jsPDF('l', 'px', [document.body.scrollWidth, document.body.scrollHeight]);
    doc.addImage(capturedImage, 'PNG', 0, 0, document.body.scrollWidth, document.body.scrollHeight);
    doc.save(`dashboard_${id}_${new Date().toISOString()}.pdf`);
    setIsExporting(false);
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
    <div className="h-full w-full relative">
      <div className="absolute top-4 left-4 z-20 flex gap-2">
         <Button asChild variant="secondary" size="sm">
            <Link href="/dashboards">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
          <Button onClick={handleExport} disabled={isCapturing || !capturedImage || isExporting}>
            {isCapturing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Download className="mr-2 h-4 w-4"/>}
            {isCapturing ? 'Capturing...' : (isExporting ? 'Exporting...' : 'Export as PDF')}
        </Button>
      </div>
      {isCapturing && !iframeSrc && <Skeleton className="absolute inset-0 w-full h-full" />}
      {iframeSrc && (
        <iframe
          src={iframeSrc}
          title="ThingsBoard Dashboard"
          className="w-full h-full border-0"
          onLoad={handleIframeLoad}
        />
      )}
    </div>
  );
}
