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
import { Loader2, CalendarIcon, Save, Trash2, AlertCircle, PlusCircle, ChevronsUpDown, Pencil } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Switch } from '@/components/ui/switch';

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
  key: string; // e.g., offlineSchedule_1
  enabled: boolean;
  attributeKey: string;
  attributeValue: string;
  mode: ScheduleMode;
  fireTime?: string; 
  days?: string[];
  time?: string;
}

const MAX_SCHEDULES = 30;

function ScheduleForm({
  device,
  telemetryKeys,
  onSave,
  existingSchedule,
  isSaving
}: {
  device: ThingsboardDevice;
  telemetryKeys: string[];
  onSave: (schedule: Omit<Schedule, 'key' | 'enabled'>) => void;
  existingSchedule?: Omit<Schedule, 'key' | 'enabled'>;
  isSaving: boolean;
}) {
    const [attributeKey, setAttributeKey] = useState(existingSchedule?.attributeKey || '');
    const [attributeValue, setAttributeValue] = useState(existingSchedule?.attributeValue || '');
    const [valueType, setValueType] = useState('Custom');
    
    const [scheduleMode, setScheduleMode] = useState<ScheduleMode>(existingSchedule?.mode || 'particular');
    const [scheduledDate, setScheduledDate] = useState<Date | undefined>(existingSchedule?.fireTime ? parseISO(existingSchedule.fireTime) : undefined);
    const [scheduledTime, setScheduledTime] = useState(existingSchedule?.time || (existingSchedule?.fireTime ? format(parseISO(existingSchedule.fireTime), 'HH:mm') : '00:00'));
    const [recurringDays, setRecurringDays] = useState<string[]>(existingSchedule?.days || []);

    const { toast } = useToast();

    useEffect(() => {
        if (existingSchedule) {
             if (existingSchedule.attributeValue === 'ON' || existingSchedule.attributeValue === 'OFF') {
                setValueType(existingSchedule.attributeValue);
            } else {
                setValueType('Custom');
            }
        }
    }, [existingSchedule])

    const handleSaveClick = () => {
         if (!attributeKey || !attributeValue) {
            toast({ variant: 'destructive', title: 'Missing Information', description: 'Please select an attribute key and value.' });
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

        let newScheduleData: Omit<Schedule, 'key'|'enabled'>;
        
        if (scheduleMode === 'particular') {
            const [hours, minutes] = scheduledTime.split(':').map(Number);
            const fireDateTime = new Date(scheduledDate!);
            fireDateTime.setHours(hours, minutes, 0, 0);

            newScheduleData = {
                attributeKey,
                attributeValue,
                mode: 'particular',
                fireTime: fireDateTime.toISOString(),
            };
        } else { // recurring
            newScheduleData = {
                attributeKey,
                attributeValue,
                mode: 'recurring',
                days: recurringDays,
                time: scheduledTime
            };
        }
        onSave(newScheduleData);
    }
    
    const handleValueTypeChange = (type: string) => {
      setValueType(type);
      if (type === 'ON' || type === 'OFF') {
          setAttributeValue(type);
      } else {
          setAttributeValue('');
      }
    }

    const handleRecurringDayChange = (dayId: string, checked: boolean | string) => {
        setRecurringDays(prev => 
        checked ? [...prev, dayId] : prev.filter(d => d !== dayId)
        );
    }

    return (
        <CardContent className="space-y-6 pt-4">
            <div className="space-y-2">
                <Label htmlFor="attribute-key">Attribute Key</Label>
                <Select onValueChange={setAttributeKey} value={attributeKey}>
                    <SelectTrigger id="attribute-key">
                        <SelectValue placeholder="Select a key..." />
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
            <div className="flex justify-end pt-4">
                <Button onClick={handleSaveClick} disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Save className="mr-2 h-4 w-4" />
                    Save Schedule
                </Button>
            </div>
        </CardContent>
    );
}


export default function OfflineSchedulerPage() {
  const [devices, setDevices] = useState<ThingsboardDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<ThingsboardDevice | null>(null);
  
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  
  const [telemetryKeys, setTelemetryKeys] = useState<string[]>([]);
  const [isKeysLoading, setIsKeysLoading] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null); // To control which accordion is open


  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingSchedules, setIsFetchingSchedules] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
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
  
  const fetchDeviceData = async (deviceId: string) => {
    if (!deviceId) return;
    setIsFetchingSchedules(true);
    setIsKeysLoading(true);
    setEditingKey(null);
    try {
        const token = localStorage.getItem('tb_auth_token');
        const instanceUrl = localStorage.getItem('tb_instance_url');
        if (!token || !instanceUrl) throw new Error("Auth details missing");

        const [attributes, keys] = await Promise.all([
             getDeviceAttributes(token, instanceUrl, deviceId),
             getDeviceTelemetryKeys(token, instanceUrl, deviceId)
        ]);

        const scheduleAttrs = attributes
            .filter(attr => attr.key.startsWith('offlineSchedule_') && typeof attr.value === 'object')
            .map(attr => ({ key: attr.key, ...attr.value } as Schedule))
            .sort((a,b) => {
                const numA = parseInt(a.key.split('_')[1], 10);
                const numB = parseInt(b.key.split('_')[1], 10);
                return numA - numB;
            });
        
        setTelemetryKeys(keys);
        setSchedules(scheduleAttrs);

    } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Could not fetch data for the selected device.'
        });
        setSchedules([]);
        setTelemetryKeys([]);
    } finally {
        setIsFetchingSchedules(false);
        setIsKeysLoading(false);
    }
  }


  const handleDeviceChange = async (deviceId: string) => {
    const device = devices.find(d => d.id.id === deviceId);
    setSelectedDevice(device || null);
    setSchedules([]);
    setTelemetryKeys([]);
    setEditingKey(null);
    if(deviceId) {
        fetchDeviceData(deviceId);
    }
  };
  
  const handleSave = async (scheduleData: Omit<Schedule, 'key'| 'enabled'>, keyToSave?: string) => {
    if (!selectedDevice) return;

    setIsSaving(true);
    
    let scheduleKey = keyToSave;
    if (!scheduleKey) {
        const existingIndexes = schedules.map(s => parseInt(s.key.split('_')[1], 10));
        let nextIndex = 1;
        while(existingIndexes.includes(nextIndex)) {
            nextIndex++;
        }
        if(nextIndex > MAX_SCHEDULES) {
            toast({ variant: 'destructive', title: 'Limit Reached', description: 'Maximum number of schedules reached.' });
            setIsSaving(false);
            return;
        }
        scheduleKey = `offlineSchedule_${nextIndex}`;
    }
    
    const newSchedule: Omit<Schedule, 'key'> = {
        enabled: keyToSave ? (schedules.find(s => s.key === keyToSave)?.enabled ?? true) : true,
        ...scheduleData
    };

    try {
        const token = localStorage.getItem('tb_auth_token');
        const instanceUrl = localStorage.getItem('tb_instance_url');
        if (!token || !instanceUrl) throw new Error("Auth details missing");

        await saveDeviceAttributes(token, instanceUrl, selectedDevice.id.id, { [scheduleKey]: newSchedule });
        
        await fetchDeviceData(selectedDevice.id.id); // Refresh list

        toast({
          title: 'Schedule Saved',
          description: `Schedule has been saved successfully.`,
        });

    } catch (error) {
        toast({ variant: 'destructive', title: 'Save Failed', description: 'Could not save the schedule.' });
    } finally {
        setIsSaving(false);
    }
  };

  const handleDelete = async (scheduleKey: string) => {
    if (!selectedDevice) return;

    setIsSaving(true); // Reuse saving state for delete operation
     try {
        const token = localStorage.getItem('tb_auth_token');
        const instanceUrl = localStorage.getItem('tb_instance_url');
        if (!token || !instanceUrl) throw new Error("Auth details missing");

        await deleteDeviceAttributes(token, instanceUrl, selectedDevice.id.id, [scheduleKey]);
        
        await fetchDeviceData(selectedDevice.id.id);

        toast({
          title: 'Schedule Deleted',
          description: 'The schedule has been successfully deleted.',
        });

    } catch (error) {
        toast({ variant: 'destructive', title: 'Delete Failed', description: 'Could not delete the schedule.' });
    } finally {
        setIsSaving(false);
    }
  }

  const handleToggleEnable = async (schedule: Schedule) => {
    if (!selectedDevice) return;
    
    const updatedSchedule = { ...schedule, enabled: !schedule.enabled };
    // remove key from object before saving
    const { key, ...scheduleToSave } = updatedSchedule;

    setIsSaving(true);
     try {
        const token = localStorage.getItem('tb_auth_token');
        const instanceUrl = localStorage.getItem('tb_instance_url');
        if (!token || !instanceUrl) throw new Error("Auth details missing");

        await saveDeviceAttributes(token, instanceUrl, selectedDevice.id.id, { [key]: scheduleToSave });
        
        await fetchDeviceData(selectedDevice.id.id);

        toast({
          title: 'Schedule Updated',
          description: `Schedule has been ${updatedSchedule.enabled ? 'enabled' : 'disabled'}.`,
        });

    } catch (error) {
        toast({ variant: 'destructive', title: 'Update Failed', description: 'Could not update the schedule status.' });
    } finally {
        setIsSaving(false);
    }
  }
  
  const getScheduleSummary = (schedule: Schedule): string => {
      let summary = `Set ${schedule.attributeKey} to "${schedule.attributeValue}"`;
      if (schedule.mode === 'particular' && schedule.fireTime) {
          summary += ` on ${format(parseISO(schedule.fireTime), 'PPP @ p')}`;
      } else if (schedule.mode === 'recurring' && schedule.days?.length) {
          const dayString = schedule.days.map(d => d.slice(0,2)).join(', ');
          summary += ` on ${dayString} at ${schedule.time}`;
      }
      return summary;
  }

  const renderSchedulesList = () => {
    if (isFetchingSchedules) {
        return <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
    }

    return (
        <div className="space-y-4">
            {schedules.length === 0 && editingKey !== "new-schedule" && (
                <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>No Schedules Found</AlertTitle>
                    <AlertDescription>This device has no offline schedules. You can create one below.</AlertDescription>
                </Alert>
            )}

            <Accordion type="single" collapsible value={editingKey || ""} onValueChange={setEditingKey}>
                 {schedules.map(schedule => (
                    <AccordionItem value={schedule.key} key={schedule.key}>
                        <Card className={cn("overflow-hidden", !schedule.enabled && "bg-muted/50")}>
                             <div className="flex items-center p-2 pr-4">
                                <AccordionTrigger asChild>
                                    <div className="flex flex-1 items-center gap-4 p-2 cursor-pointer rounded-md hover:bg-muted">
                                        <Pencil className="h-4 w-4 text-muted-foreground" />
                                        <div className="flex-grow">
                                            <p className={cn("font-semibold", !schedule.enabled && "text-muted-foreground line-through")}>{getScheduleSummary(schedule)}</p>
                                            <p className="text-xs text-muted-foreground">Status: {schedule.enabled ? "Enabled" : "Disabled"}</p>
                                        </div>
                                    </div>
                                </AccordionTrigger>
                                <div className="flex items-center gap-2 pl-4 border-l ml-2">
                                    <Switch
                                            checked={schedule.enabled}
                                            onCheckedChange={() => handleToggleEnable(schedule)}
                                            disabled={isSaving}
                                    />
                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(schedule.key)} disabled={isSaving}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </div>
                            </div>
                            <AccordionContent>
                            <ScheduleForm
                                    device={selectedDevice!}
                                    telemetryKeys={telemetryKeys}
                                    onSave={(data) => handleSave(data, schedule.key)}
                                    existingSchedule={schedule}
                                    isSaving={isSaving}
                            />
                            </AccordionContent>
                        </Card>
                    </AccordionItem>
                 ))}

                 {schedules.length < MAX_SCHEDULES && (
                    <AccordionItem value="new-schedule" className="border-none mt-4">
                         <div className="text-center">
                            <AccordionTrigger asChild>
                                <Button variant="outline" onClick={() => setEditingKey(editingKey === "new-schedule" ? null : "new-schedule")}>
                                    <PlusCircle className="mr-2" />
                                    Create New Schedule
                                </Button>
                            </AccordionTrigger>
                        </div>
                        <AccordionContent className="mt-4">
                           <Card>
                             <CardHeader>
                                <CardTitle>New Schedule Details</CardTitle>
                             </CardHeader>
                            <ScheduleForm
                                    device={selectedDevice!}
                                    telemetryKeys={telemetryKeys}
                                    onSave={(data) => handleSave(data)}
                                    isSaving={isSaving}
                            />
                           </Card>
                        </AccordionContent>
                    </AccordionItem>
                 )}
            </Accordion>
        </div>
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
          <CardDescription>Queue commands to be sent to a device the next time it comes online. The command will set a server-side attribute to a specific value at a scheduled time.</CardDescription>
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
          <div className="mt-6">
             {selectedDevice ? renderSchedulesList() : (
                 <Alert className="text-center">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Select a Device</AlertTitle>
                    <AlertDescription>
                        Please choose a device from the dropdown to view or manage its offline schedules.
                    </AlertDescription>
                </Alert>
             )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
