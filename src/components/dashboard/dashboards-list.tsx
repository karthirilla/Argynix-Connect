
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Dashboard } from '@/lib/types';
import { BarChart, LayoutDashboard, Info } from 'lucide-react';
import Link from 'next/link';

export default function DashboardsList({ dashboards }: { dashboards: Dashboard[] }) {
  const [instanceUrl, setInstanceUrl] = useState('');

  useEffect(() => {
    // Client-side only: get the instance URL from localStorage
    const url = localStorage.getItem('tb_instance_url');
    setInstanceUrl(url || '');
  }, []);
  
  if (dashboards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg">
        <BarChart className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold">No Dashboards Found</h3>
        <p className="text-muted-foreground">This user does not have any dashboards assigned.</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {dashboards.map((dashboard) => (
          <Card key={dashboard.id} className="flex flex-col hover:shadow-lg transition-shadow">
            <CardHeader>
                <div className="flex items-center gap-4">
                    <div className="bg-primary/10 p-3 rounded-full">
                        <BarChart className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-grow">
                        <CardTitle className="text-lg">
                            {dashboard.name}
                        </CardTitle>
                        <CardDescription className="capitalize">{dashboard.type}</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-grow">
                {/* Content can be added here in future */}
            </CardContent>
            <CardFooter className="grid grid-cols-2 gap-2">
               <Button asChild variant="outline" className="w-full">
                <Link href={`/dashboards/${dashboard.id}`}>
                    <Info className="mr-2 h-4 w-4" />
                    Details
                </Link>
              </Button>
               <Button asChild className="w-full">
                <Link href={`/dashboards/${dashboard.id}/iframe`}>
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  View
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </>
  );
}
