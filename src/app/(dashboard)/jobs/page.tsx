
// /app/(dashboard)/jobs/page.tsx
"use client";

import { useEffect, useState, useCallback } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { getJobs, deleteJob, cancelJob } from '@/lib/api';
import type { ThingsboardJob } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, ListChecks, Loader2, Play, Pause, Trash2, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';

const statusColors: { [key: string]: string } = {
  PENDING: 'bg-yellow-500/20 text-yellow-700 border-yellow-500/20',
  EXECUTING: 'bg-blue-500/20 text-blue-700 border-blue-500/20',
  SUCCESS: 'bg-green-500/20 text-green-700 border-green-500/20',
  CANCELLED: 'bg-gray-500/20 text-gray-700 border-gray-500/20',
  FAILED: 'bg-red-500/20 text-red-700 border-red-500/20',
};

const statusIcons: { [key: string]: React.ElementType } = {
  PENDING: Clock,
  EXECUTING: Loader2,
  SUCCESS: CheckCircle,
  CANCELLED: XCircle,
  FAILED: AlertCircle,
};

export default function JobsPage() {
  const [jobs, setJobs] = useState<ThingsboardJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchJobs = useCallback(async () => {
    setIsLoading(true);
    const token = localStorage.getItem('tb_auth_token');
    const instanceUrl = localStorage.getItem('tb_instance_url');

    if (!token || !instanceUrl) {
      setError('Authentication details not found.');
      setIsLoading(false);
      return;
    }

    try {
      const jobData = await getJobs(token, instanceUrl);
      setJobs(jobData);
    } catch (e: any) {
      setError(e.message || 'Failed to fetch jobs.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 10000); // Poll every 10 seconds
    return () => clearInterval(interval);
  }, [fetchJobs]);
  
  const handleAction = async (action: 'delete' | 'cancel', jobId: string, jobType: string) => {
      const token = localStorage.getItem('tb_auth_token');
      const instanceUrl = localStorage.getItem('tb_instance_url');
      if (!token || !instanceUrl) return;

      setIsProcessing(prev => ({ ...prev, [jobId]: true }));
      try {
          if (action === 'delete') {
              await deleteJob(token, instanceUrl, jobId);
              toast({ title: 'Success', description: `Job "${jobType}" has been deleted.` });
          } else {
              await cancelJob(token, instanceUrl, jobId);
              toast({ title: 'Success', description: `Job "${jobType}" has been cancelled.` });
          }
          await fetchJobs();
      } catch(e: any) {
          toast({ variant: 'destructive', title: 'Error', description: e.message || `Failed to ${action} job.` });
      } finally {
          setIsProcessing(prev => ({ ...prev, [jobId]: false }));
      }
  }

  const renderLoadingSkeleton = () => (
    <div className="rounded-lg border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Progress</TableHead>
            <TableHead>Created Time</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[...Array(5)].map((_, i) => (
            <TableRow key={i}>
              <TableCell><Skeleton className="h-5 w-32" /></TableCell>
              <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
              <TableCell><Skeleton className="h-4 w-full" /></TableCell>
              <TableCell><Skeleton className="h-5 w-48" /></TableCell>
              <TableCell className="text-right"><Skeleton className="h-9 w-24" /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  if (isLoading && jobs.length === 0) {
    return (
      <div className="container mx-auto px-0 md:px-4 space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Jobs</h1>
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

  return (
    <div className="container mx-auto px-0 md:px-4 space-y-6">
       <div>
            <h1 className="text-3xl font-bold tracking-tight">Jobs</h1>
            <p className="text-muted-foreground">Monitor and manage long-running system tasks.</p>
        </div>
      {jobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg">
          <ListChecks className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold">No Jobs Found</h3>
          <p className="text-muted-foreground">There are no active or recent jobs to display.</p>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Created Time</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map((job) => {
                    const StatusIcon = statusIcons[job.status] || Clock;
                    const progress = job.progress ? (job.progress.processed / job.progress.total) * 100 : 0;

                    return (
                        <TableRow key={job.id.id} className="relative">
                            {isProcessing[job.id.id] && <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10"><Loader2 className="h-6 w-6 animate-spin" /></div>}
                            <TableCell className="font-medium">{job.type.replace(/_/g, ' ')}</TableCell>
                            <TableCell>
                                <Badge className={cn('capitalize', statusColors[job.status])}>
                                    <StatusIcon className={cn('mr-2 h-4 w-4', job.status === 'EXECUTING' && 'animate-spin')} />
                                    {job.status.toLowerCase()}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                {job.status === 'EXECUTING' || job.status === 'PENDING' ? (
                                    <div className="flex items-center gap-2">
                                        <Progress value={progress} className="w-48" />
                                        <span className="text-xs text-muted-foreground">{job.progress ? `${job.progress.processed}/${job.progress.total}`: 'N/A'}</span>
                                    </div>
                                ) : (
                                    job.additionalInfo?.error || 'N/A'
                                )}
                            </TableCell>
                            <TableCell>{new Date(job.createdTime).toLocaleString()}</TableCell>
                            <TableCell className="text-right">
                                <div className="flex gap-2 justify-end">
                                    <Button
                                        variant="destructive" size="sm"
                                        onClick={() => handleAction('delete', job.id.id, job.type)}
                                        disabled={isProcessing[job.id.id]}
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                                    </Button>
                                    {(job.status === 'PENDING' || job.status === 'EXECUTING') && (
                                        <Button
                                            variant="outline" size="sm"
                                            onClick={() => handleAction('cancel', job.id.id, job.type)}
                                            disabled={isProcessing[job.id.id]}
                                        >
                                            <Pause className="mr-2 h-4 w-4" /> Cancel
                                        </Button>
                                    )}
                                </div>
                            </TableCell>
                        </TableRow>
                    );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
