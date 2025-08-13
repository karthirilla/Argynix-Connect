// /app/dashboards/[id]/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getDashboardById } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, ArrowLeft, Clock } from 'lucide-react';
import { ThingsboardDashboard } from '@/lib/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function DashboardDetailsPage() {
  const params = useParams();
  const id = params.id as string;
  const [dashboard, setDashboard] = useState<ThingsboardDashboard | null>(null);
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
        const dashboardData = await getDashboardById(token, instanceUrl, id);
        setDashboard(dashboardData);
      } catch (e: any) {
        setError(e.message || 'Failed to fetch dashboard details.');
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
        <Skeleton className="h-8 w-48 mb-4" />
        <Card>
            <CardHeader>
                <Skeleton className="h-8 w-1/2 mb-2" />
                <Skeleton className="h-4 w-1/4" />
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-6 w-2/3" />
                </div>
                 <div className="space-y-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-6 w-2/3" />
                </div>
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
  
  if (!dashboard) {
      return (
          <div className="container mx-auto text-center">
              <p>Dashboard not found.</p>
          </div>
      )
  }
  
  const DetailItem = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string; value: string | undefined | null }) => (
    <div className="flex items-center space-x-3">
        <Icon className="h-5 w-5 text-muted-foreground" />
        <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="text-base font-semibold">{value || 'N/A'}</p>
        </div>
    </div>
  );

  return (
    <div className="container mx-auto">
        <Button asChild variant="outline" size="sm" className="mb-4">
            <Link href="/dashboards">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboards
            </Link>
        </Button>
      <Card>
        <CardHeader>
          <CardTitle>{dashboard.title}</CardTitle>
          <CardDescription>ID: {dashboard.id.id}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <DetailItem 
            icon={Clock} 
            label="Created Time" 
            value={new Date(dashboard.createdTime).toLocaleString()} 
          />
        </CardContent>
      </Card>
    </div>
  );
}
