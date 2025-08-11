// /app/dashboard/devices/[id]/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getDeviceById } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { ThingsboardDevice } from '@/lib/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

export default function DeviceDetailsPage() {
  const params = useParams();
  const id = params.id as string;
  const [device, setDevice] = useState<ThingsboardDevice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      const token = localStorage.getItem('tb_auth_token');
      const instanceUrl = localStorage.getItem('tb_instance_url');
      
      if (!token || !instanceUrl) {
        setError('Authentication details not found.');
        setIsLoading(false);
        return;
      }

      try {
        const deviceData = await getDeviceById(token, instanceUrl, id);
        setDevice(deviceData);
      } catch (e: any) {
        setError(e.message || 'Failed to fetch device details.');
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (isLoading) {
    return (
       <div className="container mx-auto">
        <Skeleton className="h-8 w-32 mb-4" />
        <Card>
            <CardHeader>
                <Skeleton className="h-8 w-1/2 mb-2" />
                <Skeleton className="h-4 w-1/4" />
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-6 w-2/3" />
                </div>
                 <div className="space-y-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-6 w-2/3" />
                </div>
                 <div className="space-y-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-6 w-2/3" />
                </div>
                 <div className="space-y-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-6 w-2/3" />
                </div>
            </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
        <div className="container mx-auto">
             <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        </div>
    );
  }
  
  if (!device) {
      return (
          <div className="container mx-auto text-center">
              <p>Device not found.</p>
          </div>
      )
  }
  
  const DetailItem = ({ label, value }: { label: string; value: string | undefined | null }) => (
    <div className="space-y-1">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="text-base font-semibold">{value || 'N/A'}</p>
    </div>
  );

  return (
    <div className="container mx-auto">
        <Button asChild variant="outline" size="sm" className="mb-4">
            <Link href="/dashboard/devices">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Devices
            </Link>
        </Button>
      <Card>
        <CardHeader>
          <CardTitle>{device.name}</CardTitle>
          <CardDescription>
            <Badge variant="secondary">{device.type}</Badge>
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <DetailItem label="Device ID" value={device.id.id} />
          <DetailItem label="Label" value={device.label} />
          <DetailItem label="Created Time" value={new Date(device.createdTime).toLocaleString()} />
          <DetailItem label="Customer ID" value={device.customerId?.id} />
          <DetailItem label="Entity Type" value={device.id.entityType} />
        </CardContent>
      </Card>
    </div>
  );
}
