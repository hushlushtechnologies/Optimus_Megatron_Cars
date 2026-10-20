"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  Bell,
  UserCheck,
  ArrowRightLeft,
  Repeat,
  Trophy,
  XCircle,
  Clock,
  AlertTriangle,
  CheckCheck,
  CalendarClock,
  Ban,
  BadgeCheck,
  BellRing,
  CheckCircle2,
  ClipboardList,
  LogIn,
  type LucideIcon,
} from "lucide-react";

import { IconButton } from "@/src/components/ui/icon-button";
import { Dropdown, DropdownTrigger, DropdownContent } from "@/src/components/ui/dropdown";

import {
  getMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/app/admin/notifications/actions";

import { cn } from "@/src/lib/utils/cn";
import type { AppNotification } from "@/src/lib/types/notification";

const POLL_INTERVAL_MS = 60_000;

const TYPE_ICON: Record<string, LucideIcon> = {
  lead_assigned: UserCheck,
  lead_reassigned: ArrowRightLeft,
  lead_stage_changed: Repeat,
  lead_won: Trophy,
  lead_lost: XCircle,
  follow_up_due: Clock,
  follow_up_overdue: AlertTriangle,
  test_drive_assigned: UserCheck,
  test_drive_reassigned: ArrowRightLeft,
  test_drive_rescheduled: CalendarClock,
  test_drive_new_request: ClipboardList,
  test_drive_approved: CheckCircle2,
  test_drive_rejected: XCircle,
  test_drive_cancelled: Ban,
  test_drive_completed: BadgeCheck,
  test_drive_reminder: BellRing,
  test_drive_overdue: AlertTriangle,
  test_drive_checked_in: LogIn,
};

function getHref(notification: AppNotification): string | null {
  if (notification.entity_type === "lead" && notification.entity_id) {
    return `/admin/leads/${notification.entity_id}`;
  }
  if (notification.entity_type === "leads") return "/admin/leads";
  if (notification.entity_type === "test_drive" && notification.entity_id) {
    return `/admin/test-drives/${notification.entity_id}`;
  }
  return null;
}

export function NotificationsDropdown() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [announcement, setAnnouncement] = useState("");

  const hasLoadedRef = useRef(false);
  const previousUnreadRef = useRef(0);

  useEffect(() => {
    let active = true;
    let latestRequest = 0;
    let announcementTimer: ReturnType<typeof setTimeout> | null = null;

    const refresh = () => {
      const requestId = ++latestRequest;

      // State updates occur in the asynchronous Promise callback,
      // not synchronously in the effect body.
      void getMyNotifications()
        .then((result) => {
          if (!active || requestId !== latestRequest) {
            return;
          }

          setNotifications(result.notifications);
          setUnreadCount(result.unreadCount);

          // Announce newly received notifications,
          // but skip the initial load.
          if (hasLoadedRef.current && result.unreadCount > previousUnreadRef.current) {
            const added = result.unreadCount - previousUnreadRef.current;

            setAnnouncement(`${added} new notification${added === 1 ? "" : "s"}`);

            if (announcementTimer !== null) {
              clearTimeout(announcementTimer);
            }

            announcementTimer = setTimeout(() => {
              if (active) {
                setAnnouncement("");
              }
            }, 5000);
          }

          hasLoadedRef.current = true;
          previousUnreadRef.current = result.unreadCount;
        })
        .catch((error: unknown) => {
          if (!active || requestId !== latestRequest) {
            return;
          }

          console.error("Failed to fetch notifications:", error);
        });
    };

    // Initial fetch
    refresh();

    // Poll every 60 seconds
    const interval = setInterval(refresh, POLL_INTERVAL_MS);

    // Refresh when the browser tab becomes visible
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        refresh();
      }
    };

    document.addEventListener("visibilitychange", onVisible);

    return () => {
      active = false;
      latestRequest++;

      clearInterval(interval);

      if (announcementTimer !== null) {
        clearTimeout(announcementTimer);
      }

      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  const handleOpen = (notification: AppNotification) => {
    if (notification.read_at) return;

    const readAt = new Date().toISOString();

    // Optimistic UI update
    setNotifications((prev) => prev.map((n) => (n.id === notification.id ? { ...n, read_at: readAt } : n)));

    setUnreadCount((count) => Math.max(0, count - 1));

    previousUnreadRef.current = Math.max(0, previousUnreadRef.current - 1);

    void markNotificationRead(notification.id).catch((error: unknown) => {
      console.error("Failed to mark notification as read:", error);
    });
  };

  const handleMarkAllRead = () => {
    const readAt = new Date().toISOString();

    // Optimistic UI update
    setNotifications((prev) =>
      prev.map((n) => ({
        ...n,
        read_at: n.read_at ?? readAt,
      })),
    );

    setUnreadCount(0);
    previousUnreadRef.current = 0;

    void markAllNotificationsRead().catch((error: unknown) => {
      console.error("Failed to mark all notifications as read:", error);
    });
  };

  return (
    <>
      <Dropdown>
        <DropdownTrigger>
          <IconButton
            aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
            variant="ghost"
            size="sm"
            className="relative"
          >
            <Bell className="size-4" />

            {unreadCount > 0 && (
              <span
                aria-hidden="true"
                className="bg-primary absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] leading-none font-semibold text-[#0b1220]"
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </IconButton>
        </DropdownTrigger>

        <DropdownContent align="end" className="w-80 p-0 sm:w-96">
          <div className="border-border flex items-center justify-between border-b px-4 py-3">
            <p className="text-body-sm text-text-primary font-medium">Notifications</p>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-caption text-primary-text hover:text-primary-hover flex items-center gap-1.5"
              >
                <CheckCheck className="size-3.5" aria-hidden="true" />
                Mark all read
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
              <Bell className="text-text-subtle size-6" aria-hidden="true" />

              <p className="text-body-sm text-text-muted">You&apos;re all caught up.</p>
            </div>
          ) : (
            <ul className="max-h-96 overflow-y-auto">
              {notifications.map((notification) => {
                const Icon = TYPE_ICON[notification.type] ?? Bell;
                const href = getHref(notification);
                const isUnread = !notification.read_at;

                const content = (
                  <div
                    className={cn(
                      "border-border hover:bg-card-hover flex items-start gap-3 border-b px-4 py-3 transition-colors last:border-0",
                      isUnread && "bg-primary/[0.04]",
                    )}
                  >
                    <span className="bg-card-hover text-primary mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full">
                      <Icon className="size-3.5" aria-hidden="true" />
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="text-body-sm text-text-primary flex items-center gap-1.5 font-medium">
                        {isUnread && <span className="sr-only">Unread:</span>}

                        {notification.title}

                        {isUnread && <span aria-hidden="true" className="bg-primary size-1.5 rounded-full" />}
                      </p>

                      {notification.description && (
                        <p className="text-caption text-text-muted mt-0.5">{notification.description}</p>
                      )}

                      <p className="text-caption text-text-subtle mt-1">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                );

                return (
                  <li key={notification.id}>
                    {href ? (
                      <Link href={href} onClick={() => handleOpen(notification)} className="block">
                        {content}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleOpen(notification)}
                        className="block w-full text-left"
                      >
                        {content}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </DropdownContent>
      </Dropdown>

      {/* Screen reader announcement outside the dropdown */}
      <div aria-live="polite" role="status" className="sr-only">
        {announcement}
      </div>
    </>
  );
}
