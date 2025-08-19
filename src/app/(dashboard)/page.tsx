// /app/(dashboard)/page.tsx
"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ArrowRight, BarChart, HardDrive, Package, Siren, Download, CheckCircle, PieChart, AlertTriangle } from 'lucide-react';
import { getDevices, getDeviceAttributes, getDashboards, getAlarms } from '@/lib/api';
import { StatsCard, StatsCardSkeleton } from '@/components/dashboard/stats-card';
import { Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Pie, Cell, Legend } from 'recharts';

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
    types: { name: string; value: number }[];
}

interface AlarmStats {
    total: number;
    critical: number;
    major: number;
    minor: number;
    warning: number;
    bySeverity: { name: string; value: number }[];
}

const SEVERITY_COLORS: { [key: string]: string } = {
    CRITICAL: 'hsl(var(--destructive))',
    MAJOR: 'hsl(var(--chart-1))',
    MINOR: 'hsl(var(--chart-4))',
    WARNING: 'hsl(var(--chart-2))',
    INDETERMINATE: 'hsl(var(--muted-foreground))',
}

const PIE_CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];


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

                const deviceTypes = tbDevices.reduce((acc, device) => {
                    acc[device.type] = (acc[device.type] || 0) + 1;
                    return acc;
                }, {} as Record<string, number>);
                
                setDeviceStats({
                    total: tbDevices.length,
                    active: activeDevices,
                    inactive: tbDevices.length - activeDevices,
                    types: Object.entries(deviceTypes).map(([name, value]) => ({ name, value }))
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
                const alarms = { total: tbAlarms.length, critical: 0, major: 0, minor: 0, warning: 0, bySeverity: [] as {name: string, value: number}[] };
                const severityCounts: Record<string, number> = {};

                tbAlarms.forEach(alarm => {
                    severityCounts[alarm.severity] = (severityCounts[alarm.severity] || 0) + 1;
                    switch (alarm.severity) {
                        case 'CRITICAL': alarms.critical++; break;
                        case 'MAJOR': alarms.major++; break;
                        case 'MINOR': alarms.minor++; break;
                        case 'WARNING': alarms.warning++; break;
                    }
                });

                alarms.bySeverity = Object.entries(severityCounts).map(([name, value]) => ({ name: name.charAt(0) + name.slice(1).toLowerCase(), value }));

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
                description={deviceStats === null ? "Permission denied" : `${deviceStats.active} active`}
                />
                <StatsCard
                title="Active Alarms"
                value={alarmStats?.total ?? 'N/A'}
                icon={<Siren className="h-4 w-4 text-muted-foreground" />}
                description={alarmStats === null ? "Permission denied" : `${alarmStats.critical} critical`}
                />
                <StatsCard
                title="Total Dashboards"
                value={dashboardCount ?? 'N/A'}
                icon={<BarChart className="h-4 w-4 text-muted-foreground" />}
                description={dashboardCount === null ? "Permission denied" : "Available visualization dashboards"}
                />
                 <StatsCard
                title="Connectivity"
                value={deviceStats ? `${Math.round((deviceStats.active / deviceStats.total) * 100) || 0}%` : 'N/A'}
                icon={<CheckCircle className="h-4 w-4 text-muted-foreground" />}
                description={deviceStats === null ? "Permission denied" : "Overall device uptime"}
                />
            </div>
        )
    }

    return (
        <div className="container mx-auto space-y-8 px-0 md:px-4">
             <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Welcome to Argynix-Connect</h1>
                <p className="text-muted-foreground max-w-2xl">
                    Your central hub for managing ThingsBoard instances. Get a quick overview of your system, visualize data, and manage all your IoT assets and devices from one place.
                </p>
            </div>

            <div className="space-y-4">
                <h2 className="text-2xl font-bold tracking-tight">System Overview</h2>
                 {renderStats()}
            </div>

            <div className="grid gap-8 lg:grid-cols-5">
                <div className="lg:col-span-3 grid gap-8">
                     <Card>
                        <CardHeader>
                            <CardTitle>Alarms by Severity</CardTitle>
                            <CardDescription>Distribution of active alarms.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             {isLoading ? <div className="h-[300px] w-full flex items-center justify-center"><StatsCardSkeleton /></div> :
                             (alarmStats && alarmStats.bySeverity.length > 0) ? (
                                <div className="h-[300px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={alarmStats.bySeverity} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                            <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                                            <Tooltip
                                                cursor={{ fill: 'hsl(var(--muted))' }}
                                                contentStyle={{
                                                    background: 'hsl(var(--background))',
                                                    border: '1px solid hsl(var(--border))',
                                                    borderRadius: 'var(--radius)',
                                                }}
                                            />
                                            <Bar dataKey="value" name="Count" radius={[4, 4, 0, 0]} fill="hsl(var(--primary))" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                             ) : (
                                <div className="h-[300px] flex flex-col items-center justify-center text-center text-muted-foreground bg-muted/50 rounded-lg">
                                    <CheckCircle className="h-10 w-10 mb-2" />
                                    <p className="font-medium">No Active Alarms</p>
                                    <p className="text-sm">Your system is currently clear of all alarms.</p>
                                </div>
                             )}
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                            <CardTitle>Devices by Type</CardTitle>
                            <CardDescription>Distribution of registered device types.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             {isLoading ? <div className="h-[300px] w-full flex items-center justify-center"><StatsCardSkeleton /></div> :
                             (deviceStats && deviceStats.types.length > 0) ? (
                                <div className="h-[300px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                         <PieChart>
                                            <Pie
                                                data={deviceStats.types}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
                                                    const RADIAN = Math.PI / 180;
                                                    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                                                    const x = cx + radius * Math.cos(-midAngle * RADIAN);
                                                    const y = cy + radius * Math.sin(-midAngle * RADIAN);
                                                    return (
                                                        <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="text-xs font-bold">
                                                        {`${(percent * 100).toFixed(0)}%`}
                                                        </text>
                                                    );
                                                }}
                                                outerRadius={120}
                                                fill="#8884d8"
                                                dataKey="value"
                                                nameKey="name"
                                            >
                                                {deviceStats.types.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={PIE_CHART_COLORS[index % PIE_CHART_COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                 contentStyle={{
                                                    background: 'hsl(var(--background))',
                                                    border: '1px solid hsl(var(--border))',
                                                    borderRadius: 'var(--radius)',
                                                }}
                                            />
                                            <Legend iconSize={10} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                             ): (
                                <div className="h-[300px] flex flex-col items-center justify-center text-center text-muted-foreground bg-muted/50 rounded-lg">
                                    <HardDrive className="h-10 w-10 mb-2" />
                                    <p className="font-medium">No Devices Found</p>
                                    <p className="text-sm">There are no devices registered in the system.</p>
                                </div>
                             )}
                        </CardContent>
                    </Card>
                </div>
           
                <div className="space-y-8 lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Quick Access</CardTitle>
                            <CardDescription>Navigate to key areas of the application.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 gap-4">
                           {features.slice(0,4).map((feature, index) => (
                                <Link href={feature.href} key={feature.title} className="group">
                                    <div className="flex flex-col items-center text-center p-4 rounded-lg hover:bg-muted/50 transition-colors">
                                        <div className="mb-3 shrink-0 rounded-full bg-primary/10 p-3">{feature.icon}</div>
                                        <p className="text-sm font-medium">{feature.title}</p>
                                    </div>
                                </Link>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
