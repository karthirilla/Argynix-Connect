"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Dashboard } from '@/lib/types';
import { SmartExportModal } from './smart-export-modal';
import { BarChart, ExternalLink, HardDrive } from 'lucide-react';

export default function DashboardsList({ dashboards }: { dashboards: Dashboard[] }) {
  const [selectedDashboard, setSelectedDashboard] = useState<Dashboard | null>(null);

  const handleExportClick = (dashboard: Dashboard) => {
    setSelectedDashboard(dashboard);
  };
  
  if (dashboards.length === 0) {
    return (
      <div class="flex flex-col items-center justify-center h-64">
        <h3 class="text-xl font-semibold">No Dashboards Found</h3>
        <p class="text-muted-foreground">This user does not have any dashboards assigned.</p>
      </div>
    )
  }

  return (
    <>
      <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {dashboards.map((dashboard) => (
          <Card key={dashboard.id} class="flex flex-col">
            <CardHeader>
              <div class="flex items-start justify-between">
                <div>
                    <CardTitle class="flex items-center gap-2">
                        <BarChart class="h-5 w-5 text-primary" />
                        {dashboard.name}
                    </CardTitle>
                    <CardDescription class="capitalize">{dashboard.type}</CardDescription>
                </div>
                 <Button variant="ghost" size="icon" asChild>
                    <a href="#" target="_blank" rel="noopener noreferrer">
                        <ExternalLink class="h-4 w-4" />
                    </a>
                </Button>
              </div>
            </CardHeader>
            <CardContent class="flex-grow">
                {dashboard.deviceCount > 0 && (
                  <div class="flex items-center text-sm text-muted-foreground">
                      <HardDrive class="mr-2 h-4 w-4" />
                      <span>{dashboard.deviceCount} Devices</span>
                  </div>
                )}
            </CardContent>
            <CardFooter>
              <Button class="w-full bg-accent hover:bg-accent/90" onClick={() => handleExportClick(dashboard)}>
                Smart Export
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
      {selectedDashboard && (
        <SmartExportModal
          dashboard={selectedDashboard}
          isOpen={!!selectedDashboard}
          onClose={() => setSelectedDashboard(null)}
        />
      )}
    </>
  );
}
