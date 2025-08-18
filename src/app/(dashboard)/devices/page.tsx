// /app/devices/page.tsx
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
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { getDevices, getDeviceAttributes } from '@/lib/api';
import type { Device as AppDevice, ThingsboardDevice } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DevicesPage() {
  const [devices, setDevices] = useState<AppDevice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('tb_auth_token');
      const instanceUrl = localStorage.getItem('tb_instance_url');
      const customerId = localStorage.getItem('tb_customer_id');

      if (!token || !instanceUrl) {
        setError('Authentication details not found.');
        setIsLoading(false);
        return;
      }

      try {
        const tbDevices: ThingsboardDevice[] = await getDevices(token, instanceUrl, customerId);
        
        const devicesWithStatus = await Promise.all(tbDevices.map(async (d) => {
            let status = 'Inactive';
            let lastActivity = 'N/A';
            
            try {
                const attributes = await getDeviceAttributes(token, instanceUrl, d.id.id);
                const activeAttr = attributes.find(attr => attr.key === 'active');
                const lastActivityAttr = attributes.find(attr => attr.key === 'lastActivityTime');

                if (activeAttr) {
                    status = activeAttr.value ? 'Active' : 'Inactive';
                }
                if (lastActivityAttr) {
                    lastActivity = new Date(lastActivityAttr.value).toLocaleString();
                }
            } catch (e) {
                console.error(`Failed to get attributes for device ${d.id.id}`, e)
            }

            return {
                id: d.id.id,
                name: d.name,
                type: d.type,
                label: d.label,
                status: status as 'Active' | 'Inactive',
                lastActivity: lastActivity,
            };
        }));
        
        setDevices(devicesWithStatus);

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
      <div className="container mx-auto px-0 md:px-4">
        <div className="rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Device Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Activity</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-[250px]" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-[200px]" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-[120px] float-right" /></TableCell>
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
    return <div className="text-center text-red-500">{error}</div>;
  }
  
  if (devices.length === 0) {
    return <div className="text-center text-muted-foreground">No devices found.</div>;
  }

  return (
    <div className="container mx-auto px-0 md:px-4">
       {/* Mobile View */}
      <div className="md:hidden grid gap-4">
        {devices.map((device) => (
            <Card key={device.id}>
                <CardHeader>
                    <CardTitle className="text-base">{device.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                    <div><strong>Type:</strong> {device.type}</div>
                    <div><strong>Status:</strong>  <Badge
                        variant={device.status === 'Active' ? 'default' : 'secondary'}
                        className={cn('text-xs',
                            device.status === 'Active' && 'bg-green-500/20 text-green-700 border-green-500/20',
                            device.status === 'Inactive' && 'bg-gray-500/20 text-gray-700 border-gray-500/20'
                        )}
                        >
                        {device.status}
                    </Badge>
                    </div>
                    <div><strong>Last Activity:</strong> {device.lastActivity}</div>
                     <Button asChild variant="outline" size="sm" className="w-full mt-2">
                        <Link href={`/devices/${device.id}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                        </Link>
                    </Button>
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
                <TableHead>Device Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Activity</TableHead>
                <TableHead className="text-right">Actions</TableHead>
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
                    <TableCell className="text-right">
                    <Button asChild variant="outline" size="sm">
                        <Link href={`/devices/${device.id}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                        </Link>
                    </Button>
                    </TableCell>
                </TableRow>
                ))}
            </TableBody>
            </Table>
        </div>
      </div>
    </div>
  );
}
