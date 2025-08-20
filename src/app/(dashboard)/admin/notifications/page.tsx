
// /app/(dashboard)/admin/notifications/page.tsx
"use client";

import { useEffect, useState, useCallback } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import {
  getNotificationRules,
  getNotificationTemplates,
  saveNotificationRule,
  deleteNotificationRule,
  getUser,
} from '@/lib/api';
import type {
  ThingsboardNotificationRule,
  ThingsboardNotificationTemplate,
  ThingsboardUser,
} from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Loader2, BellRing, Trash2, PlusCircle, Edit, UserCog, Settings, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';


const alarmSeverities = ["CRITICAL", "MAJOR", "MINOR", "WARNING", "INDETERMINATE"];
const alarmStatuses = ["ACTIVE_UNACK", "ACTIVE_ACK", "CLEARED_UNACK", "CLEARED_ACK"];

const ruleFormSchema = z.object({
  name: z.string().min(1, 'Rule name is required'),
  templateId: z.string().min(1, 'Template is required'),
  enabled: z.boolean().default(true),
  triggerConfig: z.object({
    triggerType: z.literal('ALARM'),
    alarmTypes: z.array(z.string()).optional(),
    alarmSeverities: z.array(z.string()).min(1, "At least one severity is required"),
    notifyOn: z.object({
        alarmStatus: z.array(z.string()).min(1, "At least one status is required"),
    })
  })
});

type RuleFormValues = z.infer<typeof ruleFormSchema>;

