"use client";

import { useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import type { TestDrivePermissions } from "@/src/lib/utils/test-drive-permissions";
import { TriangleAlert } from "lucide-react";
import { CalendarToolbar } from "@/src/components/test-drives/calendar/calendar-toolbar";
import { CalendarMonthView } from "@/src/components/test-drives/calendar/calendar-month-view";
import { CalendarTimeGrid } from "@/src/components/test-drives/calendar/calendar-time-grid";
import { CalendarAgenda } from "@/src/components/test-drives/calendar/calendar-agenda";
import { CalendarLegend } from "@/src/components/test-drives/calendar/calendar-legend";
import { TestDriveQuickView } from "@/src/components/test-drives/calendar/test-drive-quick-view";
import { useTestDriveActions } from "@/src/components/test-drives/actions/use-test-drive-actions";
import { useCurrentMinute } from "@/src/hooks/use-current-minute";
import { useReducedMotion } from "@/src/hooks/use-reduced-motion";
import {
  CALENDAR_PARAM_KEYS,
  CALENDAR_ROW_CAP,
  formatCalendarRangeLabel,
  getCalendarRange,
  getNowInDubai,
  getRangeDays,
  groupEventsByDay,
  shiftCalendarDate,
  type TestDriveCalendarParams,
  type TestDriveCalendarView,
} from "@/src/lib/utils/test-drive-calendar";
import { getDubaiToday } from "@/src/lib/utils/test-drive-format";
import type { TestDriveCalendarFilterOptions, TestDriveListRow } from "@/src/lib/types/test-drive";

interface TestDriveCalendarProps {
  rows: TestDriveListRow[];
  truncated: boolean;
  params: TestDriveCalendarParams;
  options: TestDriveCalendarFilterOptions;
  /** Whether the current user may approve and reject requests. */
  permissions: TestDrivePermissions;
}

export function TestDriveCalendar({ rows, truncated, params, options, permissions }: TestDriveCalendarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const prefersReducedMotion = useReducedMotion();
  const currentMinute = useCurrentMinute();

  const [selected, setSelected] = useState<TestDriveListRow | null>(null);
  const actionHost = useTestDriveActions();

  // The day chosen in the phone month view. When the calendar moves to a new
  // date, it follows. (Comparing during render and resetting is React's
  // documented way to do this without an effect.)
  const [syncedDate, setSyncedDate] = useState(params.date);
  const [selectedDay, setSelectedDay] = useState(params.date);
  if (params.date !== syncedDate) {
    setSyncedDate(params.date);
    setSelectedDay(params.date);
  }

  const today = getDubaiToday();
  const now = getNowInDubai(currentMinute);
  const range = getCalendarRange(params.view, params.date);
  const rangeDays = getRangeDays(range);
  const byDay = useMemo(() => groupEventsByDay(rows), [rows]);

  const updateUrl = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams.toString());
    Object.entries(changes).forEach(([key, value]) => {
      if (value) next.set(key, value);
      else next.delete(key);
    });
    startTransition(() => router.replace(`${pathname}?${next.toString()}`, { scroll: false }));
  };

  const handleNavigate = (direction: "prev" | "next" | "today") => {
    if (direction === "today") {
      updateUrl({ [CALENDAR_PARAM_KEYS.date]: today });
      return;
    }
    updateUrl({
      [CALENDAR_PARAM_KEYS.date]: shiftCalendarDate(params.view, params.date, direction === "next" ? 1 : -1),
    });
  };

  const handleViewChange = (view: TestDriveCalendarView) => updateUrl({ [CALENDAR_PARAM_KEYS.view]: view });

  const handleOpenDay = (isoDate: string) =>
    updateUrl({ [CALENDAR_PARAM_KEYS.view]: "day", [CALENDAR_PARAM_KEYS.date]: isoDate });

  const hasFilters = !!params.showroom || !!params.staff;
  const agendaDays = (isoDays: string[]) => isoDays.map((iso) => ({ iso, events: byDay.get(iso) ?? [] }));

  return (
    <div className="flex flex-col gap-4">
      <CalendarToolbar
        params={params}
        rangeLabel={formatCalendarRangeLabel(params.view, params.date)}
        count={rows.length}
        options={options}
        onNavigate={handleNavigate}
        onViewChange={handleViewChange}
        onShowroomChange={(id) => updateUrl({ [CALENDAR_PARAM_KEYS.showroom]: id })}
        onStaffChange={(staff) => updateUrl({ [CALENDAR_PARAM_KEYS.staff]: staff })}
        onShowClosedChange={(show) => updateUrl({ [CALENDAR_PARAM_KEYS.closed]: show ? "1" : null })}
        onClearFilters={() =>
          updateUrl({ [CALENDAR_PARAM_KEYS.showroom]: null, [CALENDAR_PARAM_KEYS.staff]: null })
        }
      />

      {truncated && (
        <div
          role="status"
          className="text-caption text-text-primary flex items-center gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2"
        >
          <TriangleAlert className="size-3.5 shrink-0 text-amber-400" aria-hidden="true" />
          Showing the first {CALENDAR_ROW_CAP.toLocaleString()} appointments in this period. Use the filters
          or a shorter view to narrow it down.
        </div>
      )}

      {rows.length === 0 && (
        <p role="status" className="text-body-sm text-text-muted">
          No appointments in this period{hasFilters ? " for the selected filters" : ""}.
        </p>
      )}

      <motion.div
        key={`${params.view}-${range.start}`}
        initial={prefersReducedMotion ? false : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className={isPending ? "opacity-60 transition-opacity" : "transition-opacity"}
        aria-busy={isPending}
      >
        {params.view === "month" && (
          <>
            <CalendarMonthView
              days={rangeDays}
              monthDate={params.date}
              byDay={byDay}
              today={today}
              selectedDay={selectedDay}
              onSelectDay={setSelectedDay}
              onSelectEvent={setSelected}
              onOpenDay={handleOpenDay}
            />
            <div className="mt-4 md:hidden">
              <CalendarAgenda days={agendaDays([selectedDay])} today={today} onSelectEvent={setSelected} />
            </div>
          </>
        )}

        {params.view === "week" && (
          <>
            <div className="hidden md:block">
              <CalendarTimeGrid
                days={rangeDays}
                byDay={byDay}
                today={today}
                now={now}
                ariaLabel={`Week calendar, ${formatCalendarRangeLabel("week", params.date)}`}
                clickableHeaders
                onSelectEvent={setSelected}
                onOpenDay={handleOpenDay}
              />
            </div>
            <div className="md:hidden">
              <CalendarAgenda
                days={agendaDays(rangeDays)}
                today={today}
                onSelectEvent={setSelected}
                emptyLabel="Nothing booked."
              />
            </div>
          </>
        )}

        {params.view === "day" && (
          <>
            <div className="hidden md:block">
              <CalendarTimeGrid
                days={[params.date]}
                byDay={byDay}
                today={today}
                now={now}
                ariaLabel={`Day calendar, ${formatCalendarRangeLabel("day", params.date)}`}
                clickableHeaders={false}
                onSelectEvent={setSelected}
                onOpenDay={handleOpenDay}
              />
            </div>
            <div className="md:hidden">
              <CalendarAgenda days={agendaDays([params.date])} today={today} onSelectEvent={setSelected} />
            </div>
          </>
        )}
      </motion.div>

      <CalendarLegend />

      <TestDriveQuickView
        event={selected}
        permissions={permissions}
        onClose={() => setSelected(null)}
        onAction={(action, event) => {
          // Close the quick view first: two dialogs must never be open at once.
          setSelected(null);
          actionHost.request(action, event);
        }}
        onViewAssignmentHistory={(event) => {
          setSelected(null);
          actionHost.viewAssignmentHistory(event);
        }}
      />

      {actionHost.dialogs}
    </div>
  );
}
