"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  LogIn,
  Phone,
  Search,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Select } from "@/src/components/ui/select";
import { useTestDriveActions } from "@/src/components/test-drives/actions/use-test-drive-actions";
import { useCurrentMinute } from "@/src/hooks/use-current-minute";
import { DEFAULT_CHECK_IN_OPENS_MINUTES, getCheckInWindow } from "@/src/lib/utils/test-drive-check-in";
import { formatTime, formatTimeRange } from "@/src/lib/utils/test-drive-format";
import type { TestDriveArrival } from "@/src/lib/types/test-drive";

interface CheckInDeskClientProps {
  arrivals: TestDriveArrival[];
  /** location id -> minutes before the start that check-in opens. */
  opensBefore: Record<string, number>;
  showrooms: { id: string; name: string }[];
  initialSearch: string;
  showroomId: string;
  todayLabel: string;
}

interface ArrivalState {
  label: string;
  icon: LucideIcon;
  raw: string;
  canCheckIn: boolean;
}

function arrivalState(
  row: TestDriveArrival,
  nowMinute: number | null,
  opensBeforeMinutes: number,
): ArrivalState {
  if (row.status === "Completed")
    return { label: "Completed", icon: CheckCircle2, raw: "#38bdf8", canCheckIn: false };

  if (row.checked_in_at) {
    return {
      label: `Arrived ${formatTime(row.checked_in_at)}`,
      icon: CheckCircle2,
      raw: "#34d399",
      canCheckIn: false,
    };
  }

  // Before the browser has taken over there is no "now", so nothing is claimed. The dialog and the server check the window anyway.
  if (nowMinute === null) return { label: "Expected", icon: Clock, raw: "#94a3b8", canCheckIn: true };

  const window = getCheckInWindow({
    nowMs: nowMinute * 60_000,
    startIso: row.scheduled_start,
    endIso: row.scheduled_end,
    opensBeforeMinutes,
  });

  if (window.state === "too_early") {
    return {
      label: `Check-in opens ${formatTime(window.opensAtIso)}`,
      icon: Clock,
      raw: "#94a3b8",
      canCheckIn: false,
    };
  }
  if (window.state === "ended")
    return { label: "Appointment ended", icon: AlertTriangle, raw: "#f87171", canCheckIn: false };

  return window.late
    ? { label: "Running late", icon: AlertTriangle, raw: "#f59e0b", canCheckIn: true }
    : { label: "Ready for check-in", icon: LogIn, raw: "#38bdf8", canCheckIn: true };
}

