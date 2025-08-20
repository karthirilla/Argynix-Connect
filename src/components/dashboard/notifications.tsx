
"use client";

import { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  getNotifications,
  getUnreadNotificationsCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getUser
} from '@/lib/api';
import type { ThingsboardNotification, ThingsboardUser } from '@/lib/types';
import { Bell, Loader2, Trash2, CheckCheck, Eye, Info, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { formatDistanceToNow } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

const getIconForNotificationType = (type: string) => {
    switch(type) {
        case 'ALARM': return <Info className="h-5 w-5 text-destructive" />;
        default: return <Info className="h-5 w-5 text-muted-foreground" />;
    }
}

export function Notifications() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<ThingsboardNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentUser, setCurrentUser] = useState<ThingsboardUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const { toast } = useToast();

  const token = useMemo(() => typeof window !== 'undefined' ? localStorage.getItem('tb_auth_token') : null, []);
  const instanceUrl = useMemo(() => typeof window !== 'undefined' ? localStorage.getItem('tb_instance_url') : null, []);
  
  const isAdmin = currentUser?.authority === 'TENANT_ADMIN' || currentUser?.authority === 'SYS_ADMIN';

  const fetchInitialData = useCallback(async () => {
    if (!token || !instanceUrl) return;
    setIsLoading(true);
    try {
        const [user, notifsResponse, countResponse] = await Promise.all([
            getUser(token, instanceUrl),
            getNotifications(token, instanceUrl),
            getUnreadNotificationsCount(token, instanceUrl),
        ]);
        setCurrentUser(user);
        setNotifications(notifsResponse.data);
        setUnreadCount(countResponse.count);
    } catch (e: any) {
        console.error("Failed to fetch notifications:", e.message);
    } finally {
        setIsLoading(false);
    }
  }, [token, instanceUrl]);


  useEffect(() => {
    if (isOpen) {
      fetchInitialData();
    }
  }, [isOpen, fetchInitialData]);
  
  const fetchCount = useCallback(async () => {
    if (!token || !instanceUrl) return;
    try {
        const countResponse = await getUnreadNotificationsCount(token, instanceUrl);
        setUnreadCount(countResponse.count);
    } catch {}
  }, [token, instanceUrl]);

  useEffect(() => {
    fetchCount();
    const interval = setInterval(fetchCount, 30000); // Poll for new count every 30s
    return () => clearInterval(interval);
  }, [fetchCount])

  const handleMarkAsRead = async (id: string) => {
    if (!token || !instanceUrl) return;
    setIsProcessing(id);
    try {
      await markNotificationAsRead(token, instanceUrl, id);
      await fetchInitialData(); // Refetch all data
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to mark as read.' });
    } finally {
        setIsProcessing(null);
    }
  };

  const handleMarkAllRead = async () => {
    if (!token || !instanceUrl) return;
    setIsProcessing('all');
    try {
      await markAllNotificationsAsRead(token, instanceUrl);
      await fetchInitialData(); // Refetch all data
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to mark all as read.' });
    } finally {
        setIsProcessing(null);
    }
  }

  const handleDelete = async (id: string) => {
    if (!token || !instanceUrl) return;
    setIsProcessing(id);
    try {
      await deleteNotification(token, instanceUrl, id);
      await fetchInitialData(); // Refetch all data
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete notification.' });
    } finally {
        setIsProcessing(null);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
              {unreadCount}
            </span>
          )}
           <span className="sr-only">Open notifications</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 md:w-96 p-0" align="end">
        <Card className="border-0">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle>Notifications</CardTitle>
                <div className="flex items-center gap-2">
                    {notifications.length > 0 && unreadCount > 0 && (
                        <Button variant="link" size="sm" onClick={handleMarkAllRead} disabled={isProcessing === 'all'} className="p-0 h-auto">
                            {isProcessing === 'all' && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                            Mark all as read
                        </Button>
                    )}
                    {isAdmin && (
                        <Button asChild variant="ghost" size="icon" className="h-8 w-8">
                            <Link href="/admin/notifications"><Settings className="h-4 w-4"/></Link>
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent className="max-h-[50vh] overflow-y-auto">
                {isLoading ? (
                    <div className="flex items-center justify-center p-8">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : notifications.length > 0 ? (
                    <div className="space-y-2">
                        {notifications.map(notif => (
                            <div
                                key={notif.id.id}
                                className={cn(
                                    "flex items-start gap-4 p-3 rounded-lg relative",
                                    notif.status === 'SENT' && "bg-primary/5"
                                )}
                            >
                                {isProcessing === notif.id.id && <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10"><Loader2 className="h-6 w-6 animate-spin" /></div>}
                                <div className="mt-1">{getIconForNotificationType(notif.type)}</div>
                                <div className="flex-1">
                                    <p className="font-semibold text-sm leading-tight">{notif.subject}</p>
                                    <p className="text-xs text-muted-foreground">{notif.text}</p>
                                     <p className="text-xs text-muted-foreground mt-1">
                                        {formatDistanceToNow(new Date(notif.createdTime), { addSuffix: true })}
                                    </p>
                                </div>
                                <div className="flex flex-col gap-1">
                                    {notif.status === 'SENT' && (
                                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleMarkAsRead(notif.id.id)}>
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                    )}
                                     <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                             <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/70 hover:text-destructive">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                <AlertDialogDescription>This will permanently delete this notification.</AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDelete(notif.id.id)}>Delete</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center p-8 text-muted-foreground">
                        <CheckCheck className="mx-auto h-10 w-10 mb-2" />
                        <p className="font-medium">You're all caught up!</p>
                        <p className="text-sm">You have no new notifications.</p>
                    </div>
                )}
            </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
}
