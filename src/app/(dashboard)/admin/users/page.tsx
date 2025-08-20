
// /app/(dashboard)/admin/users/page.tsx
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
import { getAllUsersBySysAdmin, getUser } from '@/lib/api';
import type { ThingsboardUser } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, UserCog, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function SystemUsersPage() {
  const [users, setUsers] = useState<ThingsboardUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<ThingsboardUser | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const token = localStorage.getItem('tb_auth_token');
      const instanceUrl = localStorage.getItem('tb_instance_url');

      if (!token || !instanceUrl) {
        setError('Authentication details not found.');
        setIsLoading(false);
        return;
      }

      try {
        const user = await getUser(token, instanceUrl);
        setCurrentUser(user);

        if (user.authority !== 'SYS_ADMIN') {
          setIsLoading(false);
          return;
        }

        const usersData = await getAllUsersBySysAdmin(token, instanceUrl);
        setUsers(usersData);
      } catch (e: any) {
        setError(e.message || 'Failed to fetch system users.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Authority</TableHead>
                  <TableHead>Tenant ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...Array(10)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-64" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }
  
  if (currentUser?.authority !== 'SYS_ADMIN') {
    return (
        <div className="flex flex-col items-center justify-center h-96 border-2 border-dashed rounded-lg">
            <UserCog className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-2xl font-semibold">Permission Denied</h3>
            <p className="text-muted-foreground text-center max-w-md mt-2">
                You do not have sufficient permissions to view all system users. This page is available only to System Administrators.
            </p>
        </div>
    );
  }

  return (
    <div className="space-y-6">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">System Users</h1>
            <p className="text-muted-foreground">A read-only list of all users across all tenants in the system.</p>
        </div>
         <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Authority</TableHead>
                    <TableHead>Tenant ID</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {users.map((user) => (
                    <TableRow key={user.id.id}>
                        <TableCell className="font-medium">{user.email}</TableCell>
                        <TableCell>{user.firstName} {user.lastName}</TableCell>
                        <TableCell>
                             <Badge variant={user.authority === 'SYS_ADMIN' ? 'destructive' : (user.authority === 'TENANT_ADMIN' ? 'default' : 'secondary')}>
                                {user.authority.replace('_', ' ')}
                            </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{user.tenantId.id}</TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
            </div>
          </CardContent>
        </Card>
    </div>
  );
}
