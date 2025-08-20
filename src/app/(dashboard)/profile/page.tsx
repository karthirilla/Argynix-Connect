
// /app/profile/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { getUser, changePassword, saveUser } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, User, Building, Clock, KeyRound, MapPin, Phone, Loader2, Save } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { ThingsboardUser } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required.'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters.'),
  confirmPassword: z.string()
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "New passwords don't match.",
  path: ['confirmPassword']
});
type PasswordFormValues = z.infer<typeof passwordSchema>;

const profileSchema = z.object({
    email: z.string().email(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    additionalInfo: z.object({
        description: z.string().optional(),
        mobile: z.string().optional(),
        address: z.object({
            street: z.string().optional(),
            city: z.string().optional(),
            state: z.string().optional(),
            zip: z.string().optional(),
            country: z.string().optional(),
        }).optional(),
    }).optional(),
});
type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const [user, setUser] = useState<ThingsboardUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const { toast } = useToast();

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' }
  });

  const fetchUserData = async () => {
      const token = localStorage.getItem('tb_auth_token');
      const instanceUrl = localStorage.getItem('tb_instance_url');
      
      if (!token || !instanceUrl) {
        setError('Authentication details not found.');
        setIsLoading(false);
        return;
      }

      try {
        const userData = await getUser(token, instanceUrl);
        setUser(userData);
        profileForm.reset({
            email: userData.email,
            firstName: userData.firstName || '',
            lastName: userData.lastName || '',
            additionalInfo: {
                description: userData.additionalInfo?.description || '',
                mobile: userData.additionalInfo?.mobile || '',
                address: {
                    street: userData.additionalInfo?.address?.street || '',
                    city: userData.additionalInfo?.address?.city || '',
                    state: userData.additionalInfo?.address?.state || '',
                    zip: userData.additionalInfo?.address?.zip || '',
                    country: userData.additionalInfo?.address?.country || '',
                }
            }
        });
      } catch (e: any) {
        setError(e.message || 'Failed to fetch user details.');
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };

  useEffect(() => {
    fetchUserData();
  }, []);

  const onProfileSubmit = async (data: ProfileFormValues) => {
    const token = localStorage.getItem('tb_auth_token');
    const instanceUrl = localStorage.getItem('tb_instance_url');
    if (!token || !instanceUrl || !user) return;
    
    setIsSaving(true);
    try {
        const updatedUser: Partial<ThingsboardUser> = {
            ...user,
            ...data,
        };
        await saveUser(token, instanceUrl, updatedUser, false);
        toast({ title: 'Success', description: 'Your profile has been updated.' });
        await fetchUserData(); // Re-fetch to get latest data
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Error', description: e.message || 'Failed to update profile.' });
    } finally {
        setIsSaving(false);
    }
  }

  const onPasswordSubmit = async (data: PasswordFormValues) => {
    const token = localStorage.getItem('tb_auth_token');
    const instanceUrl = localStorage.getItem('tb_instance_url');
    if (!token || !instanceUrl) {
      toast({ variant: 'destructive', title: 'Error', description: 'Authentication details missing.' });
      return;
    }
    
    try {
        await changePassword(token, instanceUrl, data.currentPassword, data.newPassword);
        toast({ title: 'Success', description: 'Your password has been changed successfully.' });
        setIsPasswordDialogOpen(false);
        passwordForm.reset();
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to change password.' });
    }
  }

  if (isLoading) {
    return (
       <div className="container mx-auto px-0 md:px-4">
        <Card>
            <CardHeader>
                <Skeleton className="h-8 w-1/2" />
                <Skeleton className="h-4 w-1/3" />
            </CardHeader>
            <CardContent className="space-y-6 mt-6">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-20 w-full" />
            </CardContent>
            <CardFooter className="gap-2">
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-32" />
            </CardFooter>
        </Card>
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
  
  if (!user) {
      return (
          <div className="container mx-auto text-center px-0 md:px-4">
              <p>User not found.</p>
          </div>
      )
  }

  return (
    <div className="container mx-auto px-0 md:px-4">
        <Form {...profileForm}>
            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)}>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-3xl">My Profile</CardTitle>
                        <CardDescription>View and edit your personal information and account settings.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            <FormField control={profileForm.control} name="firstName" render={({ field }) => (<FormItem><FormLabel>First Name</FormLabel><FormControl><Input placeholder="John" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                            <FormField control={profileForm.control} name="lastName" render={({ field }) => (<FormItem><FormLabel>Last Name</FormLabel><FormControl><Input placeholder="Doe" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                        </div>
                        <FormField control={profileForm.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email Address</FormLabel><FormControl><Input disabled {...field} /></FormControl><FormDescription>Your email address is used for logging in and cannot be changed.</FormDescription><FormMessage /></FormItem>)}/>
                         <FormField control={profileForm.control} name="additionalInfo.mobile" render={({ field }) => (<FormItem><FormLabel>Mobile Number</FormLabel><FormControl><Input placeholder="+1 234 567 890" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                        <div className="space-y-4 rounded-lg border p-4">
                            <h3 className="font-medium">Address</h3>
                             <FormField control={profileForm.control} name="additionalInfo.address.street" render={({ field }) => (<FormItem><FormLabel>Street</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                             <div className="grid md:grid-cols-2 gap-6">
                                <FormField control={profileForm.control} name="additionalInfo.address.city" render={({ field }) => (<FormItem><FormLabel>City</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                <FormField control={profileForm.control} name="additionalInfo.address.state" render={({ field }) => (<FormItem><FormLabel>State</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                             </div>
                             <div className="grid md:grid-cols-2 gap-6">
                                <FormField control={profileForm.control} name="additionalInfo.address.zip" render={({ field }) => (<FormItem><FormLabel>Zip/Postal Code</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                <FormField control={profileForm.control} name="additionalInfo.address.country" render={({ field }) => (<FormItem><FormLabel>Country</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                             </div>
                        </div>
                         <FormField control={profileForm.control} name="additionalInfo.description" render={({ field }) => (<FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="Tell us a little bit about yourself" className="resize-none" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                    
                    <Separator />
                     <div className="space-y-2">
                        <h3 className="font-medium">Account Details</h3>
                        <div className="text-sm rounded-md bg-muted p-4 space-y-4">
                            <div className="flex justify-between"><span>Authority:</span><Badge variant="secondary">{user.authority}</Badge></div>
                            <div className="flex justify-between"><span>User ID:</span><span className="font-mono text-xs">{user.id.id}</span></div>
                            <div className="flex justify-between"><span>Tenant ID:</span><span className="font-mono text-xs">{user.tenantId.id}</span></div>
                            {user.customerId?.id && <div className="flex justify-between"><span>Customer ID:</span><span className="font-mono text-xs">{user.customerId.id}</span></div>}
                        </div>
                     </div>
                    </CardContent>
                    <CardFooter className="justify-between">
                         <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
                            <DialogTrigger asChild>
                                <Button type="button" variant="outline">Change Password</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader><DialogTitle>Change Your Password</DialogTitle></DialogHeader>
                                <Form {...passwordForm}>
                                    <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                                        <FormField control={passwordForm.control} name="currentPassword" render={({ field }) => (<FormItem><FormLabel>Current Password</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                        <FormField control={passwordForm.control} name="newPassword" render={({ field }) => (<FormItem><FormLabel>New Password</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                        <FormField control={passwordForm.control} name="confirmPassword" render={({ field }) => (<FormItem><FormLabel>Confirm New Password</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                        <DialogFooter>
                                            <Button type="button" variant="outline" onClick={() => setIsPasswordDialogOpen(false)}>Cancel</Button>
                                            <Button type="submit" disabled={passwordForm.formState.isSubmitting}>{passwordForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save Changes</Button>
                                        </DialogFooter>
                                    </form>
                                </Form>
                            </DialogContent>
                        </Dialog>
                        <Button type="submit" disabled={isSaving || !profileForm.formState.isDirty}>
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />}
                            Save Changes
                        </Button>
                    </CardFooter>
                </Card>
            </form>
        </Form>
    </div>
  );
}

    