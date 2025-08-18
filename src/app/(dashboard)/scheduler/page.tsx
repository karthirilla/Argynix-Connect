
// /app/(dashboard)/scheduler/page.tsx
"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Wifi, WifiOff, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function SchedulerPage() {
  return (
    <div className="container mx-auto px-0 md:px-4">
      <div className="space-y-4 mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Scheduler</h1>
        <p className="text-muted-foreground max-w-2xl">
          Manage your online and offline device schedules. Choose an option below to configure synchronization and commands.
        </p>
      </div>
      <div className="grid gap-8 md:grid-cols-2">
        <Card className="flex flex-col">
          <CardHeader>
            <div className="flex items-center gap-4">
                <div className="bg-primary/10 p-3 rounded-full">
                    <Wifi className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <CardTitle>Online Scheduler</CardTitle>
                    <CardDescription>Schedule commands for connected devices.</CardDescription>
                </div>
            </div>
          </CardHeader>
          <CardContent className="flex-grow">
            <p className="text-sm text-muted-foreground">
                Use this for real-time operations. Commands will be sent immediately to active devices. Ideal for instant configuration changes, reboots, or data requests.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild disabled>
              <Link href="/scheduler/online">
                Launch Online Scheduler
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
        <Card className="flex flex-col">
          <CardHeader>
            <div className="flex items-center gap-4">
                 <div className="bg-secondary p-3 rounded-full">
                    <WifiOff className="h-6 w-6 text-secondary-foreground" />
                </div>
                <div>
                    <CardTitle>Offline Scheduler</CardTitle>
                    <CardDescription>Queue commands for offline devices.</CardDescription>
                </div>
            </div>
          </CardHeader>
          <CardContent className="flex-grow">
             <p className="text-sm text-muted-foreground">
                Commands will be queued and sent to devices automatically when they next come online. Perfect for firmware updates or setting changes on intermittently connected devices.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild>
                <Link href="/scheduler/offline">
                    Launch Offline Scheduler
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