function RuleFormDialog({
  rule,
  templates,
  onSave,
  currentUser,
}: {
  rule?: ThingsboardNotificationRule;
  templates: ThingsboardNotificationTemplate[];
  onSave: () => void;
  currentUser: ThingsboardUser | null;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<RuleFormValues>({
    resolver: zodResolver(ruleFormSchema),
  });
  
  const { fields: alarmTypeFields, append: appendAlarmType, remove: removeAlarmType } = useFieldArray({
    control: form.control,
    name: "triggerConfig.alarmTypes"
  });

  useEffect(() => {
    if (isOpen) {
        form.reset({
            name: rule?.name || '',
            templateId: rule?.templateId.id || '',
            enabled: rule?.enabled ?? true,
            triggerConfig: {
                triggerType: 'ALARM',
                alarmTypes: rule?.triggerConfig.alarmTypes || [],
                alarmSeverities: rule?.triggerConfig.alarmSeverities || [],
                notifyOn: {
                   alarmStatus: rule?.triggerConfig.notifyOn?.alarmStatus || []
                }
            }
        });
    }
  }, [isOpen, rule, form]);

  const onSubmit = async (data: RuleFormValues) => {
    const token = localStorage.getItem('tb_auth_token');
    const instanceUrl = localStorage.getItem('tb_instance_url');
    if (!token || !instanceUrl || !currentUser) return;

    setIsSaving(true);
    try {
        const ruleToSave: Partial<ThingsboardNotificationRule> = {
            id: rule?.id,
            name: data.name,
            enabled: data.enabled,
            templateId: { entityType: 'NOTIFICATION_TEMPLATE', id: data.templateId },
            triggerType: 'ALARM',
            triggerConfig: {
                ...data.triggerConfig,
                triggerType: 'ALARM',
                alarmTypes: data.triggerConfig.alarmTypes?.filter(t => t.trim() !== '') || null, // API requires null for empty
            },
            recipientsConfig: {
                targets: [currentUser.tenantId.id], // Target current tenant
                triggeringUser: true
            },
        }

        await saveNotificationRule(token, instanceUrl, ruleToSave);
        toast({ title: 'Success', description: `Notification rule "${data.name}" has been saved.` });
        onSave();
        setIsOpen(false);
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Failed to save rule', description: e.message });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {rule ? (
          <Button variant="outline" size="icon" className="h-8 w-8"><Edit className="h-4 w-4" /></Button>
        ) : (
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Rule
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{rule ? 'Edit Rule' : 'Add New Rule'}</DialogTitle>
          <DialogDescription>
            Configure a rule to trigger notifications based on alarm events.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-h-[70vh] overflow-y-auto p-1 pr-4">
            <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Rule Name</FormLabel><FormControl><Input placeholder="e.g., Critical Temperature Alerts" {...field} /></FormControl><FormMessage /></FormItem>)}/>
            
            <FormField control={form.control} name="templateId" render={({ field }) => (
                <FormItem><FormLabel>Notification Template</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select a template..." /></SelectTrigger></FormControl>
                    <SelectContent>{templates.map(t => <SelectItem key={t.id.id} value={t.id.id}>{t.name}</SelectItem>)}</SelectContent>
                </Select><FormMessage /></FormItem>
            )}/>
            
            <FormField control={form.control} name="enabled" render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3"><FormLabel>Rule Enabled</FormLabel><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>
            )}/>

            <div className="space-y-4 rounded-lg border p-4">
                 <h4 className="font-semibold">Trigger Configuration: Alarm</h4>
                 <div className="space-y-2">
                    <FormLabel>Alarm Types (optional)</FormLabel>
                    <p className="text-xs text-muted-foreground">Leave blank to trigger for any alarm type, or specify types like 'High Temperature'.</p>
                    {alarmTypeFields.map((field, index) => (
                        <div key={field.id} className="flex items-center gap-2">
                             <FormField
                                control={form.control}
                                name={`triggerConfig.alarmTypes.${index}`}
                                render={({ field }) => <Input {...field} placeholder="Enter alarm type..."/>}
                             />
                             <Button type="button" variant="destructive" size="icon" onClick={() => removeAlarmType(index)}><X className="h-4 w-4"/></Button>
                        </div>
                    ))}
                     <Button type="button" size="sm" variant="outline" onClick={() => appendAlarmType('')}>Add Alarm Type</Button>
                </div>
                 <FormField control={form.control} name="triggerConfig.alarmSeverities" render={() => (
                    <FormItem>
                        <FormLabel>Alarm Severities</FormLabel>
                        <div className="grid grid-cols-3 gap-2">
                        {alarmSeverities.map((severity) => (
                            <FormField key={severity} control={form.control} name="triggerConfig.alarmSeverities" render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                    <FormControl><Checkbox checked={field.value?.includes(severity)} onCheckedChange={(checked) => {return checked ? field.onChange([...(field.value || []), severity]) : field.onChange(field.value?.filter((value) => value !== severity))}}/></FormControl>
                                    <FormLabel className="font-normal">{severity}</FormLabel>
                                </FormItem>
                            )}/>
                        ))}
                        </div>
                         <FormMessage />
                    </FormItem>
                 )}/>
                 <FormField control={form.control} name="triggerConfig.notifyOn.alarmStatus" render={() => (
                    <FormItem>
                        <FormLabel>Notify On Status</FormLabel>
                         <div className="grid grid-cols-2 gap-2">
                            {alarmStatuses.map((status) => (
                                <FormField key={status} control={form.control} name="triggerConfig.notifyOn.alarmStatus" render={({ field }) => (
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                        <FormControl><Checkbox checked={field.value?.includes(status)} onCheckedChange={(checked) => {return checked ? field.onChange([...(field.value || []), status]) : field.onChange(field.value?.filter((value) => value !== status))}}/></FormControl>
                                        <FormLabel className="font-normal">{status.replace('_', ' ')}</FormLabel>
                                    </FormItem>
                                )}/>
                            ))}
                        </div>
                        <FormMessage />
                    </FormItem>
                 )}/>
            </div>
            
            <DialogFooter className="sticky bottom-0 bg-background pt-4">
              <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Rule
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function NotificationSettingsPage() {
  const [rules, setRules] = useState<ThingsboardNotificationRule[]>([]);
  const [templates, setTemplates] = useState<ThingsboardNotificationTemplate[]>([]);
  const [currentUser, setCurrentUser] = useState<ThingsboardUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const token = localStorage.getItem('tb_auth_token');
    const instanceUrl = localStorage.getItem('tb_instance_url');
    if (!token || !instanceUrl) {
      setError('Authentication details not found.');
      setIsLoading(false);
      return;
    }

    try {
        const [user, rulesData, templatesData] = await Promise.all([
            getUser(token, instanceUrl),
            getNotificationRules(token, instanceUrl),
            getNotificationTemplates(token, instanceUrl)
        ]);
        setCurrentUser(user);

        if (user.authority !== 'TENANT_ADMIN' && user.authority !== 'SYS_ADMIN') {
            setIsLoading(false);
            return;
        }
        
        setRules(rulesData);
        setTemplates(templatesData);
    } catch (e: any) {
        setError(e.message || 'Failed to fetch notification settings.');
    } finally {
        setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDeleteRule = async (ruleId: string) => {
    const token = localStorage.getItem('tb_auth_token');
    const instanceUrl = localStorage.getItem('tb_instance_url');
    if (!token || !instanceUrl) return;

    try {
      await deleteNotificationRule(token, instanceUrl, ruleId);
      toast({ title: 'Success', description: 'Notification rule has been deleted.' });
      await fetchData(); // Refresh list
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Delete Failed', description: e.message || 'Could not delete rule.' });
    }
  };

  if (isLoading) {
    return (
        <div className="space-y-4">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-6 w-96" />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(3)].map((_, i) => (
                    <Card key={i}><CardHeader><Skeleton className="h-6 w-3/4" /><Skeleton className="h-4 w-1/2" /></CardHeader><CardContent className="space-y-4"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-full" /></CardContent></Card>
                ))}
            </div>
      </div>
    );
  }
  
  if (error) {
    return <div className="text-destructive">{error}</div>;
  }
  
  if (currentUser && currentUser.authority !== 'TENANT_ADMIN' && currentUser.authority !== 'SYS_ADMIN') {
    return (
        <div className="container mx-auto px-0 md:px-4">
            <div className="flex flex-col items-center justify-center h-96 border-2 border-dashed rounded-lg">
                <UserCog className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-2xl font-semibold">Permission Denied</h3>
                <p className="text-muted-foreground text-center max-w-md mt-2">
                    You do not have sufficient permissions to manage Notification Settings. This page is available only to Administrators.
                </p>
            </div>
        </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notification Settings</h1>
          <p className="text-muted-foreground">Manage rules that trigger notifications for your tenant.</p>
        </div>
        <RuleFormDialog templates={templates} onSave={fetchData} currentUser={currentUser}/>
      </div>
      {rules.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {rules.map(rule => (
            <Card key={rule.id.id} className="flex flex-col">
              <CardHeader>
                <div className="flex justify-between items-start">
                    <CardTitle className="flex items-center gap-3 text-lg">
                    <BellRing className="h-5 w-5 text-muted-foreground"/> {rule.name}
                    </CardTitle>
                    <Badge variant={rule.enabled ? 'default' : 'secondary'}>{rule.enabled ? 'Enabled' : 'Disabled'}</Badge>
                </div>
                <CardDescription>
                  Template: {templates.find(t => t.id.id === rule.templateId.id)?.name || 'Unknown'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm flex-grow">
                  <p className="font-medium">Triggers on:</p>
                  <ul className="list-disc pl-5 text-muted-foreground">
                      <li>Alarm Severities: {rule.triggerConfig.alarmSeverities?.join(', ') || 'Any'}</li>
                      <li>Alarm Statuses: {rule.triggerConfig.notifyOn?.alarmStatus?.join(', ').replace(/_/g, ' ') || 'Any'}</li>
                      <li>Alarm Types: {rule.triggerConfig.alarmTypes?.join(', ') || 'Any'}</li>
                  </ul>
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <RuleFormDialog rule={rule} templates={templates} onSave={fetchData} currentUser={currentUser}/>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="icon" className="h-8 w-8"><Trash2 className="h-4 w-4" /></Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete the rule "{rule.name}".
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDeleteRule(rule.id.id)}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-96 border-2 border-dashed rounded-lg">
            <BellRing className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-2xl font-semibold">No Notification Rules Found</h3>
            <p className="text-muted-foreground text-center max-w-md mt-2">
                Click "Add Rule" to create your first notification rule.
            </p>
        </div>
      )}
    </div>
  );
}
