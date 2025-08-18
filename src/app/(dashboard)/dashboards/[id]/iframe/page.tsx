// /app/dashboards/[id]/iframe/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, ArrowLeft, CircleUser, Download, FileImage, FileType, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';


export default function DashboardIframePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [iframeSrc, setIframeSrc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
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
      toast({
        title: "Dashboard Ready",
        description: "You can now export the dashboard.",
      });
    }, 2500); 
  };
  
  const handleExport = async (format: 'pdf' | 'png' | 'jpeg') => {
    setIsExporting(true);
    toast({
        title: "Exporting...",
        description: `Generating ${format.toUpperCase()} file. Please wait.`,
    });

    try {
        const dashboardElement = document.getElementById('dashboard-container');
        if (!dashboardElement) {
            throw new Error("Could not find dashboard element to capture.");
        }

        const canvas = await html2canvas(dashboardElement, {
            useCORS: true, // Important for iframes
            scale: 2, // Higher scale for better quality
            allowTaint: true,
        });

        const imgData = canvas.toDataURL(`image/${format}`, 1.0);
        const fileName = `dashboard-${id}.${format}`;

        if (format === 'pdf') {
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'px',
                format: 'a4',
            });
            
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const canvasWidth = canvas.width;
            const canvasHeight = canvas.height;
            const ratio = Math.min(pdfWidth / canvasWidth, pdfHeight / canvasHeight);

            const finalWidth = canvasWidth * ratio * 0.95; // 5% margin
            const finalHeight = canvasHeight * ratio * 0.95;

            const x = (pdfWidth - finalWidth) / 2;
            const y = (pdfHeight - finalHeight) / 2;

            pdf.addImage(imgData, 'PNG', x, y, finalWidth, finalHeight);
            pdf.save(fileName);
        } else {
             const link = document.createElement('a');
             link.href = imgData;
             link.download = fileName;
             document.body.appendChild(link);
             link.click();
             document.body.removeChild(link);
        }
        
         toast({
            title: "Export Successful",
            description: `Your dashboard has been saved as a ${format.toUpperCase()} file.`,
        });

    } catch (err: any) {
        console.error("Export failed", err);
        toast({
            variant: 'destructive',
            title: 'Export Failed',
            description: err.message || 'An unexpected error occurred during export.',
        });
    } finally {
        setIsExporting(false);
    }
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
       <header className="flex h-14 shrink-0 items-center gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6">
            <Button onClick={() => router.back()} variant="outline" size="icon" className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back</span>
            </Button>
            <div className="w-full flex-1">
                 <h1 className="font-semibold text-lg md:text-xl">Dashboard</h1>
            </div>
             <div className="flex items-center gap-2">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon" disabled={isLoading || isExporting}>
                            {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                            <span className="sr-only">Export Dashboard</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Export Dashboard</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleExport('pdf')}>
                            <FileType className="mr-2 h-4 w-4"/>
                            <span>Save as PDF</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleExport('png')}>
                            <FileImage className="mr-2 h-4 w-4"/>
                            <span>Save as PNG</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleExport('jpeg')}>
                             <FileImage className="mr-2 h-4 w-4"/>
                            <span>Save as JPEG</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

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
