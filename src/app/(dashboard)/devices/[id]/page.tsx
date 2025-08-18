// /app/devices/[id]/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getDeviceById, getDeviceTelemetry, getDeviceTelemetryKeys } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, ArrowLeft, History, Rss } from 'lucide-react';
import { ThingsboardDevice } from '@/lib/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { subDays } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type ActivityLog = {
  ts: number;
  key: string;
  value: string | number | boolean;
}

export default function DeviceDetailsPage() {
  const params = useParams();
  const id = params.id as string;
  const [device, setDevice] = useState<ThingsboardDevice | null>(null);
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      setIsLoading(true);
      setIsHistoryLoading(true);
      const token = localStorage.getItem('tb_auth_token');
      const instanceUrl = localStorage.getItem('tb_instance_url');
      
      if (!token || !instanceUrl) {
        setError('Authentication details not found.');
        setIsLoading(false);
        setIsHistoryLoading(false);
        return;
      }

      try {
        const deviceData = await getDeviceById(token, instanceUrl, id);
        setDevice(deviceData);
        
        const keys = await getDeviceTelemetryKeys(token, instanceUrl, id);
        
        if (keys && keys.length > 0) {
            const endTs = new Date().getTime();
            const startTs = subDays(endTs, 1).getTime();
            const telemetry = await getDeviceTelemetry(token, instanceUrl, id, keys, startTs, endTs, 500);

            const formattedLog: ActivityLog[] = [];
            for (const key in telemetry) {
                if (Object.prototype.hasOwnProperty.call(telemetry, key)) {
                    telemetry[key].forEach((item: { ts: number, value: any }) => {
                        formattedLog.push({
                            ts: item.ts,
                            key: key,
                            value: String(item.value),
                        });
                    });
                }
            }
            
            // Sort by most recent first
            formattedLog.sort((a, b) => b.ts - a.ts);
            
            setActivityLog(formattedLog);
        }
      } catch (e: any) {
        setError(e.message || 'Failed to fetch device details.');
        console.error(e);
      } finally {
        setIsLoading(false);
        setIsHistoryLoading(false);
      }
    };

    fetchData();
  }, [id]);
  
  const renderLoadingState = () => (
     <div className="container mx-auto">
        <Skeleton className="h-8 w-32 mb-4" />
        <Card>
            <CardHeader>
                <Skeleton className="h-8 w-1/2 mb-2" />
                <Skeleton className="h-4 w-1/4" />
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                 {[...Array(6)].map((_, i) => (
                    <div className="space-y-2" key={i}>
                        <Skeleton className="h-4 w-1/3" />
                        <Skeleton className="h-6 w-2/3" />
                    </div>
                ))}
            </CardContent>
        </Card>
         <Card className="mt-6">
            <CardHeader>
                <Skeleton className="h-7 w-48" />
                <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent>
                <Skeleton className="h-[300px] w-full" />
            </CardContent>
        </Card>
      </div>
  );

  if (isLoading) {
    return renderLoadingState();
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
    <div className="container mx-auto space-y-6">
        <Button asChild variant="outline" size="sm" className="mb-4">
            <Link href="/devices">
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
      
      <Card>
        <CardHeader>
            <CardTitle>Activity History</CardTitle>
            <CardDescription>
                A log of the most recent telemetry data received from this device in the last 24 hours.
            </CardDescription>
        </CardHeader>
        <CardContent>
            {isHistoryLoading ? (
                 <Skeleton className="h-[300px] w-full" />
            ) : activityLog.length > 0 ? (
                <div className="h-[400px] w-full relative overflow-y-auto">
                    <Table>
                        <TableHeader className="sticky top-0 bg-card">
                            <TableRow>
                                <TableHead>Time</TableHead>
                                <TableHead>Key</TableHead>
                                <TableHead>Value</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {activityLog.map((log) => (
                                <TableRow key={`${log.ts}-${log.key}`}>
                                    <TableCell className="text-muted-foreground whitespace-nowrap">{new Date(log.ts).toLocaleString()}</TableCell>
                                    <TableCell><Badge variant="outline">{log.key}</Badge></TableCell>
                                    <TableCell className="font-medium">{log.value}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-[300px] border-2 border-dashed rounded-lg">
                    <Rss className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold">No Telemetry Data Found</h3>
                    <p className="text-muted-foreground text-sm text-center">This device has not reported any telemetry in the last 24 hours.</p>
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
