// /app/(dashboard)/audit-logs/page.tsx
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
import { getAuditLogs, getCustomers, getCustomerUsers, getUser } from '@/lib/api';
import type { AppAuditLog, ThingsboardAuditLog, ThingsboardUser } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, History, Search, Filter, Loader2, Calendar as CalendarIcon } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { DateRange } from 'react-day-picker';
import { subDays, format } from 'date-fns';
import { Label } from '@/components/ui/label';

const actionStatusColors = {
  SUCCESS: 'bg-green-500/20 text-green-700 border-green-500/20',
  FAILURE: 'bg-red-500/20 text-red-700 border-red-500/20',
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AppAuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingUsers, setIsFetchingUsers] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [filter, setFilter] = useState('');
  const [allUsers, setAllUsers] = useState<ThingsboardUser[]>([]);
  const [currentUser, setCurrentUser] = useState<ThingsboardUser | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>('current');
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 1),
    to: new Date(),
  });

  const fetchUsers = useCallback(async (token: string, instanceUrl: string) => {
    setIsFetchingUsers(true);
    try {
        const [customers, currentUserData] = await Promise.all([
            getCustomers(token, instanceUrl),
            getUser(token, instanceUrl)
        ]);

        setCurrentUser(currentUserData);
        setSelectedUserId(currentUserData.id.id);

        let tenantUsers: ThingsboardUser[] = [];
        for (const customer of customers) {
            const customerUsers = await getCustomerUsers(token, instanceUrl, customer.id.id);
            tenantUsers.push(...customerUsers);
        }
        // Add current user if not already in the list (e.g. tenant admin)
        if (!tenantUsers.some(u => u.id.id === currentUserData.id.id)) {
            tenantUsers.unshift(currentUserData);
        }
        setAllUsers(tenantUsers);
    } catch(e) {
        setError("Failed to fetch user list for filtering.");
        console.error(e);
    } finally {
        setIsFetchingUsers(false);
    }
  }, []);

  const fetchLogs = useCallback(async () => {
      setIsLoading(true);
      setError(null);
      const token = localStorage.getItem('tb_auth_token');
      const instanceUrl = localStorage.getItem('tb_instance_url');

      if (!token || !instanceUrl) {
        setError('Authentication details not found.');
        setIsLoading(false);
        return;
      }
      
      if (selectedUserId === 'current' && !currentUser) {
          // Wait for currentUser to be fetched
          setIsLoading(false);
          return;
      }

      try {
        const userIdToFetch = selectedUserId === 'all' 
            ? undefined 
            : (selectedUserId === 'current' ? currentUser?.id.id : selectedUserId);
        
        const tbLogs: ThingsboardAuditLog[] = await getAuditLogs(
            token, 
            instanceUrl,
            dateRange?.from?.getTime(),
            dateRange?.to?.getTime(),
            userIdToFetch
        );
        
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
  }, [dateRange, selectedUserId, currentUser]);

  useEffect(() => {
    const token = localStorage.getItem('tb_auth_token');
    const instanceUrl = localStorage.getItem('tb_instance_url');
    if(token && instanceUrl) {
        fetchUsers(token, instanceUrl);
    } else {
        setError("Authentication details not found.");
        setIsLoading(false);
        setIsFetchingUsers(false);
    }
  }, [fetchUsers]);

  useEffect(() => {
      // Trigger fetchLogs whenever the filters change, or when the currentUser is first loaded.
      fetchLogs();
  }, [fetchLogs, currentUser]);


  const filteredLogs = logs.filter(log =>
    log.userName.toLowerCase().includes(filter.toLowerCase()) ||
    log.actionType.toLowerCase().replace(/_/g, ' ').includes(filter.toLowerCase()) ||
    (log.entityName && log.entityName.toLowerCase().includes(filter.toLowerCase())) ||
    (log.entityType && log.entityType.toLowerCase().replace(/_/g, ' ').includes(filter.toLowerCase()))
  );
  
  const renderLoadingSkeleton = () => (
     <div className="space-y-4">
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
         <div className="md:hidden grid gap-4">
            {[...Array(10)].map((_, i) => (
                <Card key={i}>
                    <CardHeader>
                       <Skeleton className="h-5 w-3/4" />
                       <Skeleton className="h-4 w-1/2 mt-1" />
                    </CardHeader>
                    <CardContent className="space-y-3">
                         <Skeleton className="h-4 w-full" />
                         <Skeleton className="h-4 w-full" />
                    </CardContent>
                </Card>
            ))}
        </div>
      </div>
  )

  const renderContent = () => {
    if (isLoading) {
        return renderLoadingSkeleton();
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
                <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg bg-muted/50">
                    <History className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold">No Audit Logs Found</h3>
                    <p className="text-muted-foreground">There are no recorded actions for the selected criteria.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
             {/* Text Filter for results */}
            <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Filter results by user, action, entity..."
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="pl-10"
                />
            </div>

            {/* Mobile View */}
            <div className="md:hidden grid gap-4">
                {filteredLogs.map((log) => (
                    <Card key={log.id}>
                        <CardHeader>
                            <CardTitle className="text-base">
                                <Badge variant="outline" className="mr-2">{log.actionType.replace(/_/g, ' ')}</Badge>
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
                            {log.entityType && <div><strong>Entity:</strong> {log.entityName} ({log.entityType.replace(/_/g, ' ')})</div>}
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
                        {filteredLogs.map((log) => (
                        <TableRow key={log.id}>
                            <TableCell>{new Date(log.createdTime).toLocaleString()}</TableCell>
                            <TableCell className="font-medium">{log.userName}</TableCell>
                            <TableCell>
                                <Badge variant="outline">{log.actionType.replace(/_/g, ' ')}</Badge>
                            </TableCell>
                            <TableCell>{log.entityType ? `${log.entityName} (${log.entityType.replace(/_/g, ' ')})` : 'N/A'}</TableCell>
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
             {filteredLogs.length === 0 && (
                <div className="text-center text-muted-foreground py-10">
                    No logs match your filter.
                </div>
            )}
        </div>
    )
  }

  return (
    <div className="container mx-auto px-0 md:px-4 space-y-6">
        <Card>
            <CardHeader>
                <CardTitle>Audit Log Filters</CardTitle>
                <CardDescription>Select criteria to search for audit logs.</CardDescription>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                    <Label>User</Label>
                    {isFetchingUsers ? (
                         <Skeleton className="h-10 w-full" />
                    ) : (
                         <Select onValueChange={setSelectedUserId} value={selectedUserId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a user..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={currentUser?.id.id || 'current'}>Current User ({currentUser?.email})</SelectItem>
                                <SelectItem value="all">All Users</SelectItem>
                                {allUsers.map(user => (
                                    <SelectItem key={user.id.id} value={user.id.id}>{user.email}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                </div>
                <div className="space-y-2 lg:col-span-2">
                    <Label>Date Range</Label>
                     <Popover>
                        <PopoverTrigger asChild>
                            <Button id="date" variant={"outline"} className={cn("w-full justify-start text-left font-normal", !dateRange && "text-muted-foreground")}>
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {dateRange?.from ? (dateRange.to ? `${format(dateRange.from, "LLL dd, y")} - ${format(dateRange.to, "LLL dd, y")}` : format(dateRange.from, "LLL dd, y")) : <span>Pick a date range</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start"><Calendar initialFocus mode="range" defaultMonth={dateRange?.from} selected={dateRange} onSelect={setDateRange} numberOfMonths={2}/></PopoverContent>
                    </Popover>
                </div>
            </CardContent>
            <CardFooter>
                 <Button onClick={fetchLogs} disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Filter className="mr-2 h-4 w-4" />}
                    Apply Filters
                </Button>
            </CardFooter>
        </Card>
        
        {renderContent()}
    </div>
  );
}
