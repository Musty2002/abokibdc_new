import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "news" | "rate" | "alert" | "general";
  read: boolean;
  timestamp: string;
  data?: Record<string, unknown>;
}

const STORAGE_KEY = "aboki_notifications";
const READ_IDS_KEY = "aboki_read_notification_ids";
const CLEARED_IDS_KEY = "aboki_cleared_notification_ids";
const SYNC_EVENT = "aboki-notifications-sync";

function getStoredList(key: string): string[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveStoredList(key: string, ids: string[]) {
  try {
    localStorage.setItem(key, JSON.stringify(ids.slice(0, 200)));
  } catch {
    // Ignore storage errors
  }
}

function getStoredNotifications(): Notification[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveStoredNotifications(list: Notification[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, 50)));
    window.dispatchEvent(new CustomEvent(SYNC_EVENT));
  } catch {
    // Ignore storage errors
  }
}

function triggerBrowserPushNotification(title: string, body: string) {
  if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
    try {
      new Notification(title, {
        body,
        icon: "/favicon.png",
      });
    } catch {
      // Ignore if browser disallows direct constructor
    }
  }
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>(() => getStoredNotifications());

  // Sync across multiple hook instances (e.g. MobileHeader badge + NotificationPanel drawer)
  useEffect(() => {
    const handleSync = () => {
      setNotifications(getStoredNotifications());
    };
    window.addEventListener(SYNC_EVENT, handleSync);
    window.addEventListener("storage", handleSync);
    return () => {
      window.removeEventListener(SYNC_EVENT, handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, []);

  const addNotification = useCallback((notification: Notification) => {
    const current = getStoredNotifications();
    const clearedIds = getStoredList(CLEARED_IDS_KEY);
    if (clearedIds.includes(notification.id) || current.some((n) => n.id === notification.id)) {
      return;
    }
    const readIds = getStoredList(READ_IDS_KEY);
    const enriched: Notification = {
      ...notification,
      read: notification.read || readIds.includes(notification.id),
    };
    const updated = [enriched, ...current]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 50);
    saveStoredNotifications(updated);
    setNotifications(updated);
  }, []);

  // Load recent admin broadcast notifications from Firestore `notification_logs` on mount
  useEffect(() => {
    let mounted = true;

    async function loadBroadcastNotifications() {
      try {
        const { data } = await supabase
          .from("notification_logs")
          .select("*")
          .order("sent_at", { ascending: false })
          .limit(20);

        if (!mounted || !data || !Array.isArray(data)) return;

        const readIds = getStoredList(READ_IDS_KEY);
        const clearedIds = getStoredList(CLEARED_IDS_KEY);
        const current = getStoredNotifications();
        const existingMap = new Map<string, Notification>();

        current.forEach((item) => {
          if (!clearedIds.includes(item.id)) {
            existingMap.set(item.id, {
              ...item,
              read: item.read || readIds.includes(item.id),
            });
          }
        });

        data.forEach((log: any) => {
          const notifId = `broadcast-${log.id}`;
          if (clearedIds.includes(notifId)) return;
          if (!existingMap.has(notifId)) {
            existingMap.set(notifId, {
              id: notifId,
              title: log.title || "Aboki BDC Broadcast",
              message: log.body || "",
              type: "alert",
              read: readIds.includes(notifId),
              timestamp: log.sent_at || log.created_at || new Date().toISOString(),
              data: { targetType: log.target_type, targetCityId: log.target_city_id },
            });
          }
        });

        const merged = Array.from(existingMap.values())
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 50);

        saveStoredNotifications(merged);
        if (mounted) {
          setNotifications(merged);
        }
      } catch (err) {
        console.warn("Could not load broadcast notifications:", err);
      }
    }

    loadBroadcastNotifications();
    return () => {
      mounted = false;
    };
  }, []);

  // Subscribe to real-time Admin Broadcasts (`notification_logs`) and Rate Updates (`branch_rates`)
  useEffect(() => {
    const broadcastChannel = supabase
      .channel("admin-broadcasts")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notification_logs",
        },
        (payload) => {
          const log = payload.new;
          if (!log || !log.id) return;

          const notifId = `broadcast-${log.id}`;
          const existing = getStoredNotifications();
          if (existing.some((n) => n.id === notifId)) return;

          const newNotification: Notification = {
            id: notifId,
            title: log.title || "🔔 Aboki BDC Alert",
            message: log.body || "",
            type: "alert",
            read: false,
            timestamp: log.sent_at || log.created_at || new Date().toISOString(),
            data: { targetType: log.target_type, targetCityId: log.target_city_id },
          };

          addNotification(newNotification);

          toast({
            title: `🔔 ${newNotification.title}`,
            description: newNotification.message,
            duration: 7000,
          });

          triggerBrowserPushNotification(newNotification.title, newNotification.message);
        }
      )
      .subscribe();

    const rateChannel = supabase
      .channel("rate-updates")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "branch_rates",
        },
        (payload) => {
          const oldRate = Number(payload.old?.buy_rate || 0);
          const newRate = Number(payload.new?.buy_rate || 0);
          if (oldRate <= 0 || newRate <= 0 || oldRate === newRate) return;

          const percentChange = Math.abs(((newRate - oldRate) / oldRate) * 100);
          if (percentChange >= 0.2) {
            const newNotification: Notification = {
              id: `rate-${payload.new.id}-${Date.now()}`,
              title: "📈 Live Exchange Rate Updated",
              message: `Buy rate updated from ₦${oldRate.toLocaleString()} to ₦${newRate.toLocaleString()}`,
              type: "rate",
              read: false,
              timestamp: new Date().toISOString(),
              data: { oldRate, newRate },
            };

            addNotification(newNotification);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(broadcastChannel);
      supabase.removeChannel(rateChannel);
    };
  }, [addNotification]);

  const markAsRead = useCallback((id: string) => {
    const readIds = getStoredList(READ_IDS_KEY);
    if (!readIds.includes(id)) {
      saveStoredList(READ_IDS_KEY, [id, ...readIds]);
    }
    const updated = getStoredNotifications().map((n) =>
      n.id === id ? { ...n, read: true } : n
    );
    saveStoredNotifications(updated);
    setNotifications(updated);
  }, []);

  const markAllAsRead = useCallback(() => {
    const current = getStoredNotifications();
    const readIds = Array.from(new Set([...getStoredList(READ_IDS_KEY), ...current.map((n) => n.id)]));
    saveStoredList(READ_IDS_KEY, readIds);
    const updated = current.map((n) => ({ ...n, read: true }));
    saveStoredNotifications(updated);
    setNotifications(updated);
  }, []);

  const clearAll = useCallback(() => {
    const current = getStoredNotifications();
    const clearedIds = Array.from(
      new Set([...getStoredList(CLEARED_IDS_KEY), ...current.map((n) => n.id)])
    );
    saveStoredList(CLEARED_IDS_KEY, clearedIds);
    saveStoredNotifications([]);
    setNotifications([]);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearAll,
  };
}
