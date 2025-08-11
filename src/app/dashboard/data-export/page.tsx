
// /app/dashboard/data-export/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { getDevices } from '@/lib/api';
import type { ThingsboardDevice } from '@/lib/types';
import { Download, Loader2, CalendarIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, subDays } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';

type ExportFormat = 'JSON' | 'CSV';

export default function DataExportPage() {
  const [devices, setDevices] = useState<ThingsboardDevice[]>([]);
  const [selectedEntity, setSelectedEntity] = useState<string>('');
  const [keys, setKeys] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 7),
    to: new Date(),
  });
  const [exportFormat, setExportFormat] = useState<ExportFormat>('JSON');
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
        const deviceData = await getDevices(token, instanceUrl, customerId);
        setDevices(deviceData);
      } catch (e) {
        setError('Failed to fetch devices.');
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const convertToCsv = (data: any) => {
    const rows = [];
    const headers = 'timestamp,key,value';
    rows.push(headers);

    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        const series = data[key];
        series.forEach((point: { ts: number; value: any; }) => {
          const formattedTimestamp = new Date(point.ts).toISOString();
          // Escape commas in value
          const value = typeof point.value === 'string' && point.value.includes(',') ? `"${point.value}"` : point.value;
          rows.push(`${formattedTimestamp},${key},${value}`);
        });
      }
    }
    return rows.join('\n');
  }

  const downloadFile = (content: string, fileName: string, contentType: string) => {
    const blob = new Blob([content], { type: contentType });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExport = async () => {
    if (!selectedEntity || !keys || !dateRange?.from || !dateRange?.to) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please select a device, enter timeseries keys, and select a date range.',
      });
      return;
    }

    setIsExporting(true);
    toast({
      title: 'Export Started',
      description: `Fetching telemetry data...`,
    });

    try {
      const token = localStorage.getItem('tb_auth_token');
      const instanceUrl = localStorage.getItem('tb_instance_url');

      if (!token || !instanceUrl) {
        throw new Error('Authentication details not found.');
      }
      
      const startTs = dateRange.from.getTime();
      const endTs = dateRange.to.getTime();
      const encodedKeys = encodeURIComponent(keys);
      
      const apiUrl = `${instanceUrl}/api/plugins/telemetry/DEVICE/${selectedEntity}/values/timeseries?keys=${encodedKeys}&startTs=${startTs}&endTs=${endTs}&limit=50000&agg=NONE`;

      const response = await fetch(apiUrl, {
        headers: { 'X-Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch telemetry data.');
      }
      
      const data = await response.json();
      
      const selectedDevice = devices.find(d => d.id.id === selectedEntity);
      const deviceName = selectedDevice ? selectedDevice.name : 'export';

      if (exportFormat === 'JSON') {
        downloadFile(JSON.stringify(data, null, 2), `${deviceName}_${startTs}_${endTs}.json`, 'application/json');
      } else if (exportFormat === 'CSV') {
        const csvData = convertToCsv(data);
        downloadFile(csvData, `${deviceName}_${startTs}_${endTs}.csv`, 'text/csv');
      }
      
      toast({
        title: 'Export Complete',
        description: `Data has been successfully downloaded.`,
      });

    } catch (e: any) {
       toast({
        variant: 'destructive',
        title: 'Export Failed',
        description: e.message || 'An unexpected error occurred.',
      });
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin" />
        <p>Loading devices...</p>
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
          <CardDescription>Select a device and configure options to export its telemetry data.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor='device-select'>Device</Label>
            <Select onValueChange={setSelectedEntity} value={selectedEntity}>
              <SelectTrigger id="device-select">
                <SelectValue placeholder="Select a device..." />
              </SelectTrigger>
              <SelectContent>
                {devices.map((device) => (
                  <SelectItem key={device.id.id} value={device.id.id}>
                    {device.name} ({device.type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
             <Label htmlFor="keys">Timeseries Keys (comma-separated)</Label>
            <Input id="keys" placeholder="e.g., temperature,humidity,pressure" value={keys} onChange={e => setKeys(e.target.value)} />
          </div>
          
          <div className="space-y-2">
            <Label>Date Range</Label>
             <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date"
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateRange && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "LLL dd, y")} -{" "}
                          {format(dateRange.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(dateRange.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
          </div>

          <div className="space-y-2">
            <Label>Export Format</Label>
            <RadioGroup 
                defaultValue="JSON"
                className="flex items-center space-x-4" 
                value={exportFormat}
                onValueChange={(value: string) => setExportFormat(value as ExportFormat)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="JSON" id="r-json" />
                <Label htmlFor="r-json">JSON</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="CSV" id="r-csv" />
                <Label htmlFor="r-csv">CSV</Label>
              </div>
            </RadioGroup>
          </div>

          <Button onClick={handleExport} disabled={isExporting || !selectedEntity || !keys} className="w-full">
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
