"use client";

import { ChevronLeft, ChevronRight, FilterX } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { IconButton } from "@/src/components/ui/icon-button";
import { Select } from "@/src/components/ui/select";
import { Switch } from "@/src/components/ui/switch";
import { Tooltip } from "@/src/components/ui/tooltip";
import {
  UNASSIGNED_STAFF_FILTER,
  type TestDriveCalendarParams,
  type TestDriveCalendarView,
} from "@/src/lib/utils/test-drive-calendar";
import type { TestDriveCalendarFilterOptions } from "@/src/lib/types/test-drive";

const VIEWS: { value: TestDriveCalendarView; label: string }[] = [
  { value: "month", label: "Month" },
  { value: "week", label: "Week" },
  { value: "day", label: "Day" },
];

interface CalendarToolbarProps {
  params: TestDriveCalendarParams;
  rangeLabel: string;
  count: number;
  options: TestDriveCalendarFilterOptions;
  onNavigate: (direction: "prev" | "next" | "today") => void;
  onViewChange: (view: TestDriveCalendarView) => void;
  onShowroomChange: (showroomId: string | null) => void;
  onStaffChange: (staff: string | null) => void;
  onShowClosedChange: (show: boolean) => void;
  onClearFilters: () => void;
}

export function CalendarToolbar({
  params,
  rangeLabel,
  count,
  options,
  onNavigate,
  onViewChange,
  onShowroomChange,
  onStaffChange,
  onShowClosedChange,
  onClearFilters,
}: CalendarToolbarProps) {
  const hasFilters = !!params.showroom || !!params.staff;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1">
            <Tooltip content="Previous">
              <IconButton
                aria-label={`Previous ${params.view}`}
                variant="outline"
                size="sm"
                onClick={() => onNavigate("prev")}
              >
                <ChevronLeft className="size-4" />
              </IconButton>
            </Tooltip>
            <Tooltip content="Next">
              <IconButton
                aria-label={`Next ${params.view}`}
                variant="outline"
                size="sm"
                onClick={() => onNavigate("next")}
              >
                <ChevronRight className="size-4" />
              </IconButton>
            </Tooltip>
          </div>

          <Tooltip content="Jump to today">
            <Button type="button" size="sm" variant="secondary" onClick={() => onNavigate("today")}>
              Today
            </Button>
          </Tooltip>

          <h2 aria-live="polite" className="text-h3 text-text-primary ml-1">
            {rangeLabel}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <p aria-live="polite" className="text-body-sm text-text-muted">
            {count.toLocaleString()} {count === 1 ? "appointment" : "appointments"}
          </p>

          <div
            role="group"
            aria-label="Calendar view"
            className="border-border flex items-center gap-1 rounded-md border p-0.5"
          >
            {VIEWS.map((view) => (
              <Button
                key={view.value}
                type="button"
                size="sm"
                variant={params.view === view.value ? "outline" : "ghost"}
                aria-pressed={params.view === view.value}
                onClick={() => onViewChange(view.value)}
              >
                {view.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto_auto]">
        <Select
          label="Showroom"
          placeholder="All showrooms"
          options={options.showrooms.map((s) => ({ value: s.id, label: s.name }))}
          value={params.showroom ?? ""}
          onChange={(e) => onShowroomChange(e.target.value || null)}
        />
        <Select
          label="Staff"
          placeholder="All staff"
          options={[
            { value: UNASSIGNED_STAFF_FILTER, label: "Unassigned" },
            ...options.staff.map((s) => ({ value: s.id, label: s.full_name })),
          ]}
          value={params.staff ?? ""}
          onChange={(e) => onStaffChange(e.target.value || null)}
        />

        <div className="flex flex-col gap-1 pb-1">
          <Switch
            label="Show cancelled and rejected"
            checked={params.showClosed}
            onCheckedChange={onShowClosedChange}
          />
        </div>

        {hasFilters ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            leftIcon={<FilterX className="size-4" />}
            onClick={onClearFilters}
          >
            Clear filters
          </Button>
        ) : (
          <span className="hidden lg:block" />
        )}
      </div>
    </div>
  );
}
