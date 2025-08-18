// /app/(dashboard)/scheduler/offline/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { getDevices, getDeviceAttributes, saveDeviceAttributes, deleteDeviceAttributes, getDeviceTelemetryKeys } from '@/lib/api';
import type { ThingsboardDevice } from '@/lib/types';
import { Loader2, CalendarIcon, Save, Trash2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';


type ScheduleMode = 'particular' | 'recurring';

const weekdays = [
  { id: 'SUNDAY', label: 'S' },
  { id: 'MONDAY', label: 'M' },
  { id: 'TUESDAY', label: 'T' },
  { id: 'WEDNESDAY', label: 'W' },
  { id: 'THURSDAY', label: 'T' },
  { id: 'FRIDAY', label: 'F' },
  { id: 'SATURDAY', label: 'S' },
];

interface Schedule {
  attributeKey: string;
  attributeValue: string;
  mode: ScheduleMode;
  // For 'particular' mode
  fireTime?: string; 
  // For 'recurring' mode
  days?: string[];
  time?: string;
}

export default function OfflineSchedulerPage() {
  const [devices, setDevices] = useState<ThingsboardDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  
  const [telemetryKeys, setTelemetryKeys] = useState<string[]>([]);
  const [isKeysLoading, setIsKeysLoading] = useState(false);

  const [attributeKey, setAttributeKey] = useState('');
  const [attributeValue, setAttributeValue] = useState('');
  const [valueType, setValueType] = useState('Custom'); // ON, OFF, Custom
  
  const [scheduleMode, setScheduleMode] = useState<ScheduleMode>('particular');
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>();
  const [scheduledTime, setScheduledTime] = useState('00:00');
  const [recurringDays, setRecurringDays] = useState<string[]>([]);


  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingSchedule, setIsFetchingSchedule] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
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
  
  const resetForm = () => {
    setSchedule(null);
    setAttributeKey('');
    setAttributeValue('');
    setValueType('Custom');
    setScheduleMode('particular');
    setScheduledDate(undefined);
    setScheduledTime('00:00');
    setRecurringDays([]);
  }

  const handleDeviceChange = async (deviceId: string) => {
    setSelectedDevice(deviceId);
    resetForm();
    setTelemetryKeys([]);
    
    if (!deviceId) return;

    setIsFetchingSchedule(true);
    setIsKeysLoading(true);
    try {
        const token = localStorage.getItem('tb_auth_token');
        const instanceUrl = localStorage.getItem('tb_instance_url');
        if (!token || !instanceUrl) throw new Error("Auth details missing");

        // Fetch existing schedule and telemetry keys in parallel
        const [attributes, keys] = await Promise.all([
             getDeviceAttributes(token, instanceUrl, deviceId),
             getDeviceTelemetryKeys(token, instanceUrl, deviceId)
        ]);

        const scheduleAttr = attributes.find(attr => attr.key === 'offlineSchedule');
        setTelemetryKeys(keys);
        
        if (scheduleAttr) {
            const savedSchedule: Schedule = scheduleAttr.value;
            setSchedule(savedSchedule);
            setAttributeKey(savedSchedule.attributeKey);
            setAttributeValue(savedSchedule.attributeValue);
            setScheduleMode(savedSchedule.mode || 'particular');

            if (savedSchedule.attributeValue === 'ON' || savedSchedule.attributeValue === 'OFF') {
                setValueType(savedSchedule.attributeValue);
            } else {
                setValueType('Custom');
            }

            if (savedSchedule.mode === 'recurring') {
              setRecurringDays(savedSchedule.days || []);
              setScheduledTime(savedSchedule.time || '00:00');
            } else {
              const fireDate = savedSchedule.fireTime ? parseISO(savedSchedule.fireTime) : undefined;
              setScheduledDate(fireDate);
              setScheduledTime(fireDate ? format(fireDate, 'HH:mm') : '00:00');
            }
        } else {
            setSchedule(null);
        }

    } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Could not fetch data for the selected device.'
        });
        setSchedule(null);
        setTelemetryKeys([]);
    } finally {
        setIsFetchingSchedule(false);
        setIsKeysLoading(false);
    }
  };
  
  const handleSave = async () => {
    if (!selectedDevice || !attributeKey || !attributeValue) {
        toast({ variant: 'destructive', title: 'Missing Information', description: 'Please select a device, attribute key, and value.' });
        return;
    }
    
    if (scheduleMode === 'particular' && !scheduledDate) {
        toast({ variant: 'destructive', title: 'Missing Information', description: 'Please select a date for the schedule.' });
        return;
    }

     if (scheduleMode === 'recurring' && recurringDays.length === 0) {
        toast({ variant: 'destructive', title: 'Missing Information', description: 'Please select at least one day for the recurring schedule.' });
        return;
    }

    setIsSaving(true);
    
    try {
        const token = localStorage.getItem('tb_auth_token');
        const instanceUrl = localStorage.getItem('tb_instance_url');
        if (!token || !instanceUrl) throw new Error("Auth details missing");
        
        let newSchedule: Schedule;
        
        if (scheduleMode === 'particular') {
            const [hours, minutes] = scheduledTime.split(':').map(Number);
            const fireDateTime = new Date(scheduledDate!);
            fireDateTime.setHours(hours, minutes, 0, 0);

            newSchedule = {
                attributeKey,
                attributeValue,
                mode: 'particular',
                fireTime: fireDateTime.toISOString(),
            };
        } else { // recurring
            newSchedule = {
                attributeKey,
                attributeValue,
                mode: 'recurring',
                days: recurringDays,
                time: scheduledTime
            };
        }

        await saveDeviceAttributes(token, instanceUrl, selectedDevice, { offlineSchedule: newSchedule });
        setSchedule(newSchedule);

        toast({
          title: 'Schedule Saved',
          description: `Schedule for ${attributeKey} has been saved.`,
        });

    } catch (error) {
        toast({ variant: 'destructive', title: 'Save Failed', description: 'Could not save the schedule.' });
    } finally {
        setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedDevice) return;

    setIsDeleting(true);
     try {
        const token = localStorage.getItem('tb_auth_token');
        const instanceUrl = localStorage.getItem('tb_instance_url');
        if (!token || !instanceUrl) throw new Error("Auth details missing");

        await deleteDeviceAttributes(token, instanceUrl, selectedDevice, ['offlineSchedule']);

        resetForm();
        
        toast({
          title: 'Schedule Deleted',
          description: 'The schedule has been successfully deleted.',
        });

    } catch (error) {
        toast({ variant: 'destructive', title: 'Delete Failed', description: 'Could not delete the schedule.' });
    } finally {
        setIsDeleting(false);
    }
  }
  
  const handleValueTypeChange = (type: string) => {
      setValueType(type);
      if (type === 'ON' || type === 'OFF') {
          setAttributeValue(type);
      } else {
          setAttributeValue(''); // Clear it for custom input
      }
  }

  const handleRecurringDayChange = (dayId: string, checked: boolean | string) => {
    setRecurringDays(prev => 
      checked ? [...prev, dayId] : prev.filter(d => d !== dayId)
    );
  }

  const renderContent = () => {
    if (!selectedDevice) {
        return (
             <Alert className="text-center">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Select a Device</AlertTitle>
                <AlertDescription>
                    Please choose a device from the dropdown to view or manage its offline schedule.
                </AlertDescription>
            </Alert>
        )
    }

    if(isFetchingSchedule) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    return (
        <>
          <Card>
            <CardHeader>
                <CardTitle>
                    {schedule ? 'Edit Schedule' : 'Create Schedule'}
                </CardTitle>
                 {!schedule && <CardDescription>No schedule found for this device. Fill out the form below to create one.</CardDescription>}
                 {schedule && <CardDescription>A schedule is currently active for this device.</CardDescription>}
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="attribute-key">Attribute Key</Label>
                    <Select onValueChange={setAttributeKey} value={attributeKey} disabled={isKeysLoading}>
                        <SelectTrigger id="attribute-key">
                            <SelectValue placeholder={isKeysLoading ? "Loading keys..." : "Select a key..."} />
                        </SelectTrigger>
                        <SelectContent>
                            {telemetryKeys.map((key) => (
                            <SelectItem key={key} value={key}>
                                {key}
                            </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <Label htmlFor="attribute-value-type">Value Type</Label>
                        <Select onValueChange={handleValueTypeChange} value={valueType}>
                            <SelectTrigger id="attribute-value-type">
                                <SelectValue placeholder="Select a value type..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ON">ON</SelectItem>
                                <SelectItem value="OFF">OFF</SelectItem>
                                <SelectItem value="Custom">Custom</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    {valueType === 'Custom' && (
                        <div className="space-y-2">
                            <Label htmlFor="attribute-value">Custom Value</Label>
                            <Input 
                                id="attribute-value" 
                                placeholder="Enter custom value" 
                                value={attributeValue} 
                                onChange={e => setAttributeValue(e.target.value)} 
                            />
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                      <Label>Schedule Mode</Label>
                      <RadioGroup
                        value={scheduleMode}
                        onValueChange={(val) => setScheduleMode(val as ScheduleMode)}
                        className="flex items-center gap-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="particular" id="r-particular" />
                          <Label htmlFor="r-particular" className="font-normal">Particular Day</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="recurring" id="r-recurring" />
                          <Label htmlFor="r-recurring" className="font-normal">Recurring</Label>
                        </div>
                      </RadioGroup>
                  </div>
                  
                  {scheduleMode === 'particular' ? (
                      <div className="grid sm:grid-cols-2 gap-4 animate-in fade-in">
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
                                  />
                                  </PopoverContent>
                              </Popover>
                          </div>
                           <div className="space-y-2">
                              <Label htmlFor="scheduled-time">Scheduled Time</Label>
                              <Input id="scheduled-time" type="time" value={scheduledTime} onChange={e => setScheduledTime(e.target.value)} />
                           </div>
                      </div>
                  ) : (
                     <div className="space-y-4 animate-in fade-in">
                          <div className="space-y-2">
                            <Label>Recurring Days</Label>
                            <div className="flex items-center justify-between gap-2 p-2 rounded-lg border">
                              {weekdays.map(day => (
                                <div key={day.id} className="flex flex-col items-center gap-2">
                                  <Label htmlFor={`day-${day.id}`} className="text-xs">{day.label}</Label>
                                  <Checkbox
                                    id={`day-${day.id}`}
                                    checked={recurringDays.includes(day.id)}
                                    onCheckedChange={(checked) => handleRecurringDayChange(day.id, checked)}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="space-y-2 sm:max-w-[50%]">
                              <Label htmlFor="scheduled-time-recurring">Time</Label>
                              <Input id="scheduled-time-recurring" type="time" value={scheduledTime} onChange={e => setScheduledTime(e.target.value)} />
                          </div>
                     </div>
                  )}

                </div>
            </CardContent>
            <CardFooter className="justify-end gap-2">
                {schedule && (
                    <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                        {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                    </Button>
                )}
                 <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Save className="mr-2 h-4 w-4" />
                    Save Schedule
                </Button>
            </CardFooter>
          </Card>
        </>
    )

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
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Offline Command Scheduler</CardTitle>
          <CardDescription>Queue a command to be sent to a device the next time it comes online. The command will set a server-side attribute to a specific value at a scheduled time.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor='device-select'>Device</Label>
            <Select onValueChange={handleDeviceChange} value={selectedDevice}>
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
          <div className="mt-6">
             {renderContent()}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
