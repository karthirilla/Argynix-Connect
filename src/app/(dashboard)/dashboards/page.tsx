// /app/dashboards/page.tsx
"use client";

import { useEffect, useState } from 'react';
import DashboardsList from '@/components/dashboard/dashboards-list';
import { getDashboards, getUser } from '@/lib/api';
import type { Dashboard as AppDashboard } from '@/lib/types';
import type { ThingsboardDashboard, ThingsboardUser } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardsPage() {
  const [dashboards, setDashboards] = useState<AppDashboard[]>([]);
  const [user, setUser] = useState<ThingsboardUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        const userData = await getUser(token, instanceUrl);
        setUser(userData);
        
        // Pass the correct customer ID (can be null for tenant admins)
        const tbDashboards = await getDashboards(token, instanceUrl, userData.customerId?.id);

        const formattedDashboards: AppDashboard[] = tbDashboards.map(d => ({
          id: d.id.id,
          name: d.title,
          isPublic: d.public,
          // These fields are not in the dashboard API response, so we use placeholders
          type: 'generic', 
          deviceCount: 0,
        }));
        setDashboards(formattedDashboards);
      } catch (e: any) {
        setError(e.message || 'Failed to fetch dashboards.');
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDashboardUpdate = () => {
    // Re-fetch data after an update (e.g., deletion)
    fetchData();
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-0 md:px-4">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex flex-col space-y-3">
              <Skeleton className="h-[200px] w-full rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-red-500">{error}</div>;
  }

  return (
    <div className="container mx-auto px-0 md:px-4">
      <DashboardsList 
        dashboards={dashboards} 
        user={user} 
        onDashboardUpdate={handleDashboardUpdate}
      />
    </div>
  );
}
