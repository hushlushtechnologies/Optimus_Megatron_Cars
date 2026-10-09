"use client";

import { useEffect, useState } from "react";

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

/* =========================================================
   CONFIG
========================================================= */

const POLL_INTERVAL_MS = 60_000;

/* =========================================================
   ICON MAP
========================================================= */

const TYPE_ICON: Record<string, LucideIcon> = {
  lead_assigned: UserCheck,

  lead_reassigned: ArrowRightLeft,

  lead_stage_changed: Repeat,

  lead_won: Trophy,

  lead_lost: XCircle,

  follow_up_due: Clock,

  follow_up_overdue: AlertTriangle,
};

/* =========================================================
   TYPES
========================================================= */

interface NotificationState {
  notifications: AppNotification[];

  unreadCount: number;
}

/* =========================================================
   HELPERS
========================================================= */

function getHref(notification: AppNotification): string | null {
  if (notification.entity_type === "lead" && notification.entity_id) {
    return `/admin/leads/${notification.entity_id}`;
  }

  return null;
}

/* =========================================================
   COMPONENT
========================================================= */

export function NotificationsDropdown() {
  const [state, setState] = useState<NotificationState>({
    notifications: [],
    unreadCount: 0,
  });

  const { notifications, unreadCount } = state;

  /* =========================================================
     POLLING / VISIBILITY REFRESH
  ========================================================= */

  useEffect(() => {
    let cancelled = false;

    /*
     * State updates happen only after the asynchronous
     * request resolves.
     *
     * This avoids synchronously calling a setState-producing
     * function from inside the effect.
     */
    const loadNotifications = () => {
      void getMyNotifications()
        .then((result) => {
          if (cancelled) {
            return;
          }

          setState({
            notifications: result.notifications,

            unreadCount: result.unreadCount,
          });
        })
        .catch((error: unknown) => {
          if (cancelled) {
            return;
          }

          console.error("Unable to load notifications:", error);
        });
    };

    /*
     * Initial request.
     *
     * The state update occurs in the Promise callback,
     * not synchronously in the effect body.
     */
    void getMyNotifications()
      .then((result) => {
        if (cancelled) {
          return;
        }

        setState({
          notifications: result.notifications,

          unreadCount: result.unreadCount,
        });
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }

        console.error("Unable to load notifications:", error);
      });

    /* ---------------------------------------------------------
       POLLING
    --------------------------------------------------------- */

    const interval = window.setInterval(loadNotifications, POLL_INTERVAL_MS);

    /* ---------------------------------------------------------
       REFRESH WHEN TAB BECOMES VISIBLE
    --------------------------------------------------------- */

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        loadNotifications();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    /* ---------------------------------------------------------
       CLEANUP
    --------------------------------------------------------- */

    return () => {
      cancelled = true;

      window.clearInterval(interval);

      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  /* =========================================================
     MARK ONE AS READ
  ========================================================= */

  const handleOpen = (notification: AppNotification) => {
    if (notification.read_at) {
      return;
    }

    const readAt = new Date().toISOString();

    /*
     * Optimistic UI update.
     */
    setState((previous) => ({
      notifications: previous.notifications.map((item) =>
        item.id === notification.id
          ? {
              ...item,

              read_at: readAt,
            }
          : item,
      ),

      unreadCount: Math.max(0, previous.unreadCount - 1),
    }));

    void markNotificationRead(notification.id);
  };

  /* =========================================================
     MARK ALL AS READ
  ========================================================= */

  const handleMarkAllRead = () => {
    const readAt = new Date().toISOString();

    setState((previous) => ({
      notifications: previous.notifications.map((notification) => ({
        ...notification,

        read_at: notification.read_at ?? readAt,
      })),

      unreadCount: 0,
    }));

    void markAllNotificationsRead();
  };

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <Dropdown>
      {/* =====================================================
          TRIGGER
      ===================================================== */}

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

      {/* =====================================================
          CONTENT
      ===================================================== */}

      <DropdownContent align="end" className="w-80 p-0 sm:w-96">
        {/* ===================================================
            HEADER
        =================================================== */}

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

        {/* ===================================================
            EMPTY STATE
        =================================================== */}

        {notifications.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
            <Bell className="text-text-subtle size-6" aria-hidden="true" />

            <p className="text-body-sm text-text-muted">You&apos;re all caught up.</p>
          </div>
        ) : (
          /* =================================================
             NOTIFICATION LIST
          ================================================= */

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
                  {/* ICON */}

                  <span className="bg-card-hover text-primary mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full">
                    <Icon className="size-3.5" aria-hidden="true" />
                  </span>

                  {/* TEXT */}

                  <div className="min-w-0 flex-1">
                    <p className="text-body-sm text-text-primary flex items-center gap-1.5 font-medium">
                      {notification.title}

                      {isUnread && <span className="bg-primary size-1.5 rounded-full" aria-label="Unread" />}
                    </p>

                    {notification.description && (
                      <p className="text-caption text-text-muted mt-0.5">{notification.description}</p>
                    )}

                    <p className="text-caption text-text-subtle mt-1">
                      {formatDistanceToNow(new Date(notification.created_at), {
                        addSuffix: true,
                      })}
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
  );
}
