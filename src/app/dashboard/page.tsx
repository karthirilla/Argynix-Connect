
"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardRootPage() {
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const storedToken = localStorage.getItem('tb_auth_token');
        setToken(storedToken);
        setIsLoading(false);
    }, []);

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-1/2" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-24 w-full" />
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="container mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle>Welcome to your Dashboard</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    <h3 className="font-semibold">Your JWT Token:</h3>
                    {token ? (
                        <p className="text-sm text-muted-foreground break-all bg-muted p-2 rounded-md">
                            {token}
                        </p>
                    ) : (
                        <p className="text-sm text-red-500">
                            Could not find JWT Token.
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
