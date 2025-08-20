
// /app/(dashboard)/admin/settings/page.tsx
"use client";

import { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { getAdminSettings, saveAdminSettings, sendTestMail, getSecuritySettings, saveSecuritySettings, getUser } from '@/lib/api';
import type { ThingsboardUser } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Loader2, Mail, Save, ShieldCheck, UserCog } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';

const mailSettingsSchema = z.object({
    host: z.string().min(1, "Host is required"),
    port: z.coerce.number().min(1, "Port is required"),
    username: z.string().min(1, "Username is required"),
    password: z.string(),
    enableTls: z.boolean(),
    timeout: z.coerce.number(),
    protocol: z.string(),
    smtpAuth: z.boolean(),
});
type MailSettingsFormValues = z.infer<typeof mailSettingsSchema>;


const securitySettingsSchema = z.object({
  passwordPolicy_minimumLength: z.coerce.number().min(6, "Must be at least 6"),
  passwordPolicy_minimumUppercaseLetters: z.coerce.number().min(0),
  passwordPolicy_minimumLowercaseLetters: z.coerce.number().min(0),
  passwordPolicy_minimumDigits: z.coerce.number().min(0),
  passwordPolicy_minimumSpecialCharacters: z.coerce.number().min(0),
  passwordPolicy_allowWhitespace: z.boolean(),
});
type SecuritySettingsFormValues = z.infer<typeof securitySettingsSchema>;

const PermissionError = ({ message }: { message: string }) => (
    <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Permission Denied</AlertTitle>
        <AlertDescription>{message}</AlertDescription>
    </Alert>
);

