// /app/(dashboard)/page.tsx
"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ArrowRight, BarChart, HardDrive, Package, Siren, Download, AlertCircle, CheckCircle } from 'lucide-react';
import { getDevices, getDeviceAttributes, getDashboards, getAlarms } from '@/lib/api';
import { StatsCard, StatsCardSkeleton } from '@/components/dashboard/stats-card';

const features = [
  {
    title: 'Dashboards',
    description: 'Visualize your device data and analytics.',
    href: '/dashboards',
    icon: <BarChart className="h-8 w-8 text-primary" />,
  },
  {
    title: 'Devices',
    description: 'Manage and monitor your connected devices.',
    href: '/devices',
    icon: <HardDrive className="h-8 w-8 text-primary" />,
  },
  {
    title: 'Assets',
    description: 'Organize your devices into logical groups.',
    href: '/assets',
    icon: <Package className="h-8 w-8 text-primary" />,
  },
  {
    title: 'Alarms',
    description: 'View and manage alarms from your devices.',
    href: '/alarms',
    icon: <Siren className="h-8 w-8 text-primary" />,
  },
  {
    title: 'Data Export',
    description: 'Export your device data in various formats.',
    href: '/data-export',
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

export default function HomePage() {
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
                // Fetch devices and dashboards first
                const [tbDevices, tbDashboards] = await Promise.all([
                    getDevices(token, instanceUrl, customerId),
                    getDashboards(token, instanceUrl, customerId),
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
                
                // Fetch alarms separately and handle permission errors
                try {
                    const tbAlarms = await getAlarms(token, instanceUrl);
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
                } catch(e: any) {
                    console.warn("Could not fetch alarms. User may not have permissions.", e);
                    // Set stats to null to indicate data is unavailable
                    setAlarmStats(null);
                }


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
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
                    <StatsCard
                    title="Total Devices"
                    value={deviceStats?.total ?? 0}
                    icon={<HardDrive className="h-4 w-4 text-muted-foreground" />}
                    description="All registered devices"
                    />
                </div>
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-400">
                    <StatsCard
                    title="Active Devices"
                    value={deviceStats?.active ?? 0}
                    icon={<CheckCircle className="h-4 w-4 text-muted-foreground" />}
                    description="Devices currently online"
                    />
                </div>
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-500">
                    <StatsCard
                    title="Total Dashboards"
                    value={dashboardCount ?? 0}
                    icon={<BarChart className="h-4 w-4 text-muted-foreground" />}
                    description="Available visualization dashboards"
                    />
                </div>
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-600">
                    <StatsCard
                    title="Critical Alarms"
                    value={alarmStats?.critical ?? 'N/A'}
                    icon={<Siren className="h-4 w-4 text-muted-foreground" />}
                    description={alarmStats === null ? "Permission denied" : "High-priority active alarms"}
                    />
                </div>
            </div>
        )
    }

    return (
        <div className="container mx-auto space-y-8">
             <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                <h1 className="text-3xl font-bold tracking-tight">Welcome to Argynix-Connect</h1>
                <p className="text-muted-foreground max-w-2xl">
                    Your central hub for managing ThingsBoard instances. Get a quick overview of your system, visualize data, and manage all your IoT assets and devices from one place.
                </p>
            </div>

            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
                <h2 className="text-2xl font-bold tracking-tight">System Overview</h2>
                 {renderStats()}
            </div>
           
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-700">
                <h2 className="text-2xl font-bold tracking-tight">Quick Access</h2>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {features.map((feature, index) => (
                        <div key={feature.title} className={`animate-in fade-in slide-in-from-bottom-4 duration-500`} style={{animationDelay: `${700 + (index + 1) * 100}ms`}}>
                            <Link href={feature.href} className="group">
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
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
