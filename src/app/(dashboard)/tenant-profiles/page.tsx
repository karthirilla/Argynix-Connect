// /app/tenant-profiles/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getTenantProfileInfos } from '@/lib/api';
import type { ThingsboardTenantProfileInfo } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Building2, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function TenantProfilesPage() {
    const [profiles, setProfiles] = useState<ThingsboardTenantProfileInfo[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchProfiles = async () => {
            const token = localStorage.getItem('tb_auth_token');
            const instanceUrl = localStorage.getItem('tb_instance_url');

            if (!token || !instanceUrl) {
                setError('Authentication details not found.');
                setIsLoading(false);
                return;
            }

            try {
                const profileData = await getTenantProfileInfos(token, instanceUrl);
                setProfiles(profileData);
            } catch (e: any) {
                setError(e.message || 'Failed to fetch tenant profiles.');
                console.error(e);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfiles();
    }, []);
    
    if (isLoading) {
        return (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                    <Card key={i}>
                        <CardHeader>
                            <Skeleton className="h-6 w-3/4" />
                            <Skeleton className="h-4 w-1/2 mt-2" />
                        </CardHeader>
                        <CardContent className="space-y-4 pt-6">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-2/3" />
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
    
    if (profiles.length === 0) {
        return (
            <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>No Tenant Profiles Found</AlertTitle>
                <AlertDescription>There are no tenant profiles configured for this instance.</AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {profiles.map(profile => (
                <Card key={profile.id.id} className="flex flex-col">
                    <CardHeader>
                        <div className="flex items-start justify-between">
                            <Building2 className="h-8 w-8 text-muted-foreground" />
                            {profile.default && (
                                 <Badge variant="secondary" className="flex items-center gap-1">
                                    <CheckCircle className="h-3 w-3 text-green-600" />
                                    Default
                                </Badge>
                            )}
                        </div>
                        <CardTitle className="pt-4">{profile.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow">
                       {profile.description && <CardDescription>{profile.description}</CardDescription>}
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
