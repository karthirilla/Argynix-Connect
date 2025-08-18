// /app/(dashboard)/scheduler/online/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { getDevices, sendOneWayRpc, scheduleRpc } from '@/lib/api';
import type { ThingsboardDevice } from '@/lib/types';
import { Loader2, CalendarIcon, Send, Clock, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';

type RpcType = 'one-way' | 'two-way';
type ScheduleMode = 'now' | 'future';


export default function OnlineSchedulerPage() {
  const [devices, setDevices] = useState<ThingsboardDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<ThingsboardDevice | null>(null);
  
  const [method, setMethod] = useState('');
  const [params, setParams] = useState('{}');
  const [isJsonValid, setIsJsonValid] = useState(true);

  const [scheduleMode, setScheduleMode] = useState<ScheduleMode>('now');
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(undefined);
  const [scheduledTime, setScheduledTime] = useState('00:00');

  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
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
  
  const handleDeviceChange = (deviceId: string) => {
    const device = devices.find(d => d.id.id === deviceId);
    setSelectedDevice(device || null);
  }

  const validateAndSetParams = (value: string) => {
    setParams(value);
    try {
        JSON.parse(value);
        setIsJsonValid(true);
    } catch (e) {
        setIsJsonValid(false);
    }
  }
  
  const handleSendRpc = async () => {
    if (!selectedDevice || !method) {
      toast({ variant: 'destructive', title: 'Missing Information', description: 'Please select a device and enter a method name.' });
      return;
    }
    if (!isJsonValid) {
        toast({ variant: 'destructive', title: 'Invalid JSON', description: 'The parameters field contains invalid JSON.' });
        return;
    }

    setIsSending(true);

    try {
        const token = localStorage.getItem('tb_auth_token');
        const instanceUrl = localStorage.getItem('tb_instance_url');
        if (!token || !instanceUrl) throw new Error("Auth details missing");

        const paramsObject = JSON.parse(params);
        let scheduleTime: number | undefined = undefined;

        if (scheduleMode === 'future') {
             if (!scheduledDate) {
                toast({ variant: 'destructive', title: 'Missing Date', description: 'Please select a date for the scheduled command.' });
                setIsSending(false);
                return;
            }
            const [hours, minutes] = scheduledTime.split(':').map(Number);
            const fireDateTime = new Date(scheduledDate!);
            fireDateTime.setHours(hours, minutes, 0, 0);
            scheduleTime = fireDateTime.getTime();

            if (scheduleTime < Date.now()) {
                 toast({ variant: 'destructive', title: 'Invalid Date', description: 'Scheduled time cannot be in the past.' });
                 setIsSending(false);
                 return;
            }
        }
        
        if (scheduleTime) {
            await scheduleRpc(token, instanceUrl, selectedDevice.id.id, {
                method,
                params: paramsObject,
                timeout: 5000, // Default 5s timeout
            }, scheduleTime);

             toast({ title: 'RPC Scheduled', description: `Command "${method}" has been scheduled for ${selectedDevice.name}.` });
        } else {
            // Note: For simplicity, this template only implements one-way RPC for instant commands.
            // Two-way RPC requires handling the response, which adds significant complexity.
            await sendOneWayRpc(token, instanceUrl, selectedDevice.id.id, {
                method,
                params: paramsObject,
                timeout: 5000, // Default 5s timeout
            });
            toast({ title: 'RPC Sent', description: `Command "${method}" sent to ${selectedDevice.name}.` });
        }


    } catch (error: any) {
         toast({ variant: 'destructive', title: 'RPC Failed', description: error.message || 'An unknown error occurred.' });
    } finally {
        setIsSending(false);
    }

  }


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
    <div className="container mx-auto px-0 md:px-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Online Command Scheduler</CardTitle>
            <CardDescription>Send real-time RPC (Remote Procedure Call) commands to connected devices.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor='device-select'>Device</Label>
              <Select onValueChange={handleDeviceChange} value={selectedDevice?.id.id || ''}>
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
                <Label htmlFor='rpc-method'>Method Name</Label>
                <Input id="rpc-method" placeholder="e.g., setGpio, getConfig, reboot" value={method} onChange={e => setMethod(e.target.value)} />
            </div>

            <div className="space-y-2">
                <Label htmlFor='rpc-params'>Parameters (JSON)</Label>
                <Textarea 
                    id="rpc-params"
                    placeholder='e.g., {"pin": 7, "value": 1}'
                    value={params}
                    onChange={e => validateAndSetParams(e.target.value)}
                    className={cn(!isJsonValid && "border-destructive focus-visible:ring-destructive")}
                />
                {!isJsonValid && <p className="text-sm text-destructive">Invalid JSON format.</p>}
            </div>
            
             <div className="space-y-4">
                <div className="space-y-2">
                    <Label>Execution Time</Label>
                    <RadioGroup
                        value={scheduleMode}
                        onValueChange={(val) => setScheduleMode(val as ScheduleMode)}
                        className="flex items-center gap-4"
                    >
                        <div className="flex items-center space-x-2">
                        <RadioGroupItem value="now" id="r-now" />
                        <Label htmlFor="r-now" className="font-normal">Send Now</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                        <RadioGroupItem value="future" id="r-future" />
                        <Label htmlFor="r-future" className="font-normal">Schedule for Later</Label>
                        </div>
                    </RadioGroup>
                </div>
                
                {scheduleMode === 'future' && (
                    <div className="grid sm:grid-cols-2 gap-4 animate-in fade-in pl-6 border-l-2 ml-2">
                        <div className="space-y-2">
                            <Label>Scheduled Date</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn( "w-full justify-start text-left font-normal", !scheduledDate && "text-muted-foreground" )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {scheduledDate ? format(scheduledDate, "PPP") : <span>Pick a date</span>}
                                </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={scheduledDate}
                                    onSelect={setScheduledDate}
                                    initialFocus
                                    disabled={(date) => date < new Date(new Date().setDate(new Date().getDate() - 1))}
                                />
                                </PopoverContent>
                            </Popover>
                        </div>
                            <div className="space-y-2">
                            <Label htmlFor="scheduled-time">Scheduled Time</Label>
                            <Input id="scheduled-time" type="time" value={scheduledTime} onChange={e => setScheduledTime(e.target.value)} />
                            </div>
                    </div>
                )}
            </div>

          </CardContent>
           <CardFooter>
                <Button onClick={handleSendRpc} disabled={isSending || !selectedDevice || !method || !isJsonValid} className="w-full">
                    {isSending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {scheduleMode === 'now' ? <Send className="mr-2 h-4 w-4" /> : <Clock className="mr-2 h-4 w-4" />}
                    {scheduleMode === 'now' ? 'Send Command' : 'Schedule Command'}
                </Button>
           </CardFooter>
        </Card>
      </div>
    </div>
  );
}
