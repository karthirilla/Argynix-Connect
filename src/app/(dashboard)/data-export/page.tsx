// /app/data-export/page.tsx
"use client";

import { createRef, useEffect, useState } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import html2canvas from 'html2canvas';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { getDevices, getDeviceTelemetry, getDeviceTelemetryKeys } from '@/lib/api';
import { getSmartDataExportSuggestion } from '@/lib/actions';
import type { ThingsboardDevice } from '@/lib/types';
import type { SmartDataExportOutput } from '@/ai/flows/smart-data-export';
import { Download, Loader2, CalendarIcon, Check, ChevronsUpDown, Lightbulb, BarChart2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, subDays, setHours, setMinutes, setSeconds } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line, ResponsiveContainer } from 'recharts';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type ExportFormat = 'JSON' | 'CSV' | 'PDF';
type PdfExportType = 'raw' | 'graph';
type TelemetryData = { [key: string]: { ts: number; value: any }[] };

export default function DataExportPage() {
  const [devices, setDevices] = useState<ThingsboardDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<ThingsboardDevice | null>(null);
  
  const [telemetryKeys, setTelemetryKeys] = useState<string[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [isKeysLoading, setIsKeysLoading] = useState(false);
  const [keysOpen, setKeysOpen] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 7),
    to: new Date(),
  });
  const [startTime, setStartTime] = useState('00:00');
  const [endTime, setEndTime] = useState('23:59');

  const [exportFormat, setExportFormat] = useState<ExportFormat>('JSON');
  const [pdfExportType, setPdfExportType] = useState<PdfExportType>('raw');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingPreview, setIsFetchingPreview] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  const [previewData, setPreviewData] = useState<any[] | null>(null);
  const [fetchedData, setFetchedData] = useState<TelemetryData | null>(null);
  const chartRef = createRef<HTMLDivElement>();


  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
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

  const handleDeviceChange = async (deviceId: string) => {
    const device = devices.find(d => d.id.id === deviceId);
    setSelectedDevice(device || null);
    
    // Reset everything when device changes
    setSelectedKeys([]);
    setTelemetryKeys([]);
    setPreviewData(null);
    setFetchedData(null);

    if (!device) return;

    setIsKeysLoading(true);
    try {
        const token = localStorage.getItem('tb_auth_token');
        const instanceUrl = localStorage.getItem('tb_instance_url');
        if (!token || !instanceUrl) throw new Error("Auth details missing");

        const keys = await getDeviceTelemetryKeys(token, instanceUrl, device.id.id);
        setTelemetryKeys(keys);
    } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Error fetching keys',
            description: 'Could not fetch telemetry keys for the selected device.'
        });
        setTelemetryKeys([]);
    } finally {
        setIsKeysLoading(false);
    }
  }

  const handleAiSuggest = async () => {
    if (!selectedDevice) return;
    setIsAiLoading(true);
    const result = await getSmartDataExportSuggestion({
        deviceType: selectedDevice.type,
        availableKeys: telemetryKeys,
    });
    if (result.success && result.data) {
        setSelectedKeys(result.data.suggestedFields);
        setExportFormat(result.data.optimalFormat);
        toast({ title: "AI suggestions applied!", description: result.data.reasoning })
    } else {
        toast({ variant: 'destructive', title: "AI Suggestion Failed", description: result.error });
    }
    setIsAiLoading(false);
  }

  const formatDataForChart = (data: TelemetryData) => {
    const timestamps = new Set<number>();
    const seriesData: { [key: string]: { [ts: number]: any } } = {};

    Object.keys(data).forEach(key => {
        seriesData[key] = {};
        data[key].forEach((point: { ts: number, value: any }) => {
            timestamps.add(point.ts);
            const numericValue = parseFloat(point.value);
            seriesData[key][point.ts] = isNaN(numericValue) ? null : numericValue;
        });
    });

    const sortedTimestamps = Array.from(timestamps).sort((a,b) => a - b);
    
    return sortedTimestamps.map(ts => {
        const entry: {[key: string]: any} = {
            timestamp: new Date(ts).toLocaleString()
        };
        Object.keys(seriesData).forEach(key => {
            entry[key] = seriesData[key][ts];
        });
        return entry;
    });
  };

  const handleFetchPreview = async () => {
     if (!selectedDevice || selectedKeys.length === 0 || !dateRange?.from || !dateRange?.to) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please select a device, choose timeseries keys, and select a date range.',
      });
      return;
    }
    setIsFetchingPreview(true);
    setPreviewData(null);
    setFetchedData(null);

    try {
        const token = localStorage.getItem('tb_auth_token');
        const instanceUrl = localStorage.getItem('tb_instance_url');
        if (!token || !instanceUrl) throw new Error('Authentication details not found.');
        
        const [startHours, startMinutes] = startTime.split(':').map(Number);
        const [endHours, endMinutes] = endTime.split(':').map(Number);
        let fromWithTime = setSeconds(setMinutes(setHours(dateRange.from, startHours), startMinutes), 0);
        let toWithTime = setSeconds(setMinutes(setHours(dateRange.to, endHours), endMinutes), 59);

        const data: TelemetryData = await getDeviceTelemetry(token, instanceUrl, selectedDevice.id.id, selectedKeys, fromWithTime.getTime(), toWithTime.getTime());
        
        if (Object.keys(data).length === 0) {
            toast({
                variant: 'destructive',
                title: 'No Data',
                description: 'No telemetry data found for the selected keys and time range.',
            });
            return;
        }

        setFetchedData(data);
        setPreviewData(formatDataForChart(data));

    } catch(e: any) {
        toast({ variant: 'destructive', title: 'Fetch Failed', description: e.message || 'An unexpected error occurred.' });
    } finally {
        setIsFetchingPreview(false);
    }
  }


  const handleExport = async () => {
    if (!fetchedData) {
        toast({ variant: 'destructive', title: 'No data to export', description: 'Please fetch data first before exporting.' });
        return;
    }
    setIsExporting(true);

    const deviceName = selectedDevice?.name || 'export';
    const startTs = dateRange?.from?.getTime() || 0;
    const endTs = dateRange?.to?.getTime() || 0;
    
    try {
        if (exportFormat === 'JSON') {
            downloadFile(JSON.stringify(fetchedData, null, 2), `${deviceName}_${startTs}_${endTs}.json`, 'application/json');
        } else if (exportFormat === 'CSV') {
            const csvData = convertToCsv(fetchedData);
            downloadFile(csvData, `${deviceName}_${startTs}_${endTs}.csv`, 'text/csv');
        } else if (exportFormat === 'PDF') {
            if (pdfExportType === 'raw') {
                exportPdfRaw(fetchedData, deviceName, startTs, endTs);
            } else {
                await exportPdfGraph(deviceName, startTs, endTs);
            }
        }
    } catch(e: any) {
        toast({ variant: 'destructive', title: 'Export Failed', description: e.message || 'An error occurred during export.' });
    } finally {
        setIsExporting(false);
    }
  };

  const convertToCsv = (data: TelemetryData) => {
    const rows = ['timestamp,key,value'];
    for (const key in data) {
        data[key].forEach(point => {
            const formattedTimestamp = new Date(point.ts).toISOString();
            const value = typeof point.value === 'string' && point.value.includes(',') ? `"${point.value}"` : point.value;
            rows.push(`${formattedTimestamp},${key},${value}`);
        });
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
    toast({ title: 'Export Complete', description: `Data has been successfully downloaded.` });
  };
  
  const exportPdfRaw = (data: TelemetryData, deviceName: string, startTs: number, endTs: number) => {
    const doc = new jsPDF();
    doc.text(`Telemetry Data for ${deviceName}`, 14, 15);
    const tableData: (string | number)[][] = [];
    for (const key in data) {
        data[key].forEach(point => {
            tableData.push([new Date(point.ts).toLocaleString(), key, point.value]);
        });
    }
    (doc as any).autoTable({
        head: [['Timestamp', 'Key', 'Value']],
        body: tableData,
        startY: 20,
    });
    doc.save(`${deviceName}_${startTs}_${endTs}.pdf`);
    toast({ title: 'Export Complete', description: `Data has been successfully downloaded.` });
  }

  const exportPdfGraph = async (deviceName: string, startTs: number, endTs: number) => {
    if (!chartRef.current) return;
    const canvas = await html2canvas(chartRef.current, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const doc = new jsPDF('landscape', 'px', 'a4');
    const pdfWidth = doc.internal.pageSize.getWidth();
    const pdfHeight = doc.internal.pageSize.getHeight();
    const imgProps= doc.getImageProperties(imgData);
    const ratio = Math.min(pdfWidth / imgProps.width, pdfHeight / imgProps.height);
    const finalWidth = imgProps.width * ratio * 0.9;
    const finalHeight = imgProps.height * ratio * 0.9;
    const x = (pdfWidth - finalWidth) / 2;
    const y = (pdfHeight - finalHeight) / 2 + 10;
    doc.text(`Telemetry Graph for ${deviceName}`, x, y - 20, { align: 'center' });
    doc.addImage(imgData, 'PNG', x, y, finalWidth, finalHeight);
    doc.save(`${deviceName}_graph_${startTs}_${endTs}.pdf`);
    toast({ title: 'Export Complete', description: `Graph has been successfully downloaded as a PDF.` });
  }

  if (isLoading) {
    return <div className="container mx-auto text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin" /><p>Loading devices...</p></div>;
  }
  if (error) {
    return <div className="container mx-auto text-center text-red-500">{error}</div>;
  }

  const randomColor = () => `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`;

  return (
    <div className="container mx-auto px-0 md:px-4 space-y-6">
        <div className="grid lg:grid-cols-3 gap-6">
            {/* Configuration Card */}
            <Card className="lg:col-span-1 h-fit">
                <CardHeader>
                <CardTitle>Data Export Configuration</CardTitle>
                <CardDescription>Select a device and configure options to export its telemetry data.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Step 1: Device Selection */}
                    <div className="space-y-2">
                        <Label htmlFor='device-select' className="font-semibold">1. Select Device</Label>
                        <Select onValueChange={handleDeviceChange} value={selectedDevice?.id.id}>
                        <SelectTrigger id="device-select"><SelectValue placeholder="Select a device..." /></SelectTrigger>
                        <SelectContent>{devices.map((device) => (<SelectItem key={device.id.id} value={device.id.id}>{device.name} ({device.type})</SelectItem>))}</SelectContent>
                        </Select>
                    </div>
                    
                    {/* Step 2: Data Configuration */}
                    <div className={cn("space-y-4", !selectedDevice && "opacity-50 pointer-events-none")}>
                        <Separator/>
                        <div className="space-y-2">
                            <Label htmlFor="keys" className="font-semibold">2. Configure Data</Label>
                            <Popover open={keysOpen} onOpenChange={setKeysOpen}>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" role="combobox" aria-expanded={keysOpen} className="w-full justify-between font-normal">
                                        <span className="truncate">{selectedKeys.length > 0 ? `${selectedKeys.length} key(s) selected` : "Select keys..."}</span>
                                        {isKeysLoading ? <Loader2 className="ml-2 h-4 w-4 animate-spin"/> : <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                    <Command><CommandInput placeholder="Search keys..." /><CommandList><CommandEmpty>No keys found.</CommandEmpty><CommandGroup>
                                    {telemetryKeys.map((key) => (<CommandItem key={key} value={key} onSelect={(currentValue) => {setSelectedKeys(prev => prev.includes(currentValue) ? prev.filter((k) => k !== currentValue) : [...prev, currentValue]); setKeysOpen(true)}}>
                                    <Check className={cn("mr-2 h-4 w-4", selectedKeys.includes(key) ? "opacity-100" : "opacity-0")}/>{key}</CommandItem>))}
                                    </CommandGroup></CommandList></Command>
                                </PopoverContent>
                            </Popover>
                            {selectedKeys.length > 0 && <div className="pt-2 flex flex-wrap gap-1">{selectedKeys.map(key => (<Badge key={key} variant="secondary">{key}</Badge>))}</div>}
                            
                             <Button onClick={handleAiSuggest} disabled={!selectedDevice || telemetryKeys.length === 0 || isAiLoading} size="sm" variant="outline" className="w-full">
                                <Lightbulb className={cn("mr-2 h-4 w-4", isAiLoading && "animate-pulse text-yellow-400")}/>{isAiLoading ? 'Analyzing...' : 'AI Suggest Keys & Format'}
                            </Button>
                        </div>
                        <div className="space-y-2">
                            <Label>Date and Time Range</Label>
                            <div className="grid grid-cols-1 gap-2">
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button id="date" variant={"outline"} className={cn("w-full justify-start text-left font-normal", !dateRange && "text-muted-foreground")}>
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {dateRange?.from ? (dateRange.to ? `${format(dateRange.from, "LLL dd, y")} - ${format(dateRange.to, "LLL dd, y")}` : format(dateRange.from, "LLL dd, y")) : <span>Pick a date range</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start"><Calendar initialFocus mode="range" defaultMonth={dateRange?.from} selected={dateRange} onSelect={setDateRange} numberOfMonths={2}/></PopoverContent>
                                </Popover>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1"><Label htmlFor="start-time" className="text-xs">Start Time</Label><Input id="start-time" type="time" value={startTime} onChange={e => setStartTime(e.target.value)} /></div>
                                    <div className="space-y-1"><Label htmlFor="end-time" className="text-xs">End Time</Label><Input id="end-time" type="time" value={endTime} onChange={e => setEndTime(e.target.value)} /></div>
                                </div>
                            </div>
                        </div>

                         <Button onClick={handleFetchPreview} disabled={isFetchingPreview || !selectedDevice || selectedKeys.length === 0} className="w-full">
                            {isFetchingPreview ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BarChart2 className="mr-2 h-4 w-4" />}
                            Fetch & Preview Data
                        </Button>
                    </div>
                     {/* Step 3: Export Options */}
                    <div className={cn("space-y-4", !previewData && "opacity-50 pointer-events-none")}>
                         <Separator />
                         <div className="space-y-2">
                            <Label className="font-semibold">3. Export</Label>
                            <RadioGroup value={exportFormat} onValueChange={(v) => setExportFormat(v as ExportFormat)} className="grid grid-cols-3 gap-2">
                                <div><RadioGroupItem value="JSON" id="r-json" className="peer sr-only"/><Label htmlFor="r-json" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">JSON</Label></div>
                                <div><RadioGroupItem value="CSV" id="r-csv" className="peer sr-only"/><Label htmlFor="r-csv" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">CSV</Label></div>
                                <div><RadioGroupItem value="PDF" id="r-pdf" className="peer sr-only"/><Label htmlFor="r-pdf" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">PDF</Label></div>
                            </RadioGroup>
                         </div>
                        {exportFormat === 'PDF' && (
                            <div className="space-y-2 pl-4 border-l-2 ml-2">
                                <Label>PDF Content</Label>
                                <RadioGroup value={pdfExportType} onValueChange={(v) => setPdfExportType(v as PdfExportType)} className="flex items-center space-x-4">
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="raw" id="r-pdf-raw" /><Label htmlFor="r-pdf-raw">Raw Data</Label></div>
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="graph" id="r-pdf-graph" /><Label htmlFor="r-pdf-graph">Graph</Label></div>
                                </RadioGroup>
                            </div>
                        )}
                        <Button onClick={handleExport} disabled={isExporting || !fetchedData} className="w-full">
                            {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                            Export as {exportFormat}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Preview Card */}
            <div className="lg:col-span-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Preview</CardTitle>
                        <CardDescription>A preview of the telemetry data will appear here.</CardDescription>
                    </CardHeader>
                    <CardContent className="min-h-[400px]">
                        {isFetchingPreview ? (
                            <div className="h-[400px] w-full flex items-center justify-center"><Skeleton className="h-full w-full" /></div>
                        ) : previewData ? (
                            <div className="h-[500px] w-full" ref={chartRef}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={previewData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="timestamp" angle={-45} textAnchor="end" height={80} tick={{fontSize: 10}} interval="preserveStartEnd" />
                                        <YAxis tick={{fontSize: 10}} />
                                        <Tooltip contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)' }} />
                                        <Legend />
                                        {selectedKeys.map(key => (
                                            <Line key={key} type="monotone" dataKey={key} stroke={randomColor()} dot={false} connectNulls />
                                        ))}
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                             <div className="flex flex-col items-center justify-center h-[400px] border-2 border-dashed rounded-lg bg-muted/50">
                                <BarChart2 className="h-12 w-12 text-muted-foreground mb-4" />
                                <h3 className="text-lg font-semibold">No Data to Preview</h3>
                                <p className="text-muted-foreground text-sm text-center">Configure your export and click "Fetch & Preview Data".</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    </div>
  );
}
