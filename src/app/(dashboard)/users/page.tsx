// /app/users/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getCustomers, getCustomerUsers, getUserAttributes, saveUserAttributes, setUserCredentialsEnabled, deleteUser } from '@/lib/api';
import type { ThingsboardUser, AppUser, UserPermissions, ThingsboardCustomer } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Loader2, User as UserIcon, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
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

const defaultPermissions: UserPermissions = {
    canExport: true,
    canSchedule: true,
};

export default function UsersPage() {
    const [users, setUsers] = useState<AppUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState<string | null>(null); // Store saving user's ID
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    const fetchUsersAndPermissions = async () => {
        const token = localStorage.getItem('tb_auth_token');
        const instanceUrl = localStorage.getItem('tb_instance_url');

        if (!token || !instanceUrl) {
            setError('Authentication details not found.');
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        try {
            const customers: ThingsboardCustomer[] = await getCustomers(token, instanceUrl);

            const allUsers: ThingsboardUser[] = [];
            for (const customer of customers) {
                const customerUsers = await getCustomerUsers(token, instanceUrl, customer.id.id);
                allUsers.push(...customerUsers);
            }

            const usersWithPermissions = await Promise.all(
                allUsers.map(async (user) => {
                    try {
                        const attributes = await getUserAttributes(token, instanceUrl, user.id.id);
                        
                        const permissions: UserPermissions = { ...defaultPermissions };
                        let userEnabled = true;

                        attributes.forEach(attr => {
                            if (attr.key === 'userCredentialsEnabled') {
                                userEnabled = attr.value;
                            } else if (Object.keys(permissions).includes(attr.key)) {
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
            setError(e.message || 'Failed to fetch users.');
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
            await fetchUsersAndPermissions(); // Re-fetch to ensure UI is in sync
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
            await fetchUsersAndPermissions(); // Refresh list
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Delete Failed', description: e.message || 'Could not delete user.' });
        } finally {
            setIsSaving(null);
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
    
    if (users.length === 0) {
        return (
            <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>No Customer Users Found</AlertTitle>
                <AlertDescription>There are no customer users assigned to any customers for this tenant.</AlertDescription>
            </Alert>
        );
    }

    return (
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
                            {user.email} <Badge variant="outline" className="ml-2">{user.authority.replace('_', ' ')}</Badge>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-4 flex-grow">
                        <div className="space-y-3">
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
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between space-x-2">
                            <Label htmlFor={`disable-${user.id.id}`} className={cn("font-medium", !user.userCredentialsEnabled && 'text-destructive')}>
                                {user.userCredentialsEnabled ? 'Disable User' : 'User Disabled'}
                            </Label>
                            <Switch
                                id={`disable-${user.id.id}`}
                                checked={!user.userCredentialsEnabled}
                                onCheckedChange={(checked) => handleCredentialsToggle(user.id.id, !checked)}
                                className="data-[state=checked]:bg-destructive"
                                disabled={!!isSaving}
                            />
                        </div>
                    </CardContent>
                     <CardContent className="pt-2">
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
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