export function CheckInDeskClient({
  arrivals,
  opensBefore,
  showrooms,
  initialSearch,
  showroomId,
  todayLabel,
}: CheckInDeskClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const actions = useTestDriveActions();
  const currentMinute = useCurrentMinute();
  const [searchValue, setSearchValue] = useState(initialSearch);

  // Search updates the address once typing pauses, so the server does the filtering.
  useEffect(() => {
    if (searchValue.trim() === (searchParams.get("q") ?? "")) return;

    const timeout = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (searchValue.trim()) params.set("q", searchValue.trim());
      else params.delete("q");
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }, 350);

    return () => clearTimeout(timeout);
  }, [searchValue, searchParams, pathname, router]);

  // Keeps the desk current while it sits open at reception: new bookings, arrivals checked in elsewhere.
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, 60_000);
    return () => clearInterval(id);
  }, [router]);

  const handleShowroomChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set("showroom", value);
    else params.delete("showroom");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const expected = arrivals.filter((a) => a.status !== "Completed" && !a.checked_in_at).length;
  const arrived = arrivals.filter((a) => a.status !== "Completed" && !!a.checked_in_at).length;
  const done = arrivals.filter((a) => a.status === "Completed").length;
  const hasFilters = !!searchValue.trim() || !!showroomId;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Link
          href="/admin/test-drives"
          className="text-body-sm text-text-muted hover:text-text-primary focus-visible:ring-primary inline-flex items-center gap-1.5 self-start rounded focus-visible:ring-2 focus-visible:outline-none"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Test Drives
        </Link>
        <div>
          <h1 className="text-h1">Check-in desk</h1>
          <p className="text-body-sm text-text-muted">
            {todayLabel}. Find an arriving customer, verify them, and check them in.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-[1fr_16rem]">
        <Input
          aria-label="Search today's appointments"
          placeholder="Search by test drive ID, customer, phone or vehicle…"
          leftIcon={<Search className="size-4" />}
          value={searchValue}
          onChange={(event) => setSearchValue(event.target.value)}
        />
        <Select
          label="Showroom"
          placeholder="All showrooms"
          options={showrooms.map((s) => ({ value: s.id, label: s.name }))}
          value={showroomId}
          onChange={(event) => handleShowroomChange(event.target.value)}
        />
      </div>

      <p role="status" aria-live="polite" className="text-body-sm text-text-muted">
        {expected} expected · {arrived} arrived · {done} completed
      </p>

      {arrivals.length === 0 ? (
        <div className="surface-card flex flex-col items-center gap-2 p-10 text-center">
          <Clock className="text-text-subtle size-8" aria-hidden="true" />
          <p className="text-body-lg text-text-primary">
            {hasFilters ? "No appointments match your search" : "No appointments today"}
          </p>
          <p className="text-body-sm text-text-muted">
            {hasFilters
              ? "Check the spelling, or clear the search and showroom filter."
              : "Confirmed test drives scheduled for today will appear here."}
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {arrivals.map((row) => {
            const state = arrivalState(
              row,
              currentMinute,
              opensBefore[row.location_id] ?? DEFAULT_CHECK_IN_OPENS_MINUTES,
            );
            const StateIcon = state.icon;

            return (
              <li
                key={row.id}
                className="surface-card flex flex-col gap-3 border-l-[3px] p-4 sm:flex-row sm:items-center sm:justify-between"
                style={{ borderLeftColor: state.raw }}
              >
                <div className="flex min-w-0 flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <p className="text-body-lg text-text-primary font-medium tabular-nums">
                      {formatTimeRange(row.scheduled_start, row.scheduled_end)}
                    </p>
                    <p
                      className="text-body-sm inline-flex items-center gap-1.5 font-medium text-[var(--omc-status-text)]"
                      style={{ "--omc-status-raw": state.raw } as React.CSSProperties}
                    >
                      <StateIcon className="size-4" aria-hidden="true" />
                      {state.label}
                    </p>
                  </div>

                  <Link
                    href={`/admin/test-drives/${row.id}`}
                    className="text-text-primary hover:text-primary-text truncate font-medium"
                  >
                    {row.customer_name}
                  </Link>

                  <p className="text-body-sm text-text-muted truncate">
                    {row.test_drive_number} · {row.customer_number} · {row.vehicle_title}
                  </p>
                  <p className="text-caption text-text-subtle truncate">
                    {row.location_name} · Host: {row.staff_name ?? "Unassigned"}
                  </p>

                  {row.customer_phone && (
                    <a
                      href={`tel:${row.customer_phone.replace(/[^\d+]/g, "")}`}
                      className="text-caption text-text-muted hover:text-primary-text focus-visible:ring-primary inline-flex items-center gap-1.5 self-start rounded focus-visible:ring-2 focus-visible:outline-none"
                    >
                      <Phone className="size-3.5" aria-hidden="true" />
                      {row.customer_phone}
                      <span className="sr-only"> (call)</span>
                    </a>
                  )}
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <Link
                    href={`/admin/test-drives/${row.id}`}
                    className="border-border text-body-sm text-text-primary hover:bg-card-hover inline-flex h-9 items-center justify-center rounded-md border px-3 transition-colors"
                  >
                    View
                  </Link>
                  {state.canCheckIn && (
                    <Button
                      size="sm"
                      leftIcon={<LogIn className="size-3.5" />}
                      onClick={() => actions.request("check_in", row)}
                    >
                      Check In
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {actions.dialogs}
    </div>
  );
}
