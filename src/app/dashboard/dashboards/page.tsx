// /app/dashboard/dashboards/page.tsx
"use client";

import { useEffect, useState } from 'react';
import DashboardsList from '@/components/dashboard/dashboards-list';
import { getDashboards } from '@/lib/api';
import type { Dashboard as AppDashboard } from '@/lib/types';
import type { ThingsboardDashboard } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardsPage() {
  const [dashboards, setDashboards] = useState<AppDashboard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('tb_auth_token');
      const instanceUrl = localStorage.getItem('tb_instance_url');
      // customerId can be null for tenant admins
      const customerId = localStorage.getItem('tb_customer_id');

      if (!token || !instanceUrl) {
        setError('Authentication details not found.');
        setIsLoading(false);
        return;
      }

      try {
        const tbDashboards: ThingsboardDashboard[] = await getDashboards(token, instanceUrl, customerId);
        const formattedDashboards: AppDashboard[] = tbDashboards.map(d => ({
          id: d.id.id,
          name: d.title,
          // These fields are not in the dashboard API response, so we use placeholders
          type: 'generic', 
          deviceCount: 0,
        }));
        setDashboards(formattedDashboards);
      } catch (e) {
        setError('Failed to fetch dashboards.');
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div class="container mx-auto">
        <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} class="flex flex-col space-y-3">
              <Skeleton class="h-[125px] w-full rounded-xl" />
              <div class="space-y-2">
                <Skeleton class="h-4 w-3/4" />
                <Skeleton class="h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return <div class="text-center text-red-500">{error}</div>;
  }

  return (
    <div class="container mx-auto">
      <DashboardsList dashboards={dashboards} />
    </div>
  );
}
