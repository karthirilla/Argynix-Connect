
// /app/users/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { getCustomers, getCustomerUsers, getUserAttributes, saveUserAttributes, setUserCredentialsEnabled, deleteUser, saveUser, getUser, sendActivationMail } from '@/lib/api';
import type { ThingsboardUser, AppUser, UserPermissions, ThingsboardCustomer } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Loader2, User as UserIcon, Trash2, PlusCircle, MailQuestion, UserCog } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
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
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const defaultPermissions: UserPermissions = {
    canExport: true,
    canSchedule: true,
};

const userFormSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email." }),
  customerId: z.string().min(1, { message: "Please select a customer." }),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  sendActivationMail: z.boolean().default(true),
});
type UserFormValues = z.infer<typeof userFormSchema>;


function UserCreator({ customers, onUserCreated, currentUser }: { customers: ThingsboardCustomer[], onUserCreated: () => void, currentUser: ThingsboardUser | null }) {
    const [isOpen, setIsOpen] = useState(false);
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);
    
    const form = useForm<UserFormValues>({
        resolver: zodResolver(userFormSchema),
        defaultValues: {
            email: '',
            customerId: '',
            firstName: '',
            lastName: '',
            sendActivationMail: true,
        },
    });

    const onSubmit = async (data: UserFormValues) => {
        const token = localStorage.getItem('tb_auth_token');
        const instanceUrl = localStorage.getItem('tb_instance_url');
        if (!token || !instanceUrl || !currentUser) return;
        
        setIsSaving(true);
        try {
            await saveUser(token, instanceUrl, {
                email: data.email,
                firstName: data.firstName,
                lastName: data.lastName,
                authority: 'CUSTOMER_USER',
                tenantId: currentUser.tenantId,
                customerId: { id: data.customerId, entityType: 'CUSTOMER' },
            }, data.sendActivationMail);
            
            toast({ title: "User Created", description: `An invitation has been sent to ${data.email}.` });
            onUserCreated();
            setIsOpen(false);
            form.reset();
        } catch (e: any) {
             toast({ variant: 'destructive', title: 'Failed to create user', description: e.message });
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Invite User
                </Button>
            </DialogTrigger>
            <DialogContent>
                 <DialogHeader>
                    <DialogTitle>Invite New User</DialogTitle>
                    <DialogDescription>Create a new customer user and send them an activation email.</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField control={form.control} name="email" render={({ field }) => (
                            <FormItem><FormLabel>Email</FormLabel><FormControl><Input placeholder="user@example.com" {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                         <FormField control={form.control} name="customerId" render={({ field }) => (
                            <FormItem><FormLabel>Assign to Customer</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Select a customer" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        {customers.filter(c => c.id.id !== '13814000-1dd2-11b2-8080-808080808080').map(customer => ( // Filter out Public customer
                                            <SelectItem key={customer.id.id} value={customer.id.id}>{customer.title}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            <FormMessage /></FormItem>
                        )}/>
                        <div className="grid grid-cols-2 gap-4">
                             <FormField control={form.control} name="firstName" render={({ field }) => (
                                <FormItem><FormLabel>First Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                            <FormField control={form.control} name="lastName" render={({ field }) => (
                                <FormItem><FormLabel>Last Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                        </div>
                        <FormField control={form.control} name="sendActivationMail" render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                                <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                <div className="space-y-1 leading-none"><FormLabel>Send activation email</FormLabel><FormDescription>The user will receive an email to set their password and activate their account.</FormDescription></div>
                           </FormItem>
                        )}/>
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={isSaving}>
                                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <PlusCircle className="mr-2 h-4 w-4" />}
                                Create User
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

export default function UsersPage() {
    const [users, setUsers] = useState<AppUser[]>([]);
    const [customers, setCustomers] = useState<ThingsboardCustomer[]>([]);
    const [currentUser, setCurrentUser] = useState<ThingsboardUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState<string | null>(null); // Store saving user's ID
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    const fetchUsersAndPermissions = async () => {
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
            const currentUserData = await getUser(token, instanceUrl);
            setCurrentUser(currentUserData);
            
            // This page is only for Tenant Admins.
            if (currentUserData.authority !== 'TENANT_ADMIN') {
                setIsLoading(false);
                return;
            }

            const customersData = await getCustomers(token, instanceUrl, currentUserData.tenantId.id);
            setCustomers(customersData);
            
            const customerUsersPromises = customersData.map(customer => {
                // The 'Public' customer cannot have users, so skip it.
                if (customer.id.id === '13814000-1dd2-11b2-8080-808080808080') {
                    return Promise.resolve([]);
                }
                return getCustomerUsers(token, instanceUrl, customer.id.id);
            });
            const usersByCustomer = await Promise.all(customerUsersPromises);
            const allCustomerUsers = usersByCustomer.flat();
            
            const otherUsers = allCustomerUsers.filter(u => u.id.id !== currentUserData.id.id);

            const usersWithPermissions = await Promise.all(
                otherUsers.map(async (user) => {
                    try {
                        const attributes = await getUserAttributes(token, instanceUrl, user.id.id);
                        const permissions: UserPermissions = { ...defaultPermissions };
                        let userEnabled = true;

                        const credentialsEnabledAttr = attributes.find(attr => attr.key === 'userCredentialsEnabled');
                        if (credentialsEnabledAttr !== undefined) {
                            userEnabled = credentialsEnabledAttr.value;
                        }

                        attributes.forEach(attr => {
                            if (Object.keys(permissions).includes(attr.key)) {
                                (permissions as any)[attr.key] = attr.value;
                            }
                        });

                        return { ...user, permissions, userCredentialsEnabled: userEnabled };
                    } catch (e) {
                        console.error(`Failed to get attributes for user ${user.id.id}`, e);
                        return { ...user, permissions: defaultPermissions, userCredentialsEnabled: true };
                    }
                })
            );
            
            setUsers(usersWithPermissions);
        } catch (e: any) {
            setError(e.message || 'Failed to fetch user data.');
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsersAndPermissions();
    }, []);

    const handlePermissionChange = async (userId: string, permission: keyof UserPermissions, value: boolean) => {
        const token = localStorage.getItem('tb_auth_token');
        const instanceUrl = localStorage.getItem('tb_instance_url');

        if (!token || !instanceUrl) {
            toast({ variant: 'destructive', title: 'Error', description: 'Authentication details missing.' });
            return;
        }

        setIsSaving(userId);
        try {
            await saveUserAttributes(token, instanceUrl, userId, { [permission]: value });
            toast({ title: 'Success', description: `User permission updated successfully.` });
            await fetchUsersAndPermissions();
        } catch (e) {
            toast({ variant: 'destructive', title: 'Update Failed', description: 'Could not save permission.' });
            console.error(e);
        } finally {
            setIsSaving(null);
        }
    };
    
    const handleCredentialsToggle = async (userId: string, isEnabled: boolean) => {
        const token = localStorage.getItem('tb_auth_token');
        const instanceUrl = localStorage.getItem('tb_instance_url');
        if (!token || !instanceUrl) return;

        setIsSaving(userId);
        try {
            await setUserCredentialsEnabled(token, instanceUrl, userId, isEnabled);
            toast({ title: 'Success', description: `User has been ${isEnabled ? 'enabled' : 'disabled'}.` });
            await fetchUsersAndPermissions();
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Update Failed', description: e.message || 'Could not update user status.' });
        } finally {
            setIsSaving(null);
        }
    }
    
    const handleDeleteUser = async (userId: string) => {
        const token = localStorage.getItem('tb_auth_token');
        const instanceUrl = localStorage.getItem('tb_instance_url');
        if (!token || !instanceUrl) return;

        setIsSaving(userId);
        try {
            await deleteUser(token, instanceUrl, userId);
            toast({ title: 'Success', description: 'User has been deleted.' });
            await fetchUsersAndPermissions();
        } catch (e: any)
        {
            toast({ variant: 'destructive', title: 'Delete Failed', description: e.message || 'Could not delete user.' });
        } finally {
            setIsSaving(null);
        }
    }
    
    const handleResendActivation = async (email: string) => {
         const token = localStorage.getItem('tb_auth_token');
        const instanceUrl = localStorage.getItem('tb_instance_url');
        if (!token || !instanceUrl) return;
        
        try {
            await sendActivationMail(token, instanceUrl, email);
            toast({ title: 'Activation Email Sent', description: `A new activation link has been sent to ${email}.` });
        } catch (e: any) {
             toast({ variant: 'destructive', title: 'Failed to send email', description: e.message || 'Could not send activation email.' });
        }
    }

    if (isLoading) {
        return (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {[...Array(8)].map((_, i) => (
                    <Card key={i}>
                        <CardHeader>
                            <Skeleton className="h-6 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                        </CardHeader>
                        <CardContent className="space-y-4 pt-6">
                            <Skeleton className="h-5 w-full" />
                            <Skeleton className="h-5 w-full" />
                            <Separator />
                            <Skeleton className="h-8 w-full" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }
    
    if(error) {
        return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        );
    }
    
    if (!currentUser || currentUser.authority !== 'TENANT_ADMIN') {
        return (
             <div className="container mx-auto px-0 md:px-4">
                <div className="flex flex-col items-center justify-center h-96 border-2 border-dashed rounded-lg">
                    <UserCog className="h-16 w-16 text-muted-foreground mb-4" />
                    <h3 className="text-2xl font-semibold">Permission Denied</h3>
                    <p className="text-muted-foreground text-center max-w-md mt-2">
                        You do not have sufficient permissions to manage Users. This page is available only to Tenant Administrators.
                    </p>
                </div>
            </div>
        );
    }
    
    if (users.length === 0 && !isLoading) {
        return (
             <div className="flex flex-col items-center justify-center h-96 border-2 border-dashed rounded-lg">
                <UserIcon className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-2xl font-semibold">No Other Users Found</h3>
                <p className="text-muted-foreground text-center max-w-md mt-2">
                    There are no other users for this tenant.
                </p>
                <div className="mt-6"><UserCreator customers={customers} onUserCreated={fetchUsersAndPermissions} currentUser={currentUser} /></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                 <div>
                    <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
                    <p className="text-muted-foreground">Manage permissions and access for all users in your tenant.</p>
                </div>
                <UserCreator customers={customers} onUserCreated={fetchUsersAndPermissions} currentUser={currentUser} />
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {users.map(user => (
                    <Card key={user.id.id} className={cn(
                        'relative transition-all flex flex-col',
                        !user.userCredentialsEnabled && 'bg-muted/50 opacity-70',
                        isSaving === user.id.id && 'pointer-events-none'
                    )}>
                        {isSaving === user.id.id && (
                            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-background/50">
                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            </div>
                        )}
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3 text-lg">
                            <UserIcon className="h-5 w-5 text-muted-foreground"/> {user.firstName || 'No'} {user.lastName || 'Name'}
                            </CardTitle>
                            <CardDescription>
                                {user.email} <Badge variant={user.authority === 'TENANT_ADMIN' ? 'default' : 'outline'} className="ml-2">{user.authority.replace('_', ' ')}</Badge>
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-4 flex-grow">
                             <div className="space-y-3">
                                {user.authority === 'CUSTOMER_USER' ? (
                                    <>
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor={`export-${user.id.id}`} className="font-normal text-sm">Can Export Data</Label>
                                            <Switch
                                                id={`export-${user.id.id}`}
                                                checked={user.permissions.canExport}
                                                onCheckedChange={(checked) => handlePermissionChange(user.id.id, 'canExport', checked)}
                                                disabled={!user.userCredentialsEnabled || !!isSaving}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor={`schedule-${user.id.id}`} className="font-normal text-sm">Can Use Scheduler</Label>
                                            <Switch
                                                id={`schedule-${user.id.id}`}
                                                checked={user.permissions.canSchedule}
                                                onCheckedChange={(checked) => handlePermissionChange(user.id.id, 'canSchedule', checked)}
                                                disabled={!user.userCredentialsEnabled || !!isSaving}
                                            />
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-sm text-muted-foreground text-center p-4 bg-muted rounded-md">
                                        Admins have all permissions.
                                    </div>
                                )}
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between space-x-2">
                                <Label htmlFor={`disable-${user.id.id}`} className={cn("font-medium", !user.userCredentialsEnabled && 'text-destructive')}>
                                    {user.userCredentialsEnabled ? 'Disable User' : 'User Disabled'}
                                </Label>
                                <div className="flex items-center gap-2">
                                    {!user.userCredentialsEnabled && (
                                         <TooltipProvider>
                                            <Tooltip><TooltipTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleResendActivation(user.email)}><MailQuestion className="h-4 w-4" /></Button>
                                            </TooltipTrigger><TooltipContent><p>Resend activation email</p></TooltipContent></Tooltip>
                                        </TooltipProvider>
                                    )}
                                    <Switch
                                        id={`disable-${user.id.id}`}
                                        checked={!user.userCredentialsEnabled}
                                        onCheckedChange={(checked) => handleCredentialsToggle(user.id.id, !checked)}
                                        className="data-[state=checked]:bg-destructive"
                                        disabled={!!isSaving}
                                    />
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive" className="w-full" disabled={!!isSaving}>
                                        <Trash2 className="mr-2 h-4 w-4" /> Delete User
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete the user <span className="font-bold">{user.email}</span>.
                                    </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteUser(user.id.id)}>Delete</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    );
}
