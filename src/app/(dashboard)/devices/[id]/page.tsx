// /app/devices/[id]/page.tsx
"use client";

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { 
    getDeviceById, getDeviceTelemetry, getDeviceTelemetryKeys, 
    getCalculatedFieldsByEntityId, saveCalculatedField, deleteCalculatedField, testScript 
} from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, ArrowLeft, Rss, Calendar as CalendarIcon, Loader2, Cpu, PlusCircle, Pencil, Trash2, PlayCircle, Info } from 'lucide-react';
import { ThingsboardDevice, CalculatedField } from '@/lib/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { subDays, format } from 'date-fns';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Brush } from 'recharts';
import { DateRange } from "react-day-picker"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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

type ActivityStatus = {
  time: string;
  status: 0 | 1; // 0 for Offline, 1 for Online
};

const calculatedFieldSchema = z.object({
  name: z.string().min(1, 'Field name is required.'),
  script: z.string().min(1, 'Script is required.'),
  testTelemetry: z.string().refine((val) => {
    try {
        JSON.parse(val);
        return true;
    } catch {
        return false;
    }
  }, { message: 'Must be valid JSON.' }),
});

type CalculatedFieldFormValues = z.infer<typeof calculatedFieldSchema>;

function CalculatedFieldForm({ device, existingField, onSave, onCancel, isSaving }: { device: ThingsboardDevice, existingField?: CalculatedField, onSave: (data: CalculatedFieldFormValues) => void, onCancel: () => void, isSaving: boolean }) {
    const [testResult, setTestResult] = useState<string | null>(null);
    const [isTesting, setIsTesting] = useState(false);
    const { toast } = useToast();

    const form = useForm<CalculatedFieldFormValues>({
        resolver: zodResolver(calculatedFieldSchema),
        defaultValues: {
            name: existingField?.name || '',
            script: existingField?.script || '',
            testTelemetry: JSON.stringify({ "temperature": 25, "humidity": 60 }, null, 2),
        },
    });

    const handleTestScript = async () => {
        setIsTesting(true);
        setTestResult(null);
        const { script, testTelemetry } = form.getValues();
        try {
            const result = await testScript(script, testTelemetry);
            setTestResult(JSON.stringify(result, null, 2));
            toast({ title: "Test Successful", description: "Script executed without errors." });
        } catch (e: any) {
            setTestResult(`Error: ${e.message}`);
            toast({ variant: 'destructive', title: "Test Failed", description: e.message });
        } finally {
            setIsTesting(false);
        }
    };
    
    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSave)} className="space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem><FormLabel>Field Name</FormLabel><FormControl><Input placeholder="e.g., tempInFahrenheit" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="script" render={({ field }) => (
                    <FormItem><FormLabel>Calculation Script</FormLabel><FormControl><Textarea placeholder="return (msg.temperature * 9/5) + 32;" {...field} className="font-mono h-32" /></FormControl><FormMessage /></FormItem>
                )} />

                <details className="space-y-2 group">
                    <summary className="cursor-pointer text-sm font-medium flex items-center gap-2">Test Script <Info className="h-3 w-3 group-hover:text-primary" /></summary>
                    <div className="space-y-4 p-4 border rounded-md bg-muted/50">
                        <FormField control={form.control} name="testTelemetry" render={({ field }) => (
                            <FormItem><FormLabel>Sample Telemetry (JSON)</FormLabel><FormControl><Textarea {...field} className="font-mono h-24" /></FormControl><FormMessage /></FormItem>
                        )} />
                        <Button type="button" onClick={handleTestScript} disabled={isTesting} variant="outline" size="sm">
                            {isTesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <PlayCircle className="mr-2 h-4 w-4" />}
                            Test
                        </Button>
                        {testResult && (
                             <div><FormLabel>Test Result</FormLabel><pre className="mt-2 text-xs bg-background p-2 rounded-md border">{testResult}</pre></div>
                        )}
                    </div>
                </details>

                <DialogFooter>
                    <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
                    <Button type="submit" disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Field
                    </Button>
                </DialogFooter>
            </form>
        </Form>
    );
}

