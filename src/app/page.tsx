
// /app/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { ArrowRight, BarChart, HardDrive, Download, Siren, CheckCircle, PieChart, Info } from 'lucide-react';
import { getDevices, getDeviceAttributes, getDashboards, getAlarms, getUser, getTenantUsageInfo } from '@/lib/api';
import { StatsCard, StatsCardSkeleton } from '@/components/dashboard/stats-card';
import { Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Pie, Cell, Legend, BarChart as RechartsBarChart } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { AppSidebar } from '@/components/dashboard/sidebar';
import { AppHeader } from '@/components/dashboard/header';
import { Toaster } from '@/components/ui/toaster';
import { Progress } from '@/components/ui/progress';
import type { ThingsboardUsageInfo } from '@/lib/types';
import { cn } from '@/lib/utils';


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
    bySeverity: { name: string; value: number, fill: string }[];
}

const SEVERITY_COLORS: { [key: string]: string } = {
    CRITICAL: 'hsl(var(--destructive))',
    MAJOR: 'hsl(var(--chart-1))',
    MINOR: 'hsl(var(--chart-4))',
    WARNING: 'hsl(var(--chart-2))',
    INDETERMINATE: 'hsl(var(--muted-foreground))',
}

function UsageBar({ label, value, max }: { label: string, value: number, max: number }) {
    if (max === 0) return null;
    const percentage = (value / max) * 100;
    return (
        <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
                <span>{label}</span>
                <span>{value} / {max}</span>
            </div>
            <Progress value={percentage} />
        </div>
    )
}

function HomePageContent() {
    const [deviceStats, setDeviceStats] = useState<DeviceStats | null>(null);
    const [dashboardCount, setDashboardCount] = useState<number | null>(null);
    const [alarmStats, setAlarmStats] = useState<AlarmStats | null>(null);
    const [usageInfo, setUsageInfo] = useState<ThingsboardUsageInfo | null>(null);
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

            try {
                const tbDevices = await getDevices(token, instanceUrl, customerId);
                const deviceAttributesPromises = tbDevices.map(d => 
                    getDeviceAttributes(token, instanceUrl, d.id.id).catch(() => [])
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
                 setDeviceStats(null);
            }

            try {
                const user = await getUser(token, instanceUrl);
                const tbDashboards = await getDashboards(token, instanceUrl, user.customerId?.id);
                setDashboardCount(tbDashboards.length);

                if (user.authority === 'TENANT_ADMIN') {
                    const tenantUsage = await getTenantUsageInfo(token, instanceUrl);
                    setUsageInfo(tenantUsage);
                }

            } catch(e: any) {
                console.error("Could not fetch dashboard or usage stats:", e.message);
                setDashboardCount(null);
                setUsageInfo(null);
            }
            
            try {
                const tbAlarms = await getAlarms(token, instanceUrl);
                const alarms = { total: tbAlarms.length, critical: 0, major: 0, minor: 0, warning: 0, bySeverity: [] as {name: string, value: number, fill: string}[] };
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

                alarms.bySeverity = Object.entries(severityCounts).map(([name, value]) => ({ 
                    name: name.charAt(0) + name.slice(1).toLowerCase(), 
                    value,
                    fill: SEVERITY_COLORS[name] || SEVERITY_COLORS.INDETERMINATE,
                }));

                setAlarmStats(alarms);
            } catch(e: any) {
                console.error("Could not fetch alarms. User may not have permissions:", e.message);
                setAlarmStats(null);
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
                value={deviceStats && deviceStats.total > 0 ? `${Math.round((deviceStats.active / deviceStats.total) * 100) || 0}%` : 'N/A'}
                icon={<CheckCircle className="h-4 w-4 text-muted-foreground" />}
                description={deviceStats === null ? "Permission denied" : "Overall device uptime"}
                />
            </div>
        )
    }

    return (
        <div className="space-y-8">
             <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Welcome to Argynix-Connect</h1>
                <p className="text-muted-foreground max-w-2xl">
                    Your central hub for IoT management. Get a quick overview of your system, visualize data, and manage all your assets and devices from one place.
                </p>
            </div>

            <div className="space-y-4">
                <h2 className="text-2xl font-bold tracking-tight">System Overview</h2>
                 {renderStats()}
            </div>

            <div className="grid gap-8 lg:grid-cols-5">
                <div className="lg:col-span-3">
                     <Card className="h-full">
                        <CardHeader>
                            <CardTitle>Alarms by Severity</CardTitle>
                            <CardDescription>Distribution of active alarms.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             {isLoading ? <div className="h-[300px] w-full flex items-center justify-center"><Skeleton className="h-full w-full" /></div> :
                             (alarmStats && alarmStats.bySeverity.length > 0) ? (
                                <div className="h-[300px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RechartsBarChart data={alarmStats.bySeverity} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
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
                                            <Bar dataKey="value" name="Count" radius={[4, 4, 0, 0]}>
                                                {alarmStats.bySeverity.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                                ))}
                                            </Bar>
                                        </RechartsBarChart>
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
                </div>
           
                <div className="lg:col-span-2">
                    <Card className="h-full">
                        <CardHeader>
                            <CardTitle>Quick Access</CardTitle>
                            <CardDescription>Navigate to key areas.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 gap-4">
                           {features.map((feature) => (
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
            
            {usageInfo && (
                <div>
                    <Card>
                        <CardHeader>
                            <CardTitle>Tenant Usage</CardTitle>
                            <CardDescription>Your current resource usage against tenant profile limits.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
                            <UsageBar label="Devices" value={usageInfo.devices} max={usageInfo.maxDevices} />
                            <UsageBar label="Assets" value={usageInfo.assets} max={usageInfo.maxAssets} />
                            <UsageBar label="Customers" value={usageInfo.customers} max={usageInfo.maxCustomers} />
                            <UsageBar label="Users" value={usageInfo.users} max={usageInfo.maxUsers} />
                            <UsageBar label="Dashboards" value={usageInfo.dashboards} max={usageInfo.maxDashboards} />
                            <UsageBar label="Rule Chains" value={usageInfo.ruleChains} max={usageInfo.maxRuleChains} />
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}

export default function RootPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('tb_auth_token');
    if (token) {
      setIsAuthenticated(true);
    } else {
      router.replace('/login');
    }
    setIsAuthenticating(false);
  }, [router]);

  if (isAuthenticating) {
    return (
        <div className="flex h-screen w-screen items-center justify-center bg-background">
            <div className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                </div>
            </div>
        </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Render nothing while redirecting
  }

  return (
    <div 
      className={cn(
        "grid min-h-screen w-full transition-[grid-template-columns] duration-300 ease-in-out",
        isSidebarCollapsed 
          ? "md:grid-cols-[72px_1fr]" 
          : "md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]"
      )}
    >
      <AppSidebar 
        isCollapsed={isSidebarCollapsed} 
        setIsCollapsed={setIsSidebarCollapsed}
      />
      <div className="flex flex-col h-screen">
        <AppHeader />
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          <HomePageContent />
        </main>
        <Toaster />
      </div>
    </div>
  );
}
