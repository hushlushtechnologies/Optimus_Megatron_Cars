"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Dropdown, DropdownTrigger, DropdownContent } from "@/src/components/ui/dropdown";
import { IconButton } from "@/src/components/ui/icon-button";
import { cn } from "@/src/lib/utils/cn";

interface Notification {
  id: string;
  title: string;
  description: string;
  createdAt: Date;
  isRead: boolean;
}

const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    title: "New reservation",
    description: "Ahmed R. reserved a Range Rover Autobiography.",
    createdAt: new Date(Date.now() - 1000 * 60 * 12),
    isRead: false,
  },
  {
    id: "2",
    title: "Test drive confirmed",
    description: "Test drive scheduled for a Porsche 911 GT3.",
    createdAt: new Date(Date.now() - 1000 * 60 * 55),
    isRead: false,
  },
  {
    id: "3",
    title: "New enquiry",
    description: "Enquiry received on a Bentley Continental GT.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4),
    isRead: false,
  },
  {
    id: "4",
    title: "Payment received",
    description: "AED 25,000 token booking payment confirmed.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 22),
    isRead: true,
  },
];

export function NotificationsDropdown() {
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <Dropdown>
      <DropdownTrigger>
        <IconButton
          aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
          variant="ghost"
          className="relative"
        >
          <Bell className="size-4" />
          {unreadCount > 0 && (
            <span
              aria-hidden="true"
              className="bg-primary absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full text-[10px] font-semibold text-[#0b1220]"
            >
              {unreadCount}
            </span>
          )}
        </IconButton>
      </DropdownTrigger>

      <DropdownContent className="w-80">
        <div className="border-border flex items-center justify-between border-b px-4 py-3">
          <p className="text-body-sm text-text-primary font-medium">Notifications</p>
          <button
            type="button"
            onClick={() => setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))}
            className="text-caption text-primary-text hover:text-primary-hover flex items-center gap-1"
          >
            <CheckCheck className="size-3.5" />
            Mark all as read
          </button>
        </div>

        <ul className="max-h-80 overflow-y-auto">
          {notifications.slice(0, 4).map((notification) => (
            <li key={notification.id} role="menuitem" className="border-border border-b last:border-0">
              <div className="hover:bg-card-hover flex gap-3 px-4 py-3">
                <span
                  aria-hidden="true"
                  className={cn(
                    "mt-1.5 size-1.5 shrink-0 rounded-full",
                    notification.isRead ? "bg-transparent" : "bg-primary",
                  )}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-body-sm text-text-primary">{notification.title}</p>
                  <p className="text-caption truncate">{notification.description}</p>
                  <p className="text-caption text-text-subtle mt-0.5">
                    {formatDistanceToNow(notification.createdAt, {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <Link
          href="/admin/notifications"
          className="text-body-sm text-primary-text hover:bg-card-hover block px-4 py-3 text-center"
        >
          View all notifications
        </Link>
      </DropdownContent>
    </Dropdown>
  );
}
