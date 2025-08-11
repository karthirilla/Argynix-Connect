
"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Dashboard } from '@/lib/types';
import { BarChart, LayoutDashboard, Info } from 'lucide-react';
import Link from 'next/link';
import { SmartExportModal } from './smart-export-modal';


export default function DashboardsList({ dashboards }: { dashboards: Dashboard[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDashboard, setSelectedDashboard] = useState<Dashboard | null>(null);

  const handleSmartExportClick = (dashboard: Dashboard) => {
    setSelectedDashboard(dashboard);
    setIsModalOpen(true);
  };
  
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
                <div className="flex-grow">
                    <CardTitle className="flex items-center justify-center gap-2">
                        <BarChart className="h-5 w-5 text-primary" />
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
                <Link href={`/dashboard/dashboards/${dashboard.id}`}>
                    <Info className="mr-2 h-4 w-4" />
                    Details
                </Link>
              </Button>
              <Button className="w-full" disabled>
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Dashboard
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
       {selectedDashboard && (
        <SmartExportModal 
          dashboard={selectedDashboard}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
}