// /app/argynix/profile/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { getUser } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, User, Building, Clock, KeyRound } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { ThingsboardUser } from '@/lib/types';


export default function ProfilePage() {
  const [user, setUser] = useState<ThingsboardUser | null>(null);
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
        const userData = await getUser(token, instanceUrl);
        setUser(userData);
      } catch (e: any) {
        setError(e.message || 'Failed to fetch user details.');
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const DetailItem = ({ icon: Icon, label, value, isBadge = false }: { icon: React.ElementType, label: string; value: string | undefined | null, isBadge?: boolean }) => (
    <div className="flex items-start space-x-4">
        <Icon className="h-5 w-5 text-muted-foreground mt-1" />
        <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            {isBadge ? (
                 <Badge variant="secondary">{value || 'N/A'}</Badge>
            ) : (
                <p className="text-base font-semibold">{value || 'N/A'}</p>
            )}
        </div>
    </div>
  );

  if (isLoading) {
    return (
       <div className="container mx-auto">
        <Card>
            <CardHeader>
                <div className="flex items-center space-x-4">
                    <Skeleton className="h-16 w-16 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-4 w-64" />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="flex items-start space-x-4">
                        <Skeleton className="h-6 w-6 rounded" />
                        <div className="w-full space-y-2">
                             <Skeleton className="h-4 w-1/3" />
                             <Skeleton className="h-6 w-2/3" />
                        </div>
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
  
  if (!user) {
      return (
          <div className="container mx-auto text-center">
              <p>User not found.</p>
          </div>
      )
  }

  return (
    <div className="container mx-auto">
      <Card>
        <CardHeader>
            <div className="flex items-center space-x-4">
                <User className="h-16 w-16 text-primary rounded-full bg-primary/10 p-4" />
                 <div>
                    <CardTitle className="text-3xl">{user.firstName || ''} {user.lastName || 'User'}</CardTitle>
                    <CardDescription>{user.email}</CardDescription>
                 </div>
            </div>
        </CardHeader>
        <CardContent className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 pt-6">
          <DetailItem icon={KeyRound} label="Authority" value={user.authority} isBadge />
          <DetailItem icon={Building} label="Tenant ID" value={user.tenantId?.id} />
          <DetailItem icon={Building} label="Customer ID" value={user.customerId?.id} />
          <DetailItem icon={User} label="User ID" value={user.id?.id} />
          <DetailItem icon={Clock} label="Created Time" value={new Date(user.createdTime).toLocaleString()} />
        </CardContent>
      </Card>
    </div>
  );
}
