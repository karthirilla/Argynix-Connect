// /app/devices/[id]/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getDeviceById, getDeviceTelemetry, getDeviceTelemetryKeys } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, ArrowLeft, Rss } from 'lucide-react';
import { ThingsboardDevice } from '@/lib/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { subHours } from 'date-fns';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Brush } from 'recharts';


type ActivityStatus = {
  time: string;
  status: 0 | 1; // 0 for Offline, 1 for Online
};

export default function DeviceDetailsPage() {
  const params = useParams();
  const id = params.id as string;
  const [device, setDevice] = useState<ThingsboardDevice | null>(null);
  const [activityStatus, setActivityStatus] = useState<ActivityStatus[]>([]);
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
            const startTs = subHours(endTs, 24).getTime();
            const telemetry = await getDeviceTelemetry(token, instanceUrl, id, keys, startTs, endTs, 50000);

            const statusData = processTelemetryForActivityChart(telemetry, startTs, endTs);
            setActivityStatus(statusData);

        } else {
            setActivityStatus([]);
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
  
  const processTelemetryForActivityChart = (telemetry: any, startTs: number, endTs: number): ActivityStatus[] => {
      const interval = 5 * 60 * 1000; // 5 minutes
      const telemetryTimestamps = new Set<number>();
      
      for (const key in telemetry) {
        telemetry[key].forEach((item: { ts: number }) => {
            telemetryTimestamps.add(Math.floor(item.ts / interval) * interval);
        });
      }
      
      const chartData: ActivityStatus[] = [];
      for (let ts = startTs; ts <= endTs; ts += interval) {
        const intervalStart = Math.floor(ts / interval) * interval;
        const status: 0 | 1 = telemetryTimestamps.has(intervalStart) ? 1 : 0;
        chartData.push({
          time: new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
          status: status,
        });
      }
      return chartData;
  };
  
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
                <Skeleton className="h-[350px] w-full" />
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
  
  const formatTooltip = (value: number) => {
    return value === 1 ? 'Online' : 'Offline';
  };

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
            <CardTitle>Activity Status (Last 24h)</CardTitle>
            <CardDescription>
                A visual representation of the device's online/offline status. Drag the handles to zoom.
            </CardDescription>
        </CardHeader>
        <CardContent>
            {isHistoryLoading ? (
                 <Skeleton className="h-[350px] w-full" />
            ) : activityStatus.length > 0 ? (
                <div className="h-[350px] w-full">
                   <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={activityStatus} margin={{ top: 5, right: 20, left: -10, bottom: 20 }}>
                            <defs>
                                <linearGradient id="colorStatus" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis 
                                dataKey="time" 
                                tick={{ fontSize: 12 }} 
                                tickLine={false} 
                                axisLine={false} 
                                interval="preserveStartEnd"
                                minTickGap={80}
                            />
                            <YAxis 
                                allowDecimals={false} 
                                width={30} 
                                tick={{ fontSize: 12 }} 
                                tickLine={false} 
                                axisLine={false}
                                domain={[0, 1]}
                                ticks={[0, 1]}
                                tickFormatter={(value) => value === 1 ? 'Online' : 'Offline'}
                            />
                            <Tooltip
                                 formatter={formatTooltip}
                                 cursor={{ fill: 'hsl(var(--muted))' }}
                                 contentStyle={{
                                    background: 'hsl(var(--background))',
                                    border: '1px solid hsl(var(--border))',
                                    borderRadius: 'var(--radius)',
                                }}
                                labelStyle={{ fontWeight: 'bold' }}
                            />
                            <Area type="step" dataKey="status" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorStatus)" />
                            <Brush 
                                dataKey="time" 
                                height={30} 
                                stroke="hsl(var(--primary))"
                                startIndex={activityStatus.length > 100 ? activityStatus.length - 100 : 0}
                                endIndex={activityStatus.length - 1}
                                tickFormatter={() => ''}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-[350px] border-2 border-dashed rounded-lg">
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
