
"use client";

import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ArrowRight, BarChart, HardDrive, Package, Siren, Download } from 'lucide-react';

const features = [
  {
    title: 'Dashboards',
    description: 'Visualize your device data and analytics.',
    href: '/dashboard/dashboards',
    icon: <BarChart className="h-8 w-8 text-primary" />,
  },
  {
    title: 'Devices',
    description: 'Manage and monitor your connected devices.',
    href: '/dashboard/devices',
    icon: <HardDrive className="h-8 w-8 text-primary" />,
  },
  {
    title: 'Assets',
    description: 'Organize your devices into logical groups.',
    href: '/dashboard/assets',
    icon: <Package className="h-8 w-8 text-primary" />,
  },
  {
    title: 'Alarms',
    description: 'View and manage alarms from your devices.',
    href: '/dashboard/alarms',
    icon: <Siren className="h-8 w-8 text-primary" />,
  },
  {
    title: 'Data Export',
    description: 'Export your device data in various formats.',
    href: '/dashboard/data-export',
    icon: <Download className="h-8 w-8 text-primary" />,
  },
];

export default function DashboardRootPage() {
    return (
        <div className="container mx-auto">
            <div className="space-y-4 mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Welcome to TBConnect</h1>
                <p className="text-muted-foreground">
                    Your central hub for managing ThingsBoard instances, dashboards, and devices.
                </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {features.map((feature) => (
                    <Link href={feature.href} key={feature.title} className="group">
                        <Card className="h-full flex flex-col transition-all duration-200 group-hover:shadow-lg group-hover:-translate-y-1">
                            <CardHeader className="flex-row items-center gap-4 space-y-0">
                                {feature.icon}
                                <div>
                                    <CardTitle>{feature.title}</CardTitle>
                                    <CardDescription>{feature.description}</CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-grow flex items-end justify-end">
                                 <div className="flex items-center text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                                    Go to {feature.title}
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
}
