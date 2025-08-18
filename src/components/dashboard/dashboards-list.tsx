
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Dashboard } from '@/lib/types';
import { BarChart, LayoutDashboard, Info, Search, Lightbulb } from 'lucide-react';
import Link from 'next/link';
import { Input } from '../ui/input';
import { SmartExportModal } from './smart-export-modal';

export default function DashboardsList({ dashboards }: { dashboards: Dashboard[] }) {
  const [filter, setFilter] = useState('');
  const [selectedDashboard, setSelectedDashboard] = useState<Dashboard | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredDashboards = dashboards.filter(dashboard => 
    dashboard.name.toLowerCase().includes(filter.toLowerCase()) ||
    dashboard.type.toLowerCase().includes(filter.toLowerCase())
  );

  const handleSmartExportClick = (dashboard: Dashboard) => {
    setSelectedDashboard(dashboard);
    setIsModalOpen(true);
  };

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
    <div className="space-y-4">
        <div className="flex justify-between items-center">
             <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Filter by name or type..."
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="pl-10"
                />
            </div>
        </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredDashboards.map((dashboard) => (
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
                 <Button variant="secondary" size="sm" className="w-full" onClick={() => handleSmartExportClick(dashboard)}>
                    <Lightbulb className="mr-2 h-4 w-4" />
                    Smart Export
                </Button>
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
       {filteredDashboards.length === 0 && (
            <div className="text-center text-muted-foreground py-10 col-span-full">
                No dashboards match your filter.
            </div>
        )}
        {selectedDashboard && (
            <SmartExportModal 
                dashboard={selectedDashboard}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        )}
    </div>
  );
}
