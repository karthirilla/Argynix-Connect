// /app/alarms/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { getAlarms, ackAlarm, clearAlarm } from '@/lib/api';
import type { ThingsboardAlarm } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Search, Eye, Check, X, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

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
  const [alarms, setAlarms] = useState<ThingsboardAlarm[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const { toast } = useToast();
  const router = useRouter();
  
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
        setAlarms(tbAlarms);
      } catch (e: any) {
        setError(e.message || 'Failed to fetch alarms.');
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAction = async (action: 'ack' | 'clear', alarmId: string, alarmName: string) => {
      const token = localStorage.getItem('tb_auth_token');
      const instanceUrl = localStorage.getItem('tb_instance_url');
      if (!token || !instanceUrl) return;

      setIsProcessing(prev => ({...prev, [alarmId]: true}));
      try {
          if (action === 'ack') {
              await ackAlarm(token, instanceUrl, alarmId);
              toast({ title: 'Success', description: `Alarm "${alarmName}" has been acknowledged.` });
          } else {
              await clearAlarm(token, instanceUrl, alarmId);
              toast({ title: 'Success', description: `Alarm "${alarmName}" has been cleared.` });
          }
          await fetchData(); // Refresh data
      } catch(e: any) {
          toast({ variant: 'destructive', title: 'Error', description: e.message || `Failed to ${action} alarm.` });
      } finally {
          setIsProcessing(prev => ({...prev, [alarmId]: false}));
      }
  }

  const filteredAlarms = alarms.filter(alarm =>
    alarm.name.toLowerCase().includes(filter.toLowerCase()) ||
    alarm.originatorName.toLowerCase().includes(filter.toLowerCase()) ||
    alarm.severity.toLowerCase().replace('_', ' ').includes(filter.toLowerCase()) ||
    alarm.status.toLowerCase().replace('_', ' ').includes(filter.toLowerCase())
  );

  const renderLoadingSkeleton = () => (
    <div className="space-y-4">
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
                <TableHead className="text-right">Actions</TableHead>
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
                  <TableCell><Skeleton className="h-9 w-[200px] float-right" /></TableCell>
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
                       <div className="flex gap-2 pt-2"><Skeleton className="h-9 w-full" /><Skeleton className="h-9 w-full" /><Skeleton className="h-9 w-full" /></div>
                  </CardContent>
              </Card>
          ))}
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="container mx-auto px-0 md:px-4">
        {renderLoadingSkeleton()}
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
    return (
        <div className="container mx-auto px-0 md:px-4 text-center">
            <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold">No Alarms Found</h3>
                <p className="text-muted-foreground">There are no active or recent alarms to display.</p>
            </div>
        </div>
    );
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
                <Card key={alarm.id.id}>
                     {isProcessing[alarm.id.id] && <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10"><Loader2 className="h-6 w-6 animate-spin" /></div>}
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
                         <div className="flex gap-2 pt-2">
                             <Button asChild variant="outline" size="sm" className="flex-1"><Link href={`/alarms/${alarm.id.id}`}><Eye className="mr-2 h-4 w-4" />Details</Link></Button>
                             <Button size="sm" className="flex-1" onClick={() => handleAction('ack', alarm.id.id, alarm.name)} disabled={!alarm.status.endsWith('_UNACK')}><Check className="mr-2 h-4 w-4" />Ack</Button>
                             <Button size="sm" className="flex-1" onClick={() => handleAction('clear', alarm.id.id, alarm.name)} disabled={!alarm.status.startsWith('ACTIVE')}><X className="mr-2 h-4 w-4" />Clear</Button>
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
                    <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredAlarms.map((alarm) => (
                    <TableRow key={alarm.id.id}>
                        {isProcessing[alarm.id.id] && <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10"><Loader2 className="h-6 w-6 animate-spin" /></div>}
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
                        <TableCell className="text-right">
                           <div className="flex gap-2 justify-end">
                                <Button asChild variant="outline" size="sm"><Link href={`/alarms/${alarm.id.id}`}><Eye className="mr-2 h-4 w-4" />Details</Link></Button>
                                <Button size="sm" onClick={() => handleAction('ack', alarm.id.id, alarm.name)} disabled={!alarm.status.endsWith('_UNACK')}><Check className="mr-2 h-4 w-4" />Acknowledge</Button>
                                <Button size="sm" onClick={() => handleAction('clear', alarm.id.id, alarm.name)} disabled={!alarm.status.startsWith('ACTIVE')}><X className="mr-2 h-4 w-4" />Clear</Button>
                           </div>
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
