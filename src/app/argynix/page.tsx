// /app/argynix/page.tsx
"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ArrowRight, BarChart, HardDrive, Package, Siren, Download, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { getDevices, getDeviceAttributes, getDashboards, getAlarms } from '@/lib/api';
import type { ThingsboardDevice, ThingsboardDashboard, ThingsboardAlarm } from '@/lib/types';
import { StatsCard, StatsCardSkeleton } from '@/components/dashboard/stats-card';

const features = [
  {
    title: 'Dashboards',
    description: 'Visualize your device data and analytics.',
    href: '/argynix/dashboards',
    icon: <BarChart className="h-8 w-8 text-primary" />,
  },
  {
    title: 'Devices',
    description: 'Manage and monitor your connected devices.',
    href: '/argynix/devices',
    icon: <HardDrive className="h-8 w-8 text-primary" />,
  },
  {
    title: 'Assets',
    description: 'Organize your devices into logical groups.',
    href: '/argynix/assets',
    icon: <Package className="h-8 w-8 text-primary" />,
  },
  {
    title: 'Alarms',
    description: 'View and manage alarms from your devices.',
    href: '/argynix/alarms',
    icon: <Siren className="h-8 w-8 text-primary" />,
  },
  {
    title: 'Data Export',
    description: 'Export your device data in various formats.',
    href: '/argynix/data-export',
    icon: <Download className="h-8 w-8 text-primary" />,
  },
];

interface DeviceStats {
    total: number;
    active: number;
    inactive: number;
}

interface AlarmStats {
    critical: number;
    major: number;
    minor: number;
    warning: number;
}

export default function DashboardRootPage() {
    const [deviceStats, setDeviceStats] = useState<DeviceStats | null>(null);
    const [dashboardCount, setDashboardCount] = useState<number | null>(null);
    const [alarmStats, setAlarmStats] = useState<AlarmStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAllStats = async () => {
            setIsLoading(true);
            setError(null);
            const token = localStorage.getItem('tb_auth_token');
            const instanceUrl = localStorage.getItem('tb_instance_url');
            const customerId = localStorage.getItem('tb_customer_id');

            if (!token || !instanceUrl) {
                setError('Authentication details not found.');
                setIsLoading(false);
                return;
            }

            try {
                // Fetch all data in parallel
                const [tbDevices, tbDashboards, tbAlarms] = await Promise.all([
                    getDevices(token, instanceUrl, customerId),
                    getDashboards(token, instanceUrl, customerId),
                    getAlarms(token, instanceUrl)
                ]);

                // Process devices
                let activeDevices = 0;
                const devicesWithStatus = await Promise.all(tbDevices.map(async (d) => {
                    try {
                        const attributes = await getDeviceAttributes(token, instanceUrl, d.id.id);
                        const activeAttr = attributes.find(attr => attr.key === 'active');
                        return activeAttr?.value ? 'Active' : 'Inactive';
                    } catch {
                        return 'Inactive'; // Default to inactive on error
                    }
                }));
                activeDevices = devicesWithStatus.filter(s => s === 'Active').length;
                setDeviceStats({
                    total: tbDevices.length,
                    active: activeDevices,
                    inactive: tbDevices.length - activeDevices,
                });

                // Process dashboards
                setDashboardCount(tbDashboards.length);

                // Process alarms
                const alarms = { critical: 0, major: 0, minor: 0, warning: 0 };
                tbAlarms.forEach(alarm => {
                    switch (alarm.severity) {
                        case 'CRITICAL': alarms.critical++; break;
                        case 'MAJOR': alarms.major++; break;
                        case 'MINOR': alarms.minor++; break;
                        case 'WARNING': alarms.warning++; break;
                    }
                });
                setAlarmStats(alarms);

            } catch (e) {
                console.error(e);
                setError('Failed to fetch overview statistics.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchAllStats();
    }, []);
    
    const renderStats = () => {
        if (isLoading) {
            return (
                 <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {[...Array(4)].map((_, i) => <StatsCardSkeleton key={i} />)}
                </div>
            )
        }
        
        if (error) {
             return (
                <Card className="col-span-1 md:col-span-2 lg:col-span-4">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                         <CardTitle className="text-sm font-medium text-destructive">
                            Error
                         </CardTitle>
                         <AlertCircle className="h-4 w-4 text-destructive" />
                    </CardHeader>
                    <CardContent>
                        <p className="text-destructive">{error}</p>
                    </CardContent>
                </Card>
             )
        }
        
        return (
             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatsCard
                  title="Total Devices"
                  value={deviceStats?.total ?? 0}
                  icon={<HardDrive className="h-4 w-4 text-muted-foreground" />}
                  description="All registered devices"
                />
                <StatsCard
                  title="Active Devices"
                  value={deviceStats?.active ?? 0}
                  icon={<CheckCircle className="h-4 w-4 text-muted-foreground" />}
                  description="Devices currently online"
                />
                <StatsCard
                  title="Total Dashboards"
                  value={dashboardCount ?? 0}
                  icon={<BarChart className="h-4 w-4 text-muted-foreground" />}
                  description="Available visualization dashboards"
                />
                <StatsCard
                  title="Critical Alarms"
                  value={alarmStats?.critical ?? 0}
                  icon={<Siren className="h-4 w-4 text-muted-foreground" />}
                  description="High-priority active alarms"
                />
            </div>
        )
    }

    return (
        <div className="container mx-auto space-y-8">
            <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tight">Overview</h2>
            </div>
            
            {renderStats()}

            <div className="space-y-4">
                <h1 className="text-3xl font-bold tracking-tight">Welcome to Argynic-Connect</h1>
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
