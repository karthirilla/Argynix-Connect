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
import { getDevices, getUser, deleteDevice } from '@/lib/api';
import type { Device as AppDevice, ThingsboardUser, EntityData } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Eye, HardDrive, PlusCircle, Search, Trash2, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from '@/hooks/use-toast';


export default function DevicesPage() {
  const [devices, setDevices] = useState<AppDevice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const [currentUser, setCurrentUser] = useState<ThingsboardUser | null>(null);
  const [instanceUrl, setInstanceUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      const token = localStorage.getItem('tb_auth_token');
      const storedInstanceUrl = localStorage.getItem('tb_instance_url');
      

      if (!token || !storedInstanceUrl) {
        setError('Authentication details not found.');
        setIsLoading(false);
        return;
      }
      
      setInstanceUrl(storedInstanceUrl);

      try {
        const [devicesData, userData] = await Promise.all([
          getDevices(token, storedInstanceUrl, localStorage.getItem('tb_customer_id')),
          getUser(token, storedInstanceUrl)
        ]);
        
        setCurrentUser(userData);
        
        const formattedDevices: AppDevice[] = (devicesData || []).map((d: EntityData) => {
            const activeAttr = d.latest.ATTRIBUTE?.active;
            const lastActivityAttr = d.latest.ATTRIBUTE?.lastActivityTime;
            
            return {
                id: d.entityId.id,
                name: d.latest.ENTITY_FIELD.name.value,
                type: d.latest.ENTITY_FIELD.type.value,
                label: d.latest.ENTITY_FIELD.label?.value || null,
                status: activeAttr?.value ? 'Active' : 'Inactive',
                lastActivity: lastActivityAttr ? new Date(lastActivityAttr.value).toLocaleString() : 'N/A'
            };
        });
        
        setDevices(formattedDevices);

      } catch (e: any) {
        setError('Failed to fetch devices or user data.');
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (deviceId: string, deviceName: string) => {
      const token = localStorage.getItem('tb_auth_token');
      if (!token || !instanceUrl) return;

      setIsProcessing(prev => ({...prev, [deviceId]: true}));
      try {
          await deleteDevice(token, instanceUrl, deviceId);
          toast({ title: 'Success', description: `Device "${deviceName}" has been deleted.` });
          await fetchData(); // Refresh data
      } catch(e: any) {
          toast({ variant: 'destructive', title: 'Error', description: e.message || `Failed to delete device.` });
      } finally {
          setIsProcessing(prev => ({...prev, [deviceId]: false}));
      }
  }
  
  const filteredDevices = devices.filter(device => 
    device.name.toLowerCase().includes(filter.toLowerCase()) ||
    device.type.toLowerCase().includes(filter.toLowerCase()) ||
    (device.label && device.label.toLowerCase().includes(filter.toLowerCase()))
  );

  const isAdmin = currentUser?.authority === 'SYS_ADMIN' || currentUser?.authority === 'TENANT_ADMIN';

  if (isLoading) {
    return (
      <div className="container mx-auto px-0 md:px-4">
        {/* Desktop Skeleton */}
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
                    {[...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-[250px]" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-[80px] rounded-full" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-[200px]" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-9 w-[200px]" /></TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
            </div>
        </div>
         {/* Mobile Skeleton */}
        <div className="md:hidden grid gap-4">
             {[...Array(5)].map((_, i) => (
                <Card key={i}>
                    <CardHeader>
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                    <CardContent className="space-y-3">
                         <Skeleton className="h-4 w-full" />
                         <Skeleton className="h-4 w-full" />
                         <div className="flex gap-2 pt-2"><Skeleton className="h-9 w-full" /><Skeleton className="h-9 w-full" /></div>
                    </CardContent>
                </Card>
            ))}
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
  
  if (devices.length === 0 && !isLoading) {
    return (
         <div className="container mx-auto px-0 md:px-4 text-center">
            <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg">
                <HardDrive className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold">No Devices Found</h3>
                <p className="text-muted-foreground">This user has no devices assigned.</p>
                 {isAdmin && instanceUrl && (
                    <Button asChild className="mt-4">
                        <Link href={`${instanceUrl}/devices`} target="_blank">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add Device in ThingsBoard
                        </Link>
                    </Button>
                )}
            </div>
        </div>
    );
  }

  return (
    <div className="container mx-auto px-0 md:px-4 space-y-4">
        <div className="flex justify-between items-center gap-4">
            <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                placeholder="Filter by name, type, or label..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="pl-10"
                />
            </div>
            {isAdmin && instanceUrl && (
                 <Button asChild>
                    <Link href={`${instanceUrl}/devices`} target="_blank">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Device
                    </Link>
                </Button>
            )}
        </div>

       {/* Mobile View */}
      <div className="md:hidden grid gap-4">
        {filteredDevices.map((device) => (
            <Card key={device.id} className="relative">
                 {isProcessing[device.id] && <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10"><Loader2 className="h-6 w-6 animate-spin" /></div>}
                <CardHeader>
                    <CardTitle className="text-base">{device.name}</CardTitle>
                    <CardDescription>{device.type}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                    <div>
                        <strong>Status:</strong>{' '}
                        <Badge
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
                     <div className="flex gap-2 pt-2">
                         <Button asChild variant="outline" size="sm" className="flex-1">
                            <Link href={`/devices/${device.id}`}><Eye className="mr-2 h-4 w-4" />Details</Link>
                         </Button>
                         {isAdmin && (
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive" size="sm" className="flex-1"><Trash2 className="mr-2 h-4 w-4" />Delete</Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the device <span className="font-bold">{device.name}</span>.</AlertDialogDescription></AlertDialogHeader>
                                    <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(device.id, device.name)}>Delete</AlertDialogAction></AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                         )}
                     </div>
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
                {filteredDevices.map((device) => (
                <TableRow key={device.id} className="relative">
                    {isProcessing[device.id] && <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10"><Loader2 className="h-6 w-6 animate-spin" /></div>}
                    <TableCell className="font-medium">{device.name}</TableCell>
                    <TableCell>{device.type}</TableCell>
                    <TableCell>
                    <Badge
                        variant={device.status === 'Active' ? 'default' : 'secondary'}
                        className={cn(
                            'text-xs',
                            device.status === 'Active' && 'bg-green-500/20 text-green-700 border-green-500/20 hover:bg-green-500/30',
                            device.status === 'Inactive' && 'bg-gray-500/20 text-gray-700 border-gray-500/20 hover:bg-gray-500/30'
                        )}
                    >
                        {device.status}
                    </Badge>
                    </TableCell>
                    <TableCell>{device.lastActivity}</TableCell>
                    <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                            <Button asChild variant="outline" size="sm">
                                <Link href={`/devices/${device.id}`}><Eye className="mr-2 h-4 w-4" />View Details</Link>
                            </Button>
                            {isAdmin && (
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" size="sm"><Trash2 className="mr-2 h-4 w-4" />Delete</Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the device <span className="font-bold">{device.name}</span>.</AlertDialogDescription></AlertDialogHeader>
                                        <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(device.id, device.name)}>Delete</AlertDialogAction></AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            )}
                        </div>
                    </TableCell>
                </TableRow>
                ))}
            </TableBody>
            </Table>
        </div>
      </div>
       {filteredDevices.length === 0 && (
            <div className="text-center text-muted-foreground py-10">
                No devices match your filter.
            </div>
        )}
    </div>
  );
}
