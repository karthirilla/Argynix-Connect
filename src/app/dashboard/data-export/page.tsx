// /app/dashboard/data-export/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getDevices, getDashboards } from '@/lib/api';
import type { ThingsboardDevice, ThingsboardDashboard } from '@/lib/types';
import { Download, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function DataExportPage() {
  const [entities, setEntities] = useState<(ThingsboardDevice | ThingsboardDashboard)[]>([]);
  const [selectedEntity, setSelectedEntity] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

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
        const [devices, dashboards] = await Promise.all([
          getDevices(token, instanceUrl, customerId),
          getDashboards(token, instanceUrl, customerId)
        ]);
        setEntities([...devices, ...dashboards]);
      } catch (e) {
        setError('Failed to fetch data.');
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleExport = () => {
    if (!selectedEntity) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please select a device or dashboard to export.',
      });
      return;
    }
    setIsExporting(true);
    toast({
      title: 'Export Started',
      description: `Exporting data for the selected entity.`,
    });
    // Placeholder for export logic
    setTimeout(() => {
      setIsExporting(false);
      toast({
        title: 'Export Complete',
        description: `Data has been successfully exported.`,
      });
    }, 2000);
  };
  
  const getEntityName = (entity: ThingsboardDevice | ThingsboardDashboard) => {
    if ('title' in entity) {
      return entity.title;
    }
    return entity.name;
  }

  if (isLoading) {
    return (
      <div className="container mx-auto text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin" />
        <p>Loading devices and dashboards...</p>
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-red-500">{error}</div>;
  }

  return (
    <div className="container mx-auto">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Data Export</CardTitle>
          <CardDescription>Select a device or dashboard to export its data.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select onValueChange={setSelectedEntity} value={selectedEntity}>
            <SelectTrigger>
              <SelectValue placeholder="Select a device or dashboard..." />
            </SelectTrigger>
            <SelectContent>
              {entities.map((entity) => (
                <SelectItem key={entity.id.id} value={entity.id.id}>
                  {getEntityName(entity)} ({entity.id.entityType})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleExport} disabled={isExporting || !selectedEntity} className="w-full">
            {isExporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Export Data
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
