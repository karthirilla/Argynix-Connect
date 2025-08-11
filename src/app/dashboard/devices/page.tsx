// /app/dashboard/devices/page.tsx
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
import { cn } from '@/lib/utils';
import { getDevices } from '@/lib/api';
import type { Device as AppDevice, ThingsboardDevice } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function DevicesPage() {
  const [devices, setDevices] = useState<AppDevice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('tb_auth_token');
      const instanceUrl = localStorage.getItem('tb_instance_url');
      const customerId = localStorage.getItem('tb_customer_id');

      if (!token || !instanceUrl || !customerId) {
        setError('Authentication details not found.');
        setIsLoading(false);
        return;
      }

      try {
        const tbDevices: ThingsboardDevice[] = await getDevices(token, instanceUrl, customerId);
        const formattedDevices: AppDevice[] = tbDevices.map(d => ({
          id: d.id.id,
          name: d.name,
          type: d.type,
          label: d.label,
          // Status and last activity are not in this API response, using placeholders
          status: 'Active', 
          lastActivity: 'N/A',
        }));
        setDevices(formattedDevices);
      } catch (e) {
        setError('Failed to fetch devices.');
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="container mx-auto">
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Device Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Activity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-[250px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[200px]" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-red-500">{error}</div>;
  }

  return (
    <div className="container mx-auto">
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Device Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Activity</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {devices.map((device) => (
              <TableRow key={device.id}>
                <TableCell className="font-medium">{device.name}</TableCell>
                <TableCell>{device.type}</TableCell>
                <TableCell>
                   <Badge
                    variant={device.status === 'Active' ? 'default' : 'secondary'}
                    className={cn(
                        device.status === 'Active' && 'bg-green-500/20 text-green-700 border-green-500/20 hover:bg-green-500/30',
                        device.status === 'Inactive' && 'bg-gray-500/20 text-gray-700 border-gray-500/20 hover:bg-gray-500/30'
                    )}
                  >
                    {device.status}
                  </Badge>
                </TableCell>
                <TableCell>{device.lastActivity}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