export default function AdminSettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMailSaving, setIsMailSaving] = useState(false);
  const [isSecuritySaving, setIsSecuritySaving] = useState(false);
  const [isTestingMail, setIsTestingMail] = useState(false);
  const { toast } = useToast();
  const [user, setUser] = useState<ThingsboardUser | null>(null);

  const mailForm = useForm<MailSettingsFormValues>({
    resolver: zodResolver(mailSettingsSchema),
    defaultValues: {
      host: '',
      port: 25,
      username: '',
      password: '',
      protocol: 'smtp',
      timeout: 10000,
      enableTls: false,
      smtpAuth: false
    },
  });

  const securityForm = useForm<SecuritySettingsFormValues>({
    resolver: zodResolver(securitySettingsSchema),
    defaultValues: {
      passwordPolicy_minimumLength: 6,
      passwordPolicy_minimumUppercaseLetters: 0,
      passwordPolicy_minimumLowercaseLetters: 0,
      passwordPolicy_minimumDigits: 0,
      passwordPolicy_minimumSpecialCharacters: 0,
      passwordPolicy_allowWhitespace: false,
    }
  });

  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    const token = localStorage.getItem('tb_auth_token');
    const instanceUrl = localStorage.getItem('tb_instance_url');
    if (!token || !instanceUrl) {
      setError('Authentication details not found.');
      setIsLoading(false);
      return;
    }

    try {
        const currentUser = await getUser(token, instanceUrl);
        setUser(currentUser);
        
        // Only Sys Admins can fetch these settings
        if (currentUser.authority !== 'SYS_ADMIN') {
            setIsLoading(false);
            return;
        }

        // Fetch security settings
        const securitySettings = await getSecuritySettings(token, instanceUrl);
        if (securitySettings?.passwordPolicy) {
          securityForm.reset({
              passwordPolicy_minimumLength: securitySettings.passwordPolicy.minimumLength,
              passwordPolicy_minimumUppercaseLetters: securitySettings.passwordPolicy.minimumUppercaseLetters,
              passwordPolicy_minimumLowercaseLetters: securitySettings.passwordPolicy.minimumLowercaseLetters,
              passwordPolicy_minimumDigits: securitySettings.passwordPolicy.minimumDigits,
              passwordPolicy_minimumSpecialCharacters: securitySettings.passwordPolicy.minimumSpecialCharacters,
              passwordPolicy_allowWhitespace: securitySettings.passwordPolicy.allowWhitespace,
          });
        }
        
        // Fetch mail settings
        const mailSettings = await getAdminSettings(token, instanceUrl, 'mail');
        if (mailSettings?.jsonValue) {
            mailForm.reset({
                ...mailSettings.jsonValue,
                port: mailSettings.jsonValue.port || 25,
                timeout: mailSettings.jsonValue.timeout || 10000,
                smtpAuth: String(mailSettings.jsonValue.smtpAuth) === 'true',
                enableTls: String(mailSettings.jsonValue.enableTls) === 'true',
            });
        }
    } catch(e: any) {
        setError(e.message || "Failed to fetch admin settings.");
    } finally {
        setIsLoading(false);
    }
  }, [mailForm, securityForm]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const onMailSubmit = async (data: MailSettingsFormValues) => {
    const token = localStorage.getItem('tb_auth_token');
    const instanceUrl = localStorage.getItem('tb_instance_url');
    if (!token || !instanceUrl) return;

    setIsMailSaving(true);
    try {
      const settingsToSave = {
        key: 'mail',
        jsonValue: {
          ...data,
          smtpAuth: String(data.smtpAuth),
          enableTls: String(data.enableTls),
        }
      }
      await saveAdminSettings(token, instanceUrl, settingsToSave);
      toast({ title: 'Success', description: 'Mail settings saved successfully.' });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error', description: e.message || 'Failed to save mail settings.' });
    } finally {
      setIsMailSaving(false);
    }
  };

  const onSecuritySubmit = async (data: SecuritySettingsFormValues) => {
    const token = localStorage.getItem('tb_auth_token');
    const instanceUrl = localStorage.getItem('tb_instance_url');
    if (!token || !instanceUrl) return;

    setIsSecuritySaving(true);
    try {
      const settingsToSave = {
        passwordPolicy: {
          minimumLength: data.passwordPolicy_minimumLength,
          minimumUppercaseLetters: data.passwordPolicy_minimumUppercaseLetters,
          minimumLowercaseLetters: data.passwordPolicy_minimumLowercaseLetters,
          minimumDigits: data.passwordPolicy_minimumDigits,
          minimumSpecialCharacters: data.passwordPolicy_minimumSpecialCharacters,
          allowWhitespace: data.passwordPolicy_allowWhitespace
        }
      }
      await saveSecuritySettings(token, instanceUrl, settingsToSave);
      toast({ title: 'Success', description: 'Security settings saved successfully.' });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error', description: e.message || 'Failed to save security settings.' });
    } finally {
      setIsSecuritySaving(false);
    }
  };

   const handleSendTestMail = async () => {
        const token = localStorage.getItem('tb_auth_token');
        const instanceUrl = localStorage.getItem('tb_instance_url');
        const userEmail = localStorage.getItem('tb_user');
        if (!token || !instanceUrl || !userEmail) {
            toast({ variant: 'destructive', title: 'Error', description: 'Cannot send test email. User details not found.' });
            return;
        }

        setIsTestingMail(true);
        try {
            const currentMailSettings = mailForm.getValues();
             const settingsToTest = {
                key: 'mail',
                jsonValue: {
                    ...currentMailSettings,
                    smtpAuth: String(currentMailSettings.smtpAuth),
                    enableTls: String(currentMailSettings.enableTls),
                }
            };
            await sendTestMail(token, instanceUrl, userEmail, settingsToTest);
            toast({ title: 'Success', description: `Test email sent to ${userEmail}.` });
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Error', description: e.message || 'Failed to send test email.' });
        } finally {
            setIsTestingMail(false);
        }
    };


  if (isLoading) {
    return (
      <div className="container mx-auto px-0 md:px-4 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Card><CardHeader><Skeleton className="h-8 w-48" /></CardHeader><CardContent><Skeleton className="h-64 w-full" /></CardContent></Card>
        <Card><CardHeader><Skeleton className="h-8 w-48" /></CardHeader><CardContent><Skeleton className="h-64 w-full" /></CardContent></Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-0 md:px-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (user?.authority !== 'SYS_ADMIN') {
    return (
      <div className="container mx-auto px-0 md:px-4">
          <div className="flex flex-col items-center justify-center h-96 border-2 border-dashed rounded-lg">
              <UserCog className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-2xl font-semibold">Permission Denied</h3>
              <p className="text-muted-foreground text-center max-w-md mt-2">
                  You do not have sufficient permissions to manage Admin Settings. This page is available only to System Administrators.
              </p>
          </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-0 md:px-4 space-y-8">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Admin Settings</h1>
            <p className="text-muted-foreground">Manage system-wide configurations for your ThingsBoard instance.</p>
        </div>

        {/* Security Settings Card */}
        <Form {...securityForm}>
            <form onSubmit={securityForm.handleSubmit(onSecuritySubmit)}>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><ShieldCheck/> Security Settings</CardTitle>
                        <CardDescription>Configure system security policies, including password requirements.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm font-medium">Password Policy</p>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 pl-4 border-l-2">
                            <FormField control={securityForm.control} name="passwordPolicy_minimumLength" render={({ field }) => (<FormItem><FormLabel>Min Length</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                            <FormField control={securityForm.control} name="passwordPolicy_minimumUppercaseLetters" render={({ field }) => (<FormItem><FormLabel>Min Uppercase</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                            <FormField control={securityForm.control} name="passwordPolicy_minimumLowercaseLetters" render={({ field }) => (<FormItem><FormLabel>Min Lowercase</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                            <FormField control={securityForm.control} name="passwordPolicy_minimumDigits" render={({ field }) => (<FormItem><FormLabel>Min Digits</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                            <FormField control={securityForm.control} name="passwordPolicy_minimumSpecialCharacters" render={({ field }) => (<FormItem><FormLabel>Min Special Chars</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                            <FormField control={securityForm.control} name="passwordPolicy_allowWhitespace" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm mt-auto"><FormLabel>Allow Whitespace</FormLabel><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)}/>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" disabled={isSecuritySaving}>
                            {isSecuritySaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4"/>}
                            Save Security Settings
                        </Button>
                    </CardFooter>
                </Card>
            </form>
        </Form>
        
        {/* Mail Settings Card */}
        <Form {...mailForm}>
            <form onSubmit={mailForm.handleSubmit(onMailSubmit)}>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Mail /> Mail Server Settings</CardTitle>
                        <CardDescription>Configure the SMTP server for sending emails, such as password resets.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-4">
                            <FormField control={mailForm.control} name="host" render={({ field }) => (<FormItem><FormLabel>SMTP Host</FormLabel><FormControl><Input placeholder="smtp.example.com" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                            <FormField control={mailForm.control} name="port" render={({ field }) => (<FormItem><FormLabel>SMTP Port</FormLabel><FormControl><Input type="number" placeholder="587" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                            <FormField control={mailForm.control} name="username" render={({ field }) => (<FormItem><FormLabel>Username</FormLabel><FormControl><Input placeholder="user@example.com" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                            <FormField control={mailForm.control} name="password" render={({ field }) => (<FormItem><FormLabel>Password</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                        </div>
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <FormField control={mailForm.control} name="protocol" render={({ field }) => (<FormItem><FormLabel>Protocol</FormLabel><FormControl><Input placeholder="smtp" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                            <FormField control={mailForm.control} name="timeout" render={({ field }) => (<FormItem><FormLabel>Timeout (ms)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                            <FormField control={mailForm.control} name="smtpAuth" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm mt-auto"><FormLabel>SMTP Auth</FormLabel><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)}/>
                            <FormField control={mailForm.control} name="enableTls" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm mt-auto"><FormLabel>Enable STARTTLS</FormLabel><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)}/>
                        </div>
                    </CardContent>
                    <CardFooter className="justify-between">
                        <Button type="submit" disabled={isMailSaving}>
                            {isMailSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4"/>}
                            Save Mail Settings
                        </Button>
                        <Button type="button" variant="outline" onClick={handleSendTestMail} disabled={isTestingMail || isMailSaving}>
                            {isTestingMail && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Send Test Email
                        </Button>
                    </CardFooter>
                </Card>
            </form>
        </Form>
    </div>
  );
}
