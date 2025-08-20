// /app/alarms/[id]/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getAlarmById } from '@/lib/api';
import type { ThingsboardAlarm } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, ArrowLeft, Clock, Bell, Tag, Shield, Info, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const severityColors = {
  CRITICAL: 'bg-red-500/20 text-red-700 border-red-500/20',
  MAJOR: 'bg-orange-500/20 text-orange-700 border-orange-500/20',
  MINOR: 'bg-yellow-500/20 text-yellow-700 border-yellow-500/20',
  WARNING: 'bg-blue-500/20 text-blue-700 border-blue-500/20',
  INDETERMINATE: 'bg-gray-500/20 text-gray-700 border-gray-500/20',
};

export default function AlarmDetailsPage() {
  const params = useParams();
  const id = params.id as string;
  const [alarm, setAlarm] = useState<ThingsboardAlarm | null>(null);
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
        const alarmData = await getAlarmById(token, instanceUrl, id);
        setAlarm(alarmData);
      } catch (e: any) {
        setError(e.message || 'Failed to fetch alarm details.');
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
            <CardContent className="grid gap-6 md:grid-cols-2">
                 {[...Array(6)].map((_, i) => (
                    <div className="space-y-2" key={i}>
                        <Skeleton className="h-4 w-1/3" />
                        <Skeleton className="h-6 w-2/3" />
                    </div>
                ))}
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
  
  if (!alarm) {
      return (
          <div className="container mx-auto text-center">
              <p>Alarm not found.</p>
          </div>
      )
  }
  
  const DetailItem = ({ icon: Icon, label, value, children }: { icon: React.ElementType; label: string; value?: string | number | null | boolean; children?: React.ReactNode }) => (
    <div className="flex items-start space-x-4">
        <Icon className="h-5 w-5 text-muted-foreground mt-1 flex-shrink-0" />
        <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            {children || <p className="text-base font-semibold">{value === undefined || value === null ? 'N/A' : String(value)}</p>}
        </div>
    </div>
  );

  return (
    <div className="container mx-auto">
        <Button asChild variant="outline" size="sm" className="mb-4">
            <Link href="/alarms">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Alarms
            </Link>
        </Button>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">{alarm.name}</CardTitle>
              <CardDescription>Details for Alarm ID: {alarm.id.id}</CardDescription>
            </div>
            <Badge className={severityColors[alarm.severity]}>{alarm.severity}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <DetailItem icon={Tag} label="Originator Name" value={alarm.originatorName} />
              <DetailItem icon={Info} label="Originator Type" value={alarm.originator.entityType} />
              <DetailItem icon={Shield} label="Status">
                <Badge variant="secondary">{alarm.status.replace('_', ' ')}</Badge>
              </DetailItem>
              <DetailItem icon={Clock} label="Created Time" value={new Date(alarm.createdTime).toLocaleString()} />
              <DetailItem icon={CheckCircle} label="Acknowledged Time" value={alarm.ackTs ? new Date(alarm.ackTs).toLocaleString() : 'Not Acknowledged'} />
              <DetailItem icon={XCircle} label="Cleared Time" value={alarm.clearTs ? new Date(alarm.clearTs).toLocaleString() : 'Not Cleared'} />
            </div>
            <Separator />
            <div className="space-y-4">
                <h4 className="font-medium">Additional Details</h4>
                {alarm.details ? (
                    <pre className="text-xs bg-muted p-4 rounded-md overflow-x-auto">
                        {JSON.stringify(alarm.details, null, 2)}
                    </pre>
                ) : (
                    <p className="text-sm text-muted-foreground">No additional details available for this alarm.</p>
                )}
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
