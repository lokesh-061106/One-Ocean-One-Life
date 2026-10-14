"use client";

import * as React from "react";
import Link from "next/link";
import {
  Bell,
  Check,
  CheckCheck,
  Eye,
  Heart,
  Calendar,
  Users,
  AlertTriangle,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface Notification {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
  iconColor: string;
  time: string;
  read: boolean;
}

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "n1",
    title: "New Sighting Reported",
    description: "Spinner Dolphins spotted near Nagapattinam coast — 6 observed",
    href: "/sightings",
    icon: Eye,
    iconColor: "bg-ocean-blue/10 text-ocean-blue",
    time: "2 hours ago",
    read: false,
  },
  {
    id: "n2",
    title: "Contribution Verified",
    description: "Your ocean sound recording has been verified by the community",
    href: "/sounds",
    icon: Check,
    iconColor: "bg-ocean-green/10 text-ocean-green",
    time: "5 hours ago",
    read: false,
  },
  {
    id: "n3",
    title: "Event Reminder",
    description: "Beach Cleanup Drive starts tomorrow at 7:00 AM — Nagapattinam Beach",
    href: "/events/ev1",
    icon: Calendar,
    iconColor: "bg-ocean-warning/10 text-ocean-warning",
    time: "1 day ago",
    read: false,
  },
  {
    id: "n4",
    title: "Community Update",
    description: "New education post: Traditional Fishing Nets of Nagapattinam",
    href: "/education/ep1",
    icon: Users,
    iconColor: "bg-ocean-coral/10 text-ocean-coral",
    time: "2 days ago",
    read: true,
  },
  {
    id: "n5",
    title: "Marine Alert",
    description: "Whale Shark sighting reported in Gulf of Mannar — exercise caution",
    href: "/sightings",
    icon: AlertTriangle,
    iconColor: "bg-ocean-danger/10 text-ocean-danger",
    time: "3 days ago",
    read: true,
  },
  {
    id: "n6",
    title: "Your Post Got 50 Likes",
    description: "Your education post on Seaweed Farming has reached 50 reactions",
    href: "/education/ep5",
    icon: Heart,
    iconColor: "bg-ocean-coral/10 text-ocean-coral",
    time: "4 days ago",
    read: true,
  },
  {
    id: "n7",
    title: "Platform Update",
    description: "New Ocean Map features are now available — explore interactive hotspots",
    href: "/map",
    icon: Info,
    iconColor: "bg-ocean-info/10 text-ocean-info",
    time: "1 week ago",
    read: true,
  },
];

interface NotificationPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NotificationPanel({ open, onOpenChange }: NotificationPanelProps) {
  const [notifications, setNotifications] = React.useState(MOCK_NOTIFICATIONS);
  const panelRef = React.useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  /* Close on outside click */
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onOpenChange(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onOpenChange]);

  /* Close on ESC */
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onOpenChange]);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Trigger is rendered in the parent header */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-ocean-border/60 overflow-hidden animate-fade-in z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-ocean-border/60 bg-ocean-foam/30">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-ocean-navy">Notifications</h3>
              {unreadCount > 0 && (
                <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full bg-ocean-coral text-white text-[10px] font-bold">
                  {unreadCount}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 text-xs text-ocean-blue hover:text-ocean-blue/80 font-medium transition-colors"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* Notification list */}
          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-10 text-center text-ocean-muted">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => {
                const Icon = notification.icon;
                return (
                  <Link
                    key={notification.id}
                    href={notification.href}
                    onClick={() => {
                      markRead(notification.id);
                      onOpenChange(false);
                    }}
                    className={cn(
                      "flex items-start gap-3 px-4 py-3.5 border-b border-ocean-border/30 last:border-0 transition-colors",
                      notification.read
                        ? "bg-white hover:bg-ocean-foam/50"
                        : "bg-ocean-foam/50 hover:bg-ocean-foam"
                    )}
                  >
                    <div className={cn("mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full", notification.iconColor)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn(
                          "text-sm leading-snug",
                          notification.read ? "text-ocean-text-secondary" : "font-medium text-ocean-navy"
                        )}>
                          {notification.title}
                        </p>
                        {!notification.read && (
                          <span className="mt-1 h-2 w-2 rounded-full bg-ocean-blue shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-ocean-muted mt-0.5 line-clamp-2">
                        {notification.description}
                      </p>
                      <p className="text-[10px] text-ocean-muted/70 mt-1">
                        {notification.time}
                      </p>
                    </div>
                  </Link>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-ocean-border/60 bg-ocean-foam/30 text-center">
            <Link
              href="/notifications"
              onClick={() => onOpenChange(false)}
              className="text-xs font-medium text-ocean-blue hover:text-ocean-blue/80 transition-colors"
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
