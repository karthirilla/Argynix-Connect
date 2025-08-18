// /app/alarms/page.tsx
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
import { AlertCircle, Search } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

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
  const [filter, setFilter] = useState('');

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

  const filteredAlarms = alarms.filter(alarm =>
    alarm.name.toLowerCase().includes(filter.toLowerCase()) ||
    alarm.originatorName.toLowerCase().includes(filter.toLowerCase()) ||
    alarm.severity.toLowerCase().replace('_', ' ').includes(filter.toLowerCase()) ||
    alarm.status.toLowerCase().replace('_', ' ').includes(filter.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="container mx-auto px-0 md:px-4">
        <div className="hidden md:block rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
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
        <div className="md:hidden grid gap-4">
            {[...Array(8)].map((_, i) => (
                <Card key={i}>
                    <CardHeader>
                       <Skeleton className="h-5 w-3/4" />
                    </CardHeader>
                    <CardContent className="space-y-3">
                         <Skeleton className="h-4 w-full" />
                         <Skeleton className="h-4 w-full" />
                         <Skeleton className="h-4 w-full" />
                         <Skeleton className="h-4 w-full" />
                    </CardContent>
                </Card>
            ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
        <div className="container mx-auto px-0 md:px-4">
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
    <div className="container mx-auto px-0 md:px-4 space-y-4">
        <div className="flex justify-between items-center">
            <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Filter by type, originator, severity..."
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="pl-10"
                />
            </div>
        </div>

        {/* Mobile View */}
        <div className="md:hidden grid gap-4">
            {filteredAlarms.map((alarm) => (
                <Card key={alarm.id}>
                    <CardHeader>
                        <CardTitle className="text-base">{alarm.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                        <div><strong>Originator:</strong> {alarm.originatorName}</div>
                        <div><strong>Time:</strong> {new Date(alarm.createdTime).toLocaleString()}</div>
                        <div><strong>Severity:</strong> <Badge className={cn('capitalize text-xs', severityColors[alarm.severity])}>
                                {alarm.severity.toLowerCase().replace('_', ' ')}
                            </Badge>
                        </div>
                        <div><strong>Status:</strong>  <Badge className={cn('capitalize text-xs', statusColors[alarm.status as keyof typeof statusColors])}>
                                {alarm.status.toLowerCase().replace('_', ' ')}
                            </Badge>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>

        {/* Desktop View */}
        <div className="hidden md:block rounded-lg border overflow-hidden">
            <div className="overflow-x-auto">
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
                    {filteredAlarms.map((alarm) => (
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
        {filteredAlarms.length === 0 && (
            <div className="text-center text-muted-foreground py-10">
                No alarms match your filter.
            </div>
        )}
    </div>
  );
}
