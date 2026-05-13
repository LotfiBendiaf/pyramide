"use client";

import { useState, useEffect, useCallback } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  fetchMyNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/actions/notification.action";
import { INotification } from "@/models/notification.model";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<INotification[]>([]);
  const [loading, setLoading] = useState(false);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    const result = await fetchMyNotifications(1, 8);
    if (result.success && result.data) {
      setNotifications(result.data.notifications);
      setUnreadCount(result.data.unreadCount);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 60_000);
    return () => clearInterval(interval);
  }, [loadNotifications]);

  useEffect(() => {
    if (open) loadNotifications();
  }, [open, loadNotifications]);

  async function handleMarkAllRead() {
    await markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    toast.success("Toutes les notifications marquées comme lues");
  }

  async function handleMarkRead(id: string) {
    await markNotificationRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n._id?.toString() === id ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <span className="font-semibold text-sm">Notifications</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7"
              onClick={handleMarkAllRead}
            >
              Tout marquer lu
            </Button>
          )}
        </div>

        <ScrollArea className="max-h-[360px] overflow-hidden">
          {loading && notifications.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Chargement…
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Aucune notification
            </div>
          ) : (
            <div>
              {notifications.map((n, i) => (
                <div key={n._id?.toString() ?? i}>
                  <NotificationItem
                    notification={n}
                    onRead={handleMarkRead}
                    onClose={() => setOpen(false)}
                  />
                  {i < notifications.length - 1 && <Separator />}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {unreadCount > 8 && (
          <div className="border-t px-4 py-2 text-center">
            <span className="text-xs text-muted-foreground">
              +{unreadCount - 8} autres notifications non lues
            </span>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

function NotificationItem({
  notification,
  onRead,
  onClose,
}: {
  notification: INotification;
  onRead: (id: string) => void;
  onClose: () => void;
}) {
  const id = notification._id?.toString() ?? "";

  function handleClick() {
    if (!notification.read && id) onRead(id);
    onClose();
  }

  const content = (
    <div
      className={cn(
        "flex gap-3 px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors",
        !notification.read && "bg-primary/5"
      )}
      onClick={!notification.link ? handleClick : undefined}
    >
      {!notification.read && (
        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
      )}
      {notification.read && <span className="mt-1.5 h-2 w-2 shrink-0" />}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-tight">
          {notification.title}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
          {notification.body}
        </p>
        <p className="text-[10px] text-muted-foreground mt-1">
          {formatDistanceToNow(new Date(notification.createdAt), {
            addSuffix: true,
            locale: fr,
          })}
        </p>
      </div>
    </div>
  );

  if (notification.link) {
    return (
      <Link href={notification.link} onClick={handleClick}>
        {content}
      </Link>
    );
  }

  return content;
}
