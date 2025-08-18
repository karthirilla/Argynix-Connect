// /app/(dashboard)/page.tsx
"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ArrowRight, BarChart, HardDrive, Package, Siren, Download, CheckCircle } from 'lucide-react';
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

    useEffect(() => {
        const fetchAllStats = async () => {
            setIsLoading(true);
            const token = localStorage.getItem('tb_auth_token');
            const instanceUrl = localStorage.getItem('tb_instance_url');
            const customerId = localStorage.getItem('tb_customer_id');

            if (!token || !instanceUrl) {
                setIsLoading(false);
                return;
            }

            // Fetch Device Stats
            try {
                const tbDevices = await getDevices(token, instanceUrl, customerId);
                const deviceAttributesPromises = tbDevices.map(d => 
                    getDeviceAttributes(token, instanceUrl, d.id.id).catch(() => []) // Gracefully handle errors for single devices
                );
                const allAttributes = await Promise.all(deviceAttributesPromises);

                const activeDevices = allAttributes.filter(attributes => {
                    const activeAttr = attributes.find(attr => attr.key === 'active');
                    return activeAttr?.value === true;
                }).length;
                
                setDeviceStats({
                    total: tbDevices.length,
                    active: activeDevices,
                    inactive: tbDevices.length - activeDevices,
                });
            } catch (e: any) {
                 console.error("Could not fetch device stats:", e.message);
                 setDeviceStats(null); // Set to null on error to show N/A
            }

            // Fetch Dashboard Stats
            try {
                const tbDashboards = await getDashboards(token, instanceUrl, customerId);
                setDashboardCount(tbDashboards.length);
            } catch(e: any) {
                console.error("Could not fetch dashboard stats:", e.message);
                setDashboardCount(null); // Set to null on error
            }
            
            // Fetch Alarm Stats
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
                console.error("Could not fetch alarms. User may not have permissions:", e.message);
                setAlarmStats(null); // Set to null on error
            }

            setIsLoading(false);
        };

        fetchAllStats();
    }, []);
    
    const renderStats = () => {
        if (isLoading) {
            return (
                 <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {[...Array(4)].map((_, i) => <StatsCardSkeleton key={i} />)}
                </div>
            )
        }
        
        return (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatsCard
                title="Total Devices"
                value={deviceStats?.total ?? 'N/A'}
                icon={<HardDrive className="h-4 w-4 text-muted-foreground" />}
                description={deviceStats === null ? "Permission denied" : "All registered devices"}
                />
                <StatsCard
                title="Active Devices"
                value={deviceStats?.active ?? 'N/A'}
                icon={<CheckCircle className="h-4 w-4 text-muted-foreground" />}
                description={deviceStats === null ? "Permission denied" : "Devices currently online"}
                />
                <StatsCard
                title="Total Dashboards"
                value={dashboardCount ?? 'N/A'}
                icon={<BarChart className="h-4 w-4 text-muted-foreground" />}
                description={dashboardCount === null ? "Permission denied" : "Available visualization dashboards"}
                />
                <StatsCard
                title="Critical Alarms"
                value={alarmStats?.critical ?? 'N/A'}
                icon={<Siren className="h-4 w-4 text-muted-foreground" />}
                description={alarmStats === null ? "Permission denied" : "High-priority active alarms"}
                />
            </div>
        )
    }

    return (
        <div className="container mx-auto space-y-8 px-0 md:px-4">
             <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Welcome to TBConnect</h1>
                <p className="text-muted-foreground max-w-2xl">
                    Your central hub for managing ThingsBoard instances. Get a quick overview of your system, visualize data, and manage all your IoT assets and devices from one place.
                </p>
            </div>

            <div className="space-y-4">
                <h2 className="text-2xl font-bold tracking-tight">System Overview</h2>
                 {renderStats()}
            </div>
           
            <div className="space-y-4">
                <h2 className="text-2xl font-bold tracking-tight">Quick Access</h2>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {features.map((feature, index) => (
                        <Link href={feature.href} key={feature.title} className="group">
                            <Card className="h-full flex flex-col transition-all duration-200 group-hover:shadow-lg group-hover:-translate-y-1">
                                <CardHeader className="flex flex-row items-start gap-4 space-y-0">
                                    <div className="shrink-0 rounded-full bg-primary/10 p-3">{feature.icon}</div>
                                    <div className="flex-1">
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
        </div>
    );
}
