// /app/users/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getUsers, getUserAttributes, saveUserAttributes } from '@/lib/api';
import type { ThingsboardUser, AppUser, UserPermissions } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Loader2, User as UserIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const defaultPermissions: UserPermissions = {
    canExport: true,
    canSchedule: true,
    userDisabled: false,
};

export default function UsersPage() {
    const [users, setUsers] = useState<AppUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        const fetchUsersAndPermissions = async () => {
            const token = localStorage.getItem('tb_auth_token');
            const instanceUrl = localStorage.getItem('tb_instance_url');

            if (!token || !instanceUrl) {
                setError('Authentication details not found.');
                setIsLoading(false);
                return;
            }

            try {
                const tbUsers: ThingsboardUser[] = await getUsers(token, instanceUrl);

                const usersWithPermissions = await Promise.all(
                    tbUsers.map(async (user) => {
                        try {
                            const attributes = await getUserAttributes(token, instanceUrl, user.id.id);
                            
                            const permissions: UserPermissions = { ...defaultPermissions };
                            
                            attributes.forEach(attr => {
                                if (Object.keys(permissions).includes(attr.key)) {
                                    (permissions as any)[attr.key] = attr.value;
                                }
                            });

                            return { ...user, permissions };
                        } catch (e) {
                            console.error(`Failed to get attributes for user ${user.id.id}`, e);
                            return { ...user, permissions: defaultPermissions };
                        }
                    })
                );
                
                setUsers(usersWithPermissions);
            } catch (e) {
                setError('Failed to fetch users.');
                console.error(e);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUsersAndPermissions();
    }, []);

    const handlePermissionChange = async (userId: string, permission: keyof UserPermissions, value: boolean) => {
        const token = localStorage.getItem('tb_auth_token');
        const instanceUrl = localStorage.getItem('tb_instance_url');

        if (!token || !instanceUrl) {
            toast({ variant: 'destructive', title: 'Error', description: 'Authentication details missing.' });
            return;
        }

        // Optimistic update
        const originalUsers = [...users];
        setUsers(currentUsers =>
            currentUsers.map(u =>
                u.id.id === userId ? { ...u, permissions: { ...u.permissions, [permission]: value } } : u
            )
        );

        try {
            await saveUserAttributes(token, instanceUrl, userId, { [permission]: value });
            toast({
                title: 'Success',
                description: `User permission updated successfully.`,
            });
        } catch (e) {
            // Revert on failure
            setUsers(originalUsers);
            toast({ variant: 'destructive', title: 'Update Failed', description: 'Could not save permission.' });
            console.error(e);
        }
    };
    
    if (isLoading) {
        return (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                    <Card key={i}>
                        <CardHeader>
                            <Skeleton className="h-6 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                        </CardHeader>
                        <CardContent className="space-y-4">
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
        return <p className="text-destructive">{error}</p>
    }

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {users.map(user => (
                <Card key={user.id.id} className={user.permissions.userDisabled ? 'bg-muted/50' : ''}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                           <UserIcon className="h-5 w-5"/> {user.firstName} {user.lastName}
                        </CardTitle>
                        <CardDescription>
                            {user.email} <Badge variant="outline" className="ml-2">{user.authority.replace('_', ' ')}</Badge>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label htmlFor={`export-${user.id.id}`}>Can Export Data</Label>
                                <Switch
                                    id={`export-${user.id.id}`}
                                    checked={user.permissions.canExport}
                                    onCheckedChange={(checked) => handlePermissionChange(user.id.id, 'canExport', checked)}
                                    disabled={user.permissions.userDisabled}
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <Label htmlFor={`schedule-${user.id.id}`}>Can Use Scheduler</Label>
                                <Switch
                                    id={`schedule-${user.id.id}`}
                                    checked={user.permissions.canSchedule}
                                    onCheckedChange={(checked) => handlePermissionChange(user.id.id, 'canSchedule', checked)}
                                    disabled={user.permissions.userDisabled}
                                />
                            </div>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <Label htmlFor={`disable-${user.id.id}`} className={user.permissions.userDisabled ? 'text-destructive' : ''}>
                                {user.permissions.userDisabled ? 'User Disabled' : 'Disable User'}
                            </Label>
                            <Switch
                                id={`disable-${user.id.id}`}
                                checked={user.permissions.userDisabled}
                                onCheckedChange={(checked) => handlePermissionChange(user.id.id, 'userDisabled', checked)}
                                className="data-[state=checked]:bg-destructive"
                            />
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
