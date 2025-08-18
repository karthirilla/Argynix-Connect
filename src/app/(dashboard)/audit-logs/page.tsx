
// /app/(dashboard)/audit-logs/page.tsx
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
import { getAuditLogs } from '@/lib/api';
import type { AppAuditLog, ThingsboardAuditLog } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, History } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';

const actionStatusColors = {
  SUCCESS: 'bg-green-500/20 text-green-700 border-green-500/20',
  FAILURE: 'bg-red-500/20 text-red-700 border-red-500/20',
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AppAuditLog[]>([]);
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
        const tbLogs: ThingsboardAuditLog[] = await getAuditLogs(token, instanceUrl);
        
        const formattedLogs: AppAuditLog[] = tbLogs.map(l => ({
          id: l.id.id,
          createdTime: l.createdTime,
          entityType: l.entityId?.entityType || null,
          entityName: l.actionData?.entityName || l.actionData?.name || null,
          userName: l.userName,
          actionType: l.actionType,
          actionStatus: l.actionStatus,
          failureDetails: l.actionFailureDetails,
        }));
        
        setLogs(formattedLogs);

      } catch (e) {
        setError('Failed to fetch audit logs.');
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="container mx-auto px-0 md:px-4">
        <div className="rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...Array(10)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-[180px]" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-[200px]" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-[100px] rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-[220px]" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-[100px] rounded-full" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
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
  
  if (logs.length === 0) {
     return (
         <div className="container mx-auto px-0 md:px-4 text-center">
            <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg">
                <History className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold">No Audit Logs Found</h3>
                <p className="text-muted-foreground">There are no recorded actions for the selected time period.</p>
            </div>
        </div>
    );
  }

  return (
    <div className="container mx-auto px-0 md:px-4">
        {/* Mobile View */}
        <div className="md:hidden grid gap-4">
            {logs.map((log) => (
                <Card key={log.id}>
                    <CardHeader>
                        <CardTitle className="text-base">
                            <Badge variant="outline" className="mr-2">{log.actionType}</Badge>
                            <Badge className={cn('capitalize', actionStatusColors[log.actionStatus as keyof typeof actionStatusColors])}>
                                {log.actionStatus.toLowerCase()}
                            </Badge>
                        </CardTitle>
                        <CardDescription>
                             {new Date(log.createdTime).toLocaleString()}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                        <div><strong>User:</strong> {log.userName}</div>
                        {log.entityType && <div><strong>Entity:</strong> {log.entityName} ({log.entityType})</div>}
                        {log.failureDetails && <div className="text-destructive"><strong>Failure:</strong> {log.failureDetails}</div>}
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
                        <TableHead>Timestamp</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Entity</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Failure Details</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {logs.map((log) => (
                    <TableRow key={log.id}>
                        <TableCell>{new Date(log.createdTime).toLocaleString()}</TableCell>
                        <TableCell className="font-medium">{log.userName}</TableCell>
                        <TableCell>
                            <Badge variant="outline">{log.actionType}</Badge>
                        </TableCell>
                        <TableCell>{log.entityType ? `${log.entityName} (${log.entityType})` : 'N/A'}</TableCell>
                        <TableCell>
                        <Badge className={cn('capitalize', actionStatusColors[log.actionStatus as keyof typeof actionStatusColors])}>
                            {log.actionStatus.toLowerCase()}
                        </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-destructive">{log.failureDetails}</TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
            </div>
        </div>
    </div>
  );
}
