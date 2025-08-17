
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Dashboard } from '@/lib/types';
import { BarChart, LayoutDashboard, Info, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function DashboardsList({ dashboards }: { dashboards: Dashboard[] }) {
  const [instanceUrl, setInstanceUrl] = useState('');

  useEffect(() => {
    // Client-side only: get the instance URL from localStorage
    const url = localStorage.getItem('tb_instance_url');
    setInstanceUrl(url || '');
  }, []);
  
  if (dashboards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <h3 className="text-xl font-semibold">No Dashboards Found</h3>
        <p className="text-muted-foreground">This user does not have any dashboards assigned.</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {dashboards.map((dashboard) => (
          <Card key={dashboard.id} className="flex flex-col">
            <CardHeader>
              <div className="flex items-center justify-center">
                <BarChart className="h-5 w-5 text-primary mr-2" />
                <div className="flex-grow text-center">
                    <CardTitle>
                        {dashboard.name}
                    </CardTitle>
                    <CardDescription className="capitalize text-center">{dashboard.type}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-grow">
                {dashboard.deviceCount > 0 && (
                  <div className="flex items-center text-sm text-muted-foreground">
                      {/* Using a generic icon as device icon is not available */}
                  </div>
                )}
            </CardContent>
            <CardFooter className="flex justify-between gap-2">
               <Button asChild variant="outline" className="w-full">
                <Link href={`/dashboards/${dashboard.id}`}>
                    <Info className="mr-2 h-4 w-4" />
                    Details
                </Link>
              </Button>
               <Button asChild className="w-full">
                <Link href={`/dashboards/${dashboard.id}/iframe`}>
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  View Dashboard
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </>
  );
}
