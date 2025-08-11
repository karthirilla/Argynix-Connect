
"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Dashboard } from '@/lib/types';
import { BarChart, ExternalLink, HardDrive, LayoutDashboard, Info } from 'lucide-react';

export default function DashboardsList({ dashboards }: { dashboards: Dashboard[] }) {
  
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
              <div className="flex items-start justify-between">
                <div className="flex-grow text-center">
                    <CardTitle className="flex items-center justify-center gap-2">
                        <BarChart className="h-5 w-5 text-primary" />
                        {dashboard.name}
                    </CardTitle>
                    <CardDescription className="capitalize">{dashboard.type}</CardDescription>
                </div>
                 <Button variant="ghost" size="icon" asChild>
                    <a href="#" target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                    </a>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-grow">
                {dashboard.deviceCount > 0 && (
                  <div className="flex items-center text-sm text-muted-foreground">
                      <HardDrive className="mr-2 h-4 w-4" />
                      <span>{dashboard.deviceCount} Devices</span>
                  </div>
                )}
            </CardContent>
            <CardFooter className="flex justify-between gap-2">
               <Button variant="outline" className="w-full">
                <Info className="mr-2 h-4 w-4" />
                Details
              </Button>
              <Button className="w-full">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Dashboard
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </>
  );
}
