// /app/profile/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { getUser, changePassword } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, User, Building, Clock, KeyRound, MapPin, Phone, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { ThingsboardUser } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required.'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters.'),
  confirmPassword: z.string()
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "New passwords don't match.",
  path: ['confirmPassword']
});

type PasswordFormValues = z.infer<typeof passwordSchema>;

export default function ProfilePage() {
  const [user, setUser] = useState<ThingsboardUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const { toast } = useToast();

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' }
  });

  useEffect(() => {
    const fetchData = async () => {
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
      } catch (e: any) {
        setError(e.message || 'Failed to fetch user details.');
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

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

  const DetailItem = ({ icon: Icon, label, value, isBadge = false }: { icon: React.ElementType, label: string; value: string | undefined | null, isBadge?: boolean }) => {
    if (!value) return null;
    return (
        <div className="flex items-start space-x-4">
            <Icon className="h-5 w-5 text-muted-foreground mt-1 flex-shrink-0" />
            <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">{label}</p>
                {isBadge ? (
                     <Badge variant="secondary">{value || 'N/A'}</Badge>
                ) : (
                    <p className="text-base font-semibold break-words">{value || 'N/A'}</p>
                )}
            </div>
        </div>
    )
  };

  if (isLoading) {
    return (
       <div className="container mx-auto px-0 md:px-4">
        <Card>
            <CardHeader>
                <div className="flex items-center space-x-4">
                    <Skeleton className="h-16 w-16 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-4 w-64" />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
                {[...Array(8)].map((_, i) => (
                    <div key={i} className="flex items-start space-x-4">
                        <Skeleton className="h-6 w-6 rounded" />
                        <div className="w-full space-y-2">
                             <Skeleton className="h-4 w-1/3" />
                             <Skeleton className="h-6 w-2/3" />
                        </div>
                    </div>
                ))}
            </CardContent>
            <CardFooter>
                <Skeleton className="h-10 w-48" />
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

  const formatAddress = (address: ThingsboardUser['additionalInfo']['address']) => {
      if (!address) return null;
      const parts = [address.street, address.city, address.state, address.zip, address.country];
      return parts.filter(Boolean).join(', ');
  }

  return (
    <div className="container mx-auto px-0 md:px-4">
      <Card>
        <CardHeader>
            <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4">
                <User className="h-16 w-16 text-primary rounded-full bg-primary/10 p-4" />
                 <div className="text-center sm:text-left">
                    <CardTitle className="text-3xl">{user.firstName || ''} {user.lastName || 'User'}</CardTitle>
                    <CardDescription>{user.email}</CardDescription>
                 </div>
            </div>
        </CardHeader>
        <CardContent className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 pt-6">
          <DetailItem icon={KeyRound} label="Authority" value={user.authority} isBadge />
          <DetailItem icon={User} label="User ID" value={user.id?.id} />
          <DetailItem icon={Phone} label="Mobile Number" value={user.additionalInfo?.mobile} />
          <DetailItem icon={MapPin} label="Address" value={formatAddress(user.additionalInfo?.address)} />
          <DetailItem icon={Building} label="Tenant ID" value={user.tenantId?.id} />
          <DetailItem icon={Building} label="Customer ID" value={user.customerId?.id} />
          <DetailItem icon={Clock} label="Created Time" value={new Date(user.createdTime).toLocaleString()} />
        </CardContent>
        <CardFooter>
            <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline">Change Password</Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Change Your Password</DialogTitle>
                    </DialogHeader>
                     <Form {...passwordForm}>
                        <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                             <FormField
                                control={passwordForm.control}
                                name="currentPassword"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Current Password</FormLabel>
                                        <FormControl>
                                            <Input type="password" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={passwordForm.control}
                                name="newPassword"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>New Password</FormLabel>
                                        <FormControl>
                                            <Input type="password" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={passwordForm.control}
                                name="confirmPassword"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Confirm New Password</FormLabel>
                                        <FormControl>
                                            <Input type="password" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsPasswordDialogOpen(false)}>Cancel</Button>
                                <Button type="submit" disabled={passwordForm.formState.isSubmitting}>
                                    {passwordForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Save Changes
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </CardFooter>
      </Card>
    </div>
  );
}
