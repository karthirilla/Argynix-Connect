
// /app/dashboard/alarms/page.tsx
"use client";

import { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { getAlarms } from '@/lib/api';
import type { Alarm as AppAlarm, ThingsboardAlarm } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

const severityColors = {
  CRITICAL: 'bg-red-500/20 text-red-700 border-red-500/20 hover:bg-red-500/30',
  MAJOR: 'bg-orange-500/20 text-orange-700 border-orange-500/20 hover:bg-orange-500/30',
  MINOR: 'bg-yellow-500/20 text-yellow-700 border-yellow-500/20 hover:bg-yellow-500/30',
  WARNING: 'bg-blue-500/20 text-blue-700 border-blue-500/20 hover:bg-blue-500/30',
  INDETERMINATE: 'bg-gray-500/20 text-gray-700 border-gray-500/20 hover:bg-gray-500/30',
};

const statusColors = {
  ACTIVE_UNACK: 'bg-red-500/80 text-white',
  ACTIVE_ACK: 'bg-orange-500/80 text-white',
  CLEARED_UNACK: 'bg-yellow-500/80 text-black',
  CLEARED_ACK: 'bg-green-500/80 text-white',
};

export default function AlarmsPage() {
  const [alarms, setAlarms] = useState<AppAlarm[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('tb_auth_token');
      const instanceUrl = localStorage.getItem('tb_instance_url');

      if (!token || !instanceUrl) {
        setError('Authentication details not found.');
        setIsLoading(false);
        return;
      }

      try {
        const tbAlarms: ThingsboardAlarm[] = await getAlarms(token, instanceUrl);
        
        const formattedAlarms: AppAlarm[] = tbAlarms.map(a => ({
          id: a.id.id,
          name: a.name,
          severity: a.severity,
          status: a.status,
          originatorName: a.originatorName,
          originatorType: a.originator.entityType,
          createdTime: a.createdTime,
        }));
        
        setAlarms(formattedAlarms);

      } catch (e) {
        setError('Failed to fetch alarms.');
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="container mx-auto">
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Created Time</TableHead>
                <TableHead>Originator</TableHead>
                <TableHead>Alarm Type</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(8)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-[200px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[250px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[200px]" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-[100px] rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-[120px] rounded-full" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
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
  
  if (alarms.length === 0) {
    return <div className="text-center text-muted-foreground">No alarms found.</div>;
  }

  return (
    <div className="container mx-auto">
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Created Time</TableHead>
              <TableHead>Originator</TableHead>
              <TableHead>Alarm Type</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {alarms.map((alarm) => (
              <TableRow key={alarm.id}>
                <TableCell>{new Date(alarm.createdTime).toLocaleString()}</TableCell>
                <TableCell className="font-medium">{alarm.originatorName}</TableCell>
                <TableCell>{alarm.name}</TableCell>
                <TableCell>
                  <Badge className={cn('capitalize', severityColors[alarm.severity])}>
                    {alarm.severity.toLowerCase().replace('_', ' ')}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge className={cn('capitalize', statusColors[alarm.status as keyof typeof statusColors])}>
                     {alarm.status.toLowerCase().replace('_', ' ')}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
