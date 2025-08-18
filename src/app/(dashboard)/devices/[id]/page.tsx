// /app/devices/[id]/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getDeviceById, getDeviceTelemetry, getDeviceTelemetryKeys } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, ArrowLeft, LineChart as ChartIcon } from 'lucide-react';
import { ThingsboardDevice } from '@/lib/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { subDays } from 'date-fns';

type ChartData = {
  ts: number;
  [key: string]: number | string;
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default function DeviceDetailsPage() {
  const params = useParams();
  const id = params.id as string;
  const [device, setDevice] = useState<ThingsboardDevice | null>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [chartKey, setChartKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isChartLoading, setIsChartLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      setIsLoading(true);
      setIsChartLoading(true);
      const token = localStorage.getItem('tb_auth_token');
      const instanceUrl = localStorage.getItem('tb_instance_url');
      
      if (!token || !instanceUrl) {
        setError('Authentication details not found.');
        setIsLoading(false);
        setIsChartLoading(false);
        return;
      }

      try {
        const deviceData = await getDeviceById(token, instanceUrl, id);
        setDevice(deviceData);
        
        // Fetch telemetry keys and then the data for the first numeric key found
        const keys = await getDeviceTelemetryKeys(token, instanceUrl, id);
        
        if (keys && keys.length > 0) {
            // Prioritize common keys, then fall back to the first available key
            const preferredKeys = ['temperature', 'humidity', 'pressure', 'voltage'];
            let keyToPlot = preferredKeys.find(k => keys.includes(k));
            if (!keyToPlot) {
                keyToPlot = keys[0];
            }
            
            const telemetry = await getDeviceTelemetry(token, instanceUrl, id, [keyToPlot], subDays(new Date(), 1).getTime(), new Date().getTime());
            
            if (telemetry && telemetry[keyToPlot] && telemetry[keyToPlot].length > 0) {
                 const isNumeric = typeof telemetry[keyToPlot][0].value === 'number';

                 if (isNumeric) {
                    const formattedData = telemetry[keyToPlot].map((item: { ts: number, value: any }) => ({
                        ts: item.ts,
                        time: new Date(item.ts).toLocaleTimeString(),
                        [keyToPlot!]: item.value,
                    })).sort((a: { ts: number }, b: { ts: number }) => a.ts - b.ts);
                    
                    setChartData(formattedData);
                    setChartKey(keyToPlot);
                 } else {
                     setChartKey(null); // Data is not numeric, can't plot
                     setChartData([]);
                 }
            }
        }
      } catch (e: any) {
        setError(e.message || 'Failed to fetch device details.');
        console.error(e);
      } finally {
        setIsLoading(false);
        setIsChartLoading(false);
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
            <CardTitle>{chartKey ? `${capitalize(chartKey)} History` : 'Telemetry History'} (Last 24 Hours)</CardTitle>
            <CardDescription>
                {chartKey ? `Visualization of the device's ${chartKey} over time.` : 'A preview of the latest device telemetry.'}
            </CardDescription>
        </CardHeader>
        <CardContent>
            {isChartLoading ? (
                 <Skeleton className="h-[300px] w-full" />
            ) : chartData.length > 0 && chartKey ? (
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="time" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip
                                contentStyle={{ fontSize: '12px', borderRadius: '0.5rem' }}
                                labelStyle={{ fontWeight: 'bold' }}
                            />
                            <Legend />
                            <Line type="monotone" dataKey={chartKey} stroke="#8884d8" strokeWidth={2} dot={false} name={capitalize(chartKey)} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-[300px] border-2 border-dashed rounded-lg">
                    <ChartIcon className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold">No Numeric Telemetry Data Found</h3>
                    <p className="text-muted-foreground text-sm text-center">This device has not reported any plottable numeric data in the last 24 hours.</p>
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
