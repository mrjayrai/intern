import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Bell,
  Check,
  CheckCircle,
  Info,
  RefreshCcw,
  ShieldAlert,
} from 'lucide-react';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { Skeleton } from './ui/skeleton';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { api } from '../lib/api';

type NotificationCategory = 'INFO' | 'WARNING' | 'SLA_ALERT' | 'SUCCESS';

type NotificationRecord = {
  _id?: string;
  id?: string;
  title: string;
  message: string;
  type?: NotificationCategory | string;
  isRead?: boolean;
  read?: boolean;
  createdAt?: string;
  link?: string;
};

const categoryConfig: Record<NotificationCategory, { label: string; icon: typeof Bell; className: string; badge: 'default' | 'warning' | 'error' | 'success' | 'info' }> = {
  INFO: { label: 'Info', icon: Info, className: 'bg-blue-50 text-blue-700', badge: 'info' },
  WARNING: { label: 'Warning', icon: AlertTriangle, className: 'bg-amber-50 text-amber-700', badge: 'warning' },
  SLA_ALERT: { label: 'SLA Alert', icon: ShieldAlert, className: 'bg-red-50 text-red-700', badge: 'error' },
  SUCCESS: { label: 'Success', icon: CheckCircle, className: 'bg-emerald-50 text-emerald-700', badge: 'success' },
};

function getNotificationId(notification: NotificationRecord) {
  return notification._id || notification.id || '';
}

function normalizeCategory(type?: string): NotificationCategory {
  if (type === 'WARNING' || type === 'SLA_ALERT' || type === 'SUCCESS') return type;
  return 'INFO';
}

function isUnread(notification: NotificationRecord) {
  if (typeof notification.isRead === 'boolean') return !notification.isRead;
  if (typeof notification.read === 'boolean') return !notification.read;
  return false;
}

function formatTime(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const loadNotifications = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const [items, count] = await Promise.all([
        api.notifications<NotificationRecord[]>(),
        api.notificationUnreadCount<{ unreadCount: number }>(),
      ]);
      setNotifications(items);
      setUnreadCount(count.unreadCount);
    } catch (err) {
      setNotifications([]);
      setUnreadCount(0);
      setErrorMessage(err instanceof Error ? err.message : 'Unable to load notifications');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    if (open) {
      loadNotifications();
    }
  }, [open, loadNotifications]);

  const categoryCounts = useMemo(() => {
    return notifications.reduce<Record<NotificationCategory, number>>(
      (counts, notification) => {
        counts[normalizeCategory(notification.type)] += 1;
        return counts;
      },
      { INFO: 0, WARNING: 0, SLA_ALERT: 0, SUCCESS: 0 },
    );
  }, [notifications]);

  const handleMarkRead = async (notification: NotificationRecord) => {
    const id = getNotificationId(notification);
    if (!id || !isUnread(notification)) return;

    setNotifications((current) => current.map((item) => (
      getNotificationId(item) === id ? { ...item, isRead: true, read: true } : item
    )));
    setUnreadCount((current) => Math.max(current - 1, 0));

    try {
      await api.markNotificationRead(id);
    } catch {
      loadNotifications();
    }
  };

  const handleMarkAllRead = async () => {
    if (!unreadCount) return;

    const previous = notifications;
    const previousUnreadCount = unreadCount;
    setNotifications((current) => current.map((item) => ({ ...item, isRead: true, read: true })));
    setUnreadCount(0);

    try {
      await api.markAllNotificationsRead();
    } catch {
      setNotifications(previous);
      setUnreadCount(previousUnreadCount);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative h-10 w-10 p-0" aria-label="Notifications">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-xs font-semibold text-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[calc(100vw-2rem)] p-0 sm:w-[420px]">
        <div className="border-b border-border p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold">Notifications</h2>
              <p className="text-xs text-muted-foreground">{unreadCount} unread</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={loadNotifications} aria-label="Refresh notifications">
                <RefreshCcw className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleMarkAllRead} disabled={!unreadCount}>
                Mark all read
              </Button>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {(Object.keys(categoryConfig) as NotificationCategory[]).map((category) => (
              <Badge key={category} variant={categoryConfig[category].badge}>
                {categoryConfig[category].label}: {categoryCounts[category]}
              </Badge>
            ))}
          </div>
        </div>

        <div className="max-h-[440px] overflow-y-auto">
          {isLoading && (
            <div className="space-y-3 p-4">
              {[1, 2, 3].map((item) => (
                <Skeleton key={item} className="h-20 rounded-md" />
              ))}
            </div>
          )}

          {!isLoading && errorMessage && (
            <div className="p-4">
              <div className="rounded-md border border-red-200 bg-red-50 p-3">
                <p className="text-sm font-medium text-red-900">Could not load notifications</p>
                <p className="mt-1 text-xs text-red-700">{errorMessage}</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={loadNotifications}>
                  Retry
                </Button>
              </div>
            </div>
          )}

          {!isLoading && !errorMessage && !notifications.length && (
            <div className="flex min-h-48 flex-col items-center justify-center p-6 text-center">
              <Bell className="h-8 w-8 text-muted-foreground" />
              <p className="mt-3 font-medium">No notifications</p>
              <p className="mt-1 text-sm text-muted-foreground">Workflow alerts and updates will appear here.</p>
            </div>
          )}

          {!isLoading && !errorMessage && notifications.length > 0 && (
            <div className="divide-y divide-border">
              {notifications.map((notification) => {
                const id = getNotificationId(notification);
                const category = normalizeCategory(notification.type);
                const config = categoryConfig[category];
                const CategoryIcon = config.icon;
                const unread = isUnread(notification);

                return (
                  <div key={id || notification.title} className={`p-4 ${unread ? 'bg-blue-50/40' : 'bg-background'}`}>
                    <div className="flex items-start gap-3">
                      <div className={`mt-1 rounded-md p-2 ${config.className}`}>
                        <CategoryIcon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium">{notification.title}</p>
                            <p className="mt-1 text-sm text-muted-foreground">{notification.message}</p>
                          </div>
                          {unread && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-600" />}
                        </div>
                        <div className="mt-3 flex items-center justify-between gap-3">
                          <span className="text-xs text-muted-foreground">{formatTime(notification.createdAt)}</span>
                          <Button variant="ghost" size="sm" className="gap-1" disabled={!unread} onClick={() => handleMarkRead(notification)}>
                            <Check className="h-3 w-3" />
                            Read
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
