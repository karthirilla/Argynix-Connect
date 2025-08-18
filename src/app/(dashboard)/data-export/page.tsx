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
import { getDevices, getDeviceTelemetryKeys } from '@/lib/api';
import type { ThingsboardDevice } from '@/lib/types';
import { Download, Loader2, CalendarIcon, Check, ChevronsUpDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, subDays, setHours, setMinutes, setSeconds } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line, ResponsiveContainer } from 'recharts';

type ExportFormat = 'JSON' | 'CSV' | 'PDF';
type PdfExportType = 'raw' | 'graph';
type ChartDataType = {
    deviceName: string;
    startTs: number;
    endTs: number;
    data: any[];
}


export default function DataExportPage() {
  const [devices, setDevices] = useState<ThingsboardDevice[]>([]);
  const [selectedEntity, setSelectedEntity] = useState<string>('');
  
  const [telemetryKeys, setTelemetryKeys] = useState<string[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [isKeysLoading, setIsKeysLoading] = useState(false);
  const [keysOpen, setKeysOpen] = useState(false);

  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 7),
    to: new Date(),
  });
  const [startTime, setStartTime] = useState('00:00');
  const [endTime, setEndTime] = useState(format(new Date(), 'HH:mm'));

  const [exportFormat, setExportFormat] = useState<ExportFormat>('JSON');
  const [pdfExportType, setPdfExportType] = useState<PdfExportType>('raw');
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  const [chartData, setChartData] = useState<ChartDataType | null>(null);
  const chartRef = createRef<HTMLDivElement>();

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

  useEffect(() => {
    const generatePdf = async () => {
        if (chartData && chartRef.current) {
            // Give react time to render the chart
            setTimeout(async () => {
                const { deviceName, startTs, endTs } = chartData;
                const canvas = await html2canvas(chartRef.current!, { scale: 2 });
                const imgData = canvas.toDataURL('image/png');
                const doc = new jsPDF('landscape', 'px', 'a4');
                const pdfWidth = doc.internal.pageSize.getWidth();
                const pdfHeight = doc.internal.pageSize.getHeight();
                
                const imgProps= doc.getImageProperties(imgData);
                const imgWidth = imgProps.width;
                const imgHeight = imgProps.height;
                
                const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
                const finalWidth = imgWidth * ratio * 0.9;
                const finalHeight = imgHeight * ratio * 0.9;

                const x = (pdfWidth - finalWidth) / 2;
                const y = (pdfHeight - finalHeight) / 2;

                doc.text(`Telemetry Graph for ${deviceName}`, x, y - 10);
                doc.addImage(imgData, 'PNG', x, y, finalWidth, finalHeight);
                doc.save(`${deviceName}_graph_${startTs}_${endTs}.pdf`);

                setChartData(null); // Clear chart data after export
                toast({
                  title: 'Export Complete',
                  description: `Data has been successfully downloaded.`,
                });
                setIsExporting(false);
            }, 500); // 500ms delay to ensure chart is rendered
        }
    };
    generatePdf();
  }, [chartData, chartRef, toast]);


  const handleDeviceChange = async (deviceId: string) => {
    setSelectedEntity(deviceId);
    setSelectedKeys([]); // Reset selected keys
    if (!deviceId) {
        setTelemetryKeys([]);
        return;
    }

    setIsKeysLoading(true);
    try {
        const token = localStorage.getItem('tb_auth_token');
        const instanceUrl = localStorage.getItem('tb_instance_url');
        if (!token || !instanceUrl) throw new Error("Auth details missing");

        const keys = await getDeviceTelemetryKeys(token, instanceUrl, deviceId);
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

  const convertToCsv = (data: any) => {
    const rows = [];
    const headers = 'timestamp,key,value';
    rows.push(headers);

    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        const series = data[key];
        series.forEach((point: { ts: number; value: any; }) => {
          const formattedTimestamp = new Date(point.ts).toISOString();
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
    setIsExporting(false);
    toast({
        title: 'Export Complete',
        description: `Data has been successfully downloaded.`,
    });
  };
  
  const formatDataForChart = (data: any) => {
    const timestamps = new Set<number>();
    const seriesData: { [key: string]: { [ts: number]: any } } = {};

    Object.keys(data).forEach(key => {
        seriesData[key] = {};
        data[key].forEach((point: { ts: number, value: any }) => {
            timestamps.add(point.ts);
            // Ensure value is a number for plotting
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

  const handleExport = async () => {
    if (!selectedEntity || selectedKeys.length === 0 || !dateRange?.from || !dateRange?.to) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please select a device, choose timeseries keys, and select a date range.',
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
      
      const [startHours, startMinutes] = startTime.split(':').map(Number);
      const [endHours, endMinutes] = endTime.split(':').map(Number);

      let fromWithTime = setSeconds(setMinutes(setHours(dateRange.from, startHours), startMinutes), 0);
      let toWithTime = setSeconds(setMinutes(setHours(dateRange.to, endHours), endMinutes), 59);

      const startTs = fromWithTime.getTime();
      const endTs = toWithTime.getTime();
      const encodedKeys = encodeURIComponent(selectedKeys.join(','));
      
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

      if (Object.keys(data).length === 0) {
        toast({
            variant: 'destructive',
            title: 'No Data',
            description: 'No telemetry data found for the selected keys and time range.',
        });
        setIsExporting(false);
        return;
      }


      if (exportFormat === 'JSON') {
        downloadFile(JSON.stringify(data, null, 2), `${deviceName}_${startTs}_${endTs}.json`, 'application/json');
      } else if (exportFormat === 'CSV') {
        const csvData = convertToCsv(data);
        downloadFile(csvData, `${deviceName}_${startTs}_${endTs}.csv`, 'text/csv');
      } else if (exportFormat === 'PDF') {
          if (pdfExportType === 'raw') {
              const doc = new jsPDF();
              doc.text(`Telemetry Data for ${deviceName}`, 14, 15);
              
              const tableData: (string | number)[][] = [];
              for (const key in data) {
                if (Object.prototype.hasOwnProperty.call(data, key)) {
                  const series = data[key];
                  series.forEach((point: { ts: number; value: any; }) => {
                    tableData.push([new Date(point.ts).toLocaleString(), key, point.value]);
                  });
                }
              }
              
              (doc as any).autoTable({
                head: [['Timestamp', 'Key', 'Value']],
                body: tableData,
                startY: 20,
              });
              
              doc.save(`${deviceName}_${startTs}_${endTs}.pdf`);
              setIsExporting(false);
              toast({
                title: 'Export Complete',
                description: `Data has been successfully downloaded.`,
              });

          } else { // 'graph'
            setChartData({
                deviceName,
                startTs,
                endTs,
                data: formatDataForChart(data)
            });
            // The useEffect will handle the PDF generation
          }
      }

    } catch (e: any) {
       toast({
        variant: 'destructive',
        title: 'Export Failed',
        description: e.message || 'An unexpected error occurred.',
      });
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
  
  // Hidden container for rendering the chart for PDF export
  const renderChartForExport = () => (
     <div style={{ position: 'fixed', left: '-9999px', top: 0, width: '1000px', height: '600px', background: 'white' }} ref={chartRef}>
        {chartData?.data && (
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData.data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" angle={-45} textAnchor="end" height={80} tick={{fontSize: 10}} interval="preserveStartEnd" />
                    <YAxis tick={{fontSize: 10}} />
                    <Tooltip />
                    <Legend />
                    {selectedKeys.map(key => (
                        <Line key={key} type="monotone" dataKey={key} stroke={`#${Math.floor(Math.random()*16777215).toString(16)}`} dot={false} connectNulls />
                    ))}
                </LineChart>
            </ResponsiveContainer>
        )}
    </div>
  );

  return (
    <div className="container mx-auto px-0 md:px-4">
      {chartData && renderChartForExport()}
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Data Export</CardTitle>
          <CardDescription>Select a device and configure options to export its telemetry data.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor='device-select'>Device</Label>
            <Select onValueChange={handleDeviceChange} value={selectedEntity}>
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
             <Label htmlFor="keys">Timeseries Keys</Label>
             <Popover open={keysOpen} onOpenChange={setKeysOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={keysOpen}
                        className="w-full justify-between font-normal"
                        disabled={!selectedEntity || isKeysLoading}
                    >
                        <div className="flex-1 text-left">
                            {selectedKeys.length === 0 && "Select keys..."}
                            {selectedKeys.length > 0 && selectedKeys.length <= 2 && selectedKeys.join(', ')}
                            {selectedKeys.length > 2 && `${selectedKeys.length} keys selected`}
                        </div>
                        {isKeysLoading ? <Loader2 className="ml-2 h-4 w-4 animate-spin"/> : <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                    <Command>
                        <CommandInput placeholder="Search keys..." />
                        <CommandList>
                            <CommandEmpty>No keys found.</CommandEmpty>
                            <CommandGroup>
                                {telemetryKeys.map((key) => (
                                <CommandItem
                                    key={key}
                                    value={key}
                                    onSelect={(currentValue) => {
                                        setSelectedKeys(
                                            selectedKeys.includes(currentValue)
                                            ? selectedKeys.filter((k) => k !== currentValue)
                                            : [...selectedKeys, currentValue]
                                        );
                                        setKeysOpen(true)
                                    }}
                                >
                                    <Check
                                    className={cn(
                                        "mr-2 h-4 w-4",
                                        selectedKeys.includes(key) ? "opacity-100" : "opacity-0"
                                    )}
                                    />
                                    {key}
                                </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
            {selectedKeys.length > 0 &&
                <div className="pt-2 flex flex-wrap gap-1">
                    {selectedKeys.map(key => (
                        <Badge key={key} variant="secondary">{key}</Badge>
                    ))}
                </div>
            }
          </div>
          
          <div className="space-y-2">
            <Label>Date and Time Range</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Popover>
                    <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant={"outline"}
                        className={cn(
                        "w-full justify-start text-left font-normal sm:col-span-2",
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
                <div className="space-y-1">
                    <Label htmlFor="start-time" className="text-xs">Start Time</Label>
                    <Input id="start-time" type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
                </div>
                 <div className="space-y-1">
                    <Label htmlFor="end-time" className="text-xs">End Time</Label>
                    <Input id="end-time" type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
                </div>
            </div>
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
               <div className="flex items-center space-x-2">
                <RadioGroupItem value="PDF" id="r-pdf" />
                <Label htmlFor="r-pdf">PDF</Label>
              </div>
            </RadioGroup>
          </div>
          
           {exportFormat === 'PDF' && (
              <div className="space-y-2 pl-4 border-l-2 ml-2">
                <Label>PDF Content</Label>
                <RadioGroup 
                    defaultValue="raw"
                    className="flex items-center space-x-4" 
                    value={pdfExportType}
                    onValueChange={(value: string) => setPdfExportType(value as PdfExportType)}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="raw" id="r-pdf-raw" />
                    <Label htmlFor="r-pdf-raw">Raw Data</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="graph" id="r-pdf-graph" />
                    <Label htmlFor="r-pdf-graph">Graph</Label>
                  </div>
                </RadioGroup>
              </div>
            )}


          <Button onClick={handleExport} disabled={isExporting || !selectedEntity || selectedKeys.length === 0} className="w-full">
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