export default function DeviceDetailsPage() {
  const params = useParams();
  const id = params.id as string;
  const [device, setDevice] = useState<ThingsboardDevice | null>(null);
  const [activityStatus, setActivityStatus] = useState<ActivityStatus[]>([]);
  const [calculatedFields, setCalculatedFields] = useState<CalculatedField[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [isFieldsLoading, setIsFieldsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({ from: subDays(new Date(), 1), to: new Date() });
  const [isFieldDialogOpen, setIsFieldDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState<CalculatedField | undefined>(undefined);
  
  const { toast } = useToast();

  const token = useMemo(() => typeof window !== 'undefined' ? localStorage.getItem('tb_auth_token') : null, []);
  const instanceUrl = useMemo(() => typeof window !== 'undefined' ? localStorage.getItem('tb_instance_url') : null, []);

  const fetchDeviceDetails = useCallback(async () => {
      setIsLoading(true);
      if (!token || !instanceUrl) {
        setError('Authentication details not found.');
        setIsLoading(false);
        return;
      }
      try {
        const deviceData = await getDeviceById(token, instanceUrl, id);
        setDevice(deviceData);
      } catch(e: any) {
        setError(e.message || 'Failed to fetch device details.');
      } finally {
        setIsLoading(false);
      }
  }, [id, token, instanceUrl]);

  const fetchActivityHistory = useCallback(async () => {
    if (!id || !dateRange?.from || !dateRange?.to || !token || !instanceUrl) return;
    setIsHistoryLoading(true);
    try {
        const keys = await getDeviceTelemetryKeys(token, instanceUrl, id);
        if (keys && keys.length > 0) {
            const startTs = dateRange.from.getTime();
            const endTs = dateRange.to.getTime();
            const telemetry = await getDeviceTelemetry(token, instanceUrl, id, keys, startTs, endTs, 50000);
            const statusData = processTelemetryForActivityChart(telemetry, startTs, endTs);
            setActivityStatus(statusData);
        } else {
            setActivityStatus([]);
        }
    } catch(e: any) {
        setError(e.message || 'Failed to fetch activity history.');
    } finally {
        setIsHistoryLoading(false);
    }
  }, [id, dateRange, token, instanceUrl]);

  const fetchCalculatedFields = useCallback(async () => {
      if (!id || !token || !instanceUrl) return;
      setIsFieldsLoading(true);
      try {
          const fields = await getCalculatedFieldsByEntityId(token, instanceUrl, 'DEVICE', id);
          setCalculatedFields(fields);
      } catch (e: any) {
          setError(e.message || 'Failed to fetch calculated fields.');
      } finally {
          setIsFieldsLoading(false);
      }
  }, [id, token, instanceUrl]);

  useEffect(() => {
    if (!id) return;
    fetchDeviceDetails();
    fetchActivityHistory();
    fetchCalculatedFields();
  }, [id, fetchDeviceDetails, fetchActivityHistory, fetchCalculatedFields]);
  
  const processTelemetryForActivityChart = (telemetry: any, startTs: number, endTs: number): ActivityStatus[] => {
      const interval = 5 * 60 * 1000;
      const telemetryTimestamps = new Set<number>();
      for (const key in telemetry) {
        telemetry[key].forEach((item: { ts: number }) => {
            telemetryTimestamps.add(Math.floor(item.ts / interval) * interval);
        });
      }
      const chartData: ActivityStatus[] = [];
      for (let ts = startTs; ts <= endTs; ts += interval) {
        const intervalStart = Math.floor(ts / interval) * interval;
        const status: 0 | 1 = telemetryTimestamps.has(intervalStart) ? 1 : 0;
        chartData.push({
          time: new Date(ts).toLocaleString('en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false }),
          status: status,
        });
      }
      return chartData;
  };
  
  const handleSaveField = async (data: CalculatedFieldFormValues) => {
    if (!token || !instanceUrl || !device) return;
    setIsSaving(true);
    try {
        await saveCalculatedField(token, instanceUrl, {
            id: editingField?.id,
            entityId: device.id,
            name: data.name,
            script: data.script,
        });
        toast({ title: 'Success', description: 'Calculated field saved.' });
        setIsFieldDialogOpen(false);
        setEditingField(undefined);
        fetchCalculatedFields();
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Save Failed', description: e.message });
    } finally {
        setIsSaving(false);
    }
  };

  const handleDeleteField = async (fieldId: string) => {
      if (!token || !instanceUrl) return;
      setIsSaving(true);
      try {
          await deleteCalculatedField(token, instanceUrl, fieldId);
          toast({ title: 'Success', description: 'Calculated field deleted.' });
          fetchCalculatedFields();
      } catch (e: any) {
          toast({ variant: 'destructive', title: 'Delete Failed', description: e.message });
      } finally {
          setIsSaving(false);
      }
  };
  
  const renderLoadingState = () => (
     <div className="container mx-auto">
        <Skeleton className="h-8 w-32 mb-4" />
        <Card><CardHeader><Skeleton className="h-8 w-1/2 mb-2" /><Skeleton className="h-4 w-1/4" /></CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{[...Array(6)].map((_, i) => (<div className="space-y-2" key={i}><Skeleton className="h-4 w-1/3" /><Skeleton className="h-6 w-2/3" /></div>))}</CardContent></Card>
        <Card className="mt-6"><CardHeader><Skeleton className="h-7 w-48" /><Skeleton className="h-4 w-64" /></CardHeader><CardContent><Skeleton className="h-[350px] w-full" /></CardContent></Card>
        <Card className="mt-6"><CardHeader><Skeleton className="h-7 w-48" /></CardHeader><CardContent><Skeleton className="h-24 w-full" /></CardContent></Card>
      </div>
  );

  if (isLoading) return renderLoadingState();
  if (error) return (<div className="container mx-auto"><Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert></div>);
  if (!device) return (<div className="container mx-auto text-center"><p>Device not found.</p></div>)
  
  const DetailItem = ({ label, value }: { label: string; value: string | undefined | null }) => (<div className="space-y-1"><p className="text-sm font-medium text-muted-foreground">{label}</p><p className="text-base font-semibold">{value || 'N/A'}</p></div>);
  const formatTooltip = (value: number) => value === 1 ? 'Online' : 'Offline';

  return (
    <div className="container mx-auto space-y-6">
        <Button asChild variant="outline" size="sm" className="mb-4"><Link href="/devices"><ArrowLeft className="mr-2 h-4 w-4" />Back to Devices</Link></Button>
        <Card><CardHeader><CardTitle>{device.name}</CardTitle><CardDescription><Badge variant="secondary">{device.type}</Badge></CardDescription></CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <DetailItem label="Device ID" value={device.id.id} /><DetailItem label="Label" value={device.label} /><DetailItem label="Created Time" value={new Date(device.createdTime).toLocaleString()} /><DetailItem label="Customer ID" value={device.customerId?.id} /><DetailItem label="Entity Type" value={device.id.entityType} /></CardContent>
        </Card>
        
        <Card><CardHeader><div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"><div className="flex-grow"><CardTitle>Activity Status</CardTitle><CardDescription>A visual representation of the device's online/offline status.</CardDescription></div>
            <div className="flex items-center gap-2">
                <Popover><PopoverTrigger asChild><Button id="date" variant={"outline"} className={cn("w-[260px] justify-start text-left font-normal", !dateRange && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{dateRange?.from ? (dateRange.to ? (<>{format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}</>) : (format(dateRange.from, "LLL dd, y"))) : (<span>Pick a date</span>)}</Button></PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end"><Calendar initialFocus mode="range" defaultMonth={dateRange?.from} selected={dateRange} onSelect={setDateRange} numberOfMonths={2}/></PopoverContent></Popover>
                <Button onClick={fetchActivityHistory} disabled={isHistoryLoading}>{isHistoryLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Fetch Data</Button></div></div></CardHeader>
            <CardContent>{isHistoryLoading ? <Skeleton className="h-[350px] w-full" /> : activityStatus.length > 0 ? (
                <div className="h-[350px] w-full"><ResponsiveContainer width="100%" height="100%"><AreaChart data={activityStatus} margin={{ top: 5, right: 20, left: -10, bottom: 20 }}><defs><linearGradient id="colorStatus" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/><stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="time" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={80} /><YAxis allowDecimals={false} width={30} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} domain={[0, 1]} ticks={[0, 1]} tickFormatter={(value) => value === 1 ? 'Online' : 'Offline'} /><Tooltip formatter={formatTooltip} cursor={{ fill: 'hsl(var(--muted))' }} contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)' }} labelStyle={{ fontWeight: 'bold' }} /><Area type="step" dataKey="status" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorStatus)" /><Brush dataKey="time" height={30} stroke="hsl(var(--primary))" startIndex={activityStatus.length > 100 ? activityStatus.length - 100 : 0} endIndex={activityStatus.length - 1} tickFormatter={() => ''} /></AreaChart></ResponsiveContainer></div>
            ) : (<div className="flex flex-col items-center justify-center h-[350px] border-2 border-dashed rounded-lg"><Rss className="h-12 w-12 text-muted-foreground mb-4" /><h3 className="text-lg font-semibold">No Telemetry Data Found</h3><p className="text-muted-foreground text-sm text-center">This device has not reported any telemetry in the selected time range.</p></div>)}</CardContent>
        </Card>

        <Dialog open={isFieldDialogOpen} onOpenChange={setIsFieldDialogOpen}>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div><CardTitle>Calculated Fields</CardTitle><CardDescription>Create new fields from existing telemetry data using scripts.</CardDescription></div>
                        <DialogTrigger asChild><Button size="sm" onClick={() => setEditingField(undefined)}><PlusCircle className="mr-2 h-4 w-4"/>Add Field</Button></DialogTrigger>
                    </div>
                </CardHeader>
                <CardContent>
                    {isFieldsLoading ? <Skeleton className="h-24 w-full" /> : calculatedFields.length > 0 ? (
                        <div className="space-y-2">
                            {calculatedFields.map(field => (
                                <div key={field.id.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                                    <div><p className="font-semibold">{field.name}</p><p className="text-xs text-muted-foreground font-mono">{field.script}</p></div>
                                    <div className="flex items-center gap-2">
                                        <DialogTrigger asChild>
                                            <Button variant="ghost" size="icon" onClick={() => setEditingField(field)}><Pencil className="h-4 w-4" /></Button>
                                        </DialogTrigger>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                                            <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the calculated field "{field.name}".</AlertDialogDescription></AlertDialogHeader>
                                                <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteField(field.id.id)}>Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed rounded-lg">
                            <Cpu className="h-10 w-10 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold">No Calculated Fields</h3>
                            <p className="text-muted-foreground text-sm">Click "Add Field" to create one.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
            <DialogContent className="sm:max-w-[625px]">
                <DialogHeader><DialogTitle>{editingField ? 'Edit' : 'Create'} Calculated Field</DialogTitle><DialogDescription>Define a new telemetry key based on a script that processes incoming data.</DialogDescription></DialogHeader>
                <CalculatedFieldForm device={device} existingField={editingField} onSave={handleSaveField} onCancel={() => setIsFieldDialogOpen(false)} isSaving={isSaving} />
            </DialogContent>
        </Dialog>
    </div>
  );
}
