// /src/components/dashboard/dashboards-list.tsx
"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Dashboard, ThingsboardUser } from '@/lib/types';
import { BarChart, LayoutDashboard, Info, Search, Lightbulb, Globe, Trash2, Loader2, Share2 } from 'lucide-react';
import Link from 'next/link';
import { Input } from '../ui/input';
import { SmartExportModal } from './smart-export-modal';
import { useToast } from '@/hooks/use-toast';
import { deleteDashboard, makeDashboardPublic } from '@/lib/api';
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

interface DashboardsListProps {
    dashboards: Dashboard[];
    user: ThingsboardUser | null;
    onDashboardUpdate: () => void;
}

export default function DashboardsList({ dashboards, user, onDashboardUpdate }: DashboardsListProps) {
  const [filter, setFilter] = useState('');
  const [selectedDashboard, setSelectedDashboard] = useState<Dashboard | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  const isAdmin = user?.authority === 'TENANT_ADMIN' || user?.authority === 'SYS_ADMIN';

  const filteredDashboards = dashboards.filter(dashboard => 
    dashboard.name.toLowerCase().includes(filter.toLowerCase())
  );

  const handleSmartExportClick = (dashboard: Dashboard) => {
    setSelectedDashboard(dashboard);
    setIsModalOpen(true);
  };
  
  const handleDelete = async (dashboardId: string) => {
      const token = localStorage.getItem('tb_auth_token');
      const instanceUrl = localStorage.getItem('tb_instance_url');
      if (!token || !instanceUrl) return;

      setIsProcessing(prev => ({ ...prev, [dashboardId]: true }));
      try {
          await deleteDashboard(token, instanceUrl, dashboardId);
          toast({ title: 'Success', description: 'Dashboard deleted successfully.' });
          onDashboardUpdate();
      } catch (error: any) {
          toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to delete dashboard.' });
      } finally {
          setIsProcessing(prev => ({ ...prev, [dashboardId]: false }));
      }
  }

  const handleMakePublic = async (dashboardId: string) => {
      const token = localStorage.getItem('tb_auth_token');
      const instanceUrl = localStorage.getItem('tb_instance_url');
      if (!token || !instanceUrl) return;

      setIsProcessing(prev => ({ ...prev, [dashboardId]: true }));
      try {
          const publicDashboard = await makeDashboardPublic(token, instanceUrl, dashboardId);
          const publicLink = `${instanceUrl}/dashboard/${publicDashboard.publicId}`;
          toast({
              title: 'Dashboard is now Public',
              description: (
                  <div>
                      <span>Public link generated.</span>
                      <Input readOnly value={publicLink} className="mt-2 text-xs" />
                  </div>
              )
          });
          onDashboardUpdate();
      } catch (error: any) {
          toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to make dashboard public.' });
      } finally {
          setIsProcessing(prev => ({ ...prev, [dashboardId]: false }));
      }
  }


  if (dashboards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg">
        <BarChart className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold">No Dashboards Found</h3>
        <p className="text-muted-foreground">This user does not have any dashboards assigned.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
        <div className="flex justify-between items-center">
             <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Filter by name..."
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="pl-10"
                />
            </div>
        </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredDashboards.map((dashboard) => (
          <Card key={dashboard.id} className="flex flex-col hover:shadow-lg transition-shadow relative">
             {isProcessing[dashboard.id] && (
                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-background/50">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
            )}
            <CardHeader>
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="bg-primary/10 p-3 rounded-full">
                            <BarChart className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-grow">
                            <CardTitle className="text-lg">
                                {dashboard.name}
                            </CardTitle>
                        </div>
                    </div>
                     {dashboard.isPublic && <Globe className="h-4 w-4 text-primary" title="This dashboard is public" />}
                </div>
            </CardHeader>
            <CardContent className="flex-grow">
                 <Button variant="secondary" size="sm" className="w-full" onClick={() => handleSmartExportClick(dashboard)}>
                    <Lightbulb className="mr-2 h-4 w-4" />
                    Smart Export
                </Button>
            </CardContent>
            <CardFooter className="grid grid-cols-2 gap-2">
               <Button asChild variant="outline" className="w-full">
                <Link href={`/dashboards/${dashboard.id}`}>
                    <Info className="mr-2 h-4 w-4" />
                    Details
                </Link>
              </Button>
               <Button asChild className="w-full">
                <Link href={`/dashboards/${dashboard.id}/iframe`}>
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  View
                </Link>
              </Button>
            </CardFooter>
            {isAdmin && (
                <CardFooter className="grid grid-cols-2 gap-2 pt-0">
                    <Button variant="outline" size="sm" className="w-full" onClick={() => handleMakePublic(dashboard.id)}>
                        <Share2 className="mr-2 h-4 w-4" />
                        Make Public
                    </Button>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm" className="w-full">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                            </Button>
                        </AlertDialogTrigger>
                         <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the dashboard
                                <span className="font-semibold"> {dashboard.name}</span>.
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(dashboard.id)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </CardFooter>
            )}
          </Card>
        ))}
      </div>
       {filteredDashboards.length === 0 && (
            <div className="text-center text-muted-foreground py-10 col-span-full">
                No dashboards match your filter.
            </div>
        )}
        {selectedDashboard && (
            <SmartExportModal 
                dashboard={selectedDashboard}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        )}
    </div>
  );
}
