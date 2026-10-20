import { formatDistanceToNow } from "date-fns";
import {
  ArrowRightLeft,
  Ban,
  BadgeCheck,
  CalendarClock,
  CalendarPlus,
  CheckCircle2,
  LogIn,
  MessageSquareText,
  Pencil,
  RefreshCw,
  StickyNote,
  UserCheck,
  UserPlus,
  UserX,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { Skeleton } from "@/src/components/ui/skeleton";
import { formatDateTimeFull } from "@/src/lib/utils/test-drive-format";
import type { TestDriveTimelineEntry } from "@/src/lib/types/test-drive";

// Matches the activity_type values the Phase 1 triggers write, plus the ones
// later phases will add (notes, feedback, follow-ups).
const TYPE_ICON: Record<string, LucideIcon> = {
  created: UserPlus,
  approved: CheckCircle2,
  rejected: XCircle,
  cancelled: Ban,
  rescheduled: CalendarClock,
  completed: BadgeCheck,
  no_show: UserX,
  staff_assigned: UserCheck,
  staff_reassigned: ArrowRightLeft,
  checked_in: LogIn,
  updated: Pencil,
  note_added: StickyNote,
  feedback_recorded: MessageSquareText,
  follow_up_created: CalendarPlus,
};

interface TestDriveTimelineProps {
  entries: TestDriveTimelineEntry[];
  isLoading?: boolean;
  emptyLabel?: string;
}

export function TestDriveTimeline({
  entries,
  isLoading,
  emptyLabel = "No activity recorded yet.",
}: TestDriveTimelineProps) {
  if (isLoading) {
    return (
      <div
        className="border-border flex flex-col gap-5 border-l pl-4"
        aria-busy="true"
        aria-label="Loading activity"
      >
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-1.5">
            <Skeleton className="h-4 w-56" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return <p className="text-body-sm text-text-muted">{emptyLabel}</p>;
  }

  return (
    <ol className="border-border relative flex flex-col gap-5 border-l pl-4">
      {entries.map((entry) => {
        const Icon = TYPE_ICON[entry.activity_type] ?? RefreshCw;
        return (
          <li key={entry.id} className="relative">
            <span className="bg-card-hover text-primary absolute top-0.5 -left-[25px] flex size-5 items-center justify-center rounded-full">
              <Icon className="size-3" aria-hidden="true" />
            </span>
            <p className="text-body-sm text-text-primary">{entry.description}</p>
            <p className="text-caption text-text-subtle mt-0.5">
              {entry.changedByName} ·{" "}
              <time
                dateTime={entry.changed_at}
                title={formatDateTimeFull(entry.changed_at)}
                suppressHydrationWarning
              >
                {formatDistanceToNow(new Date(entry.changed_at), { addSuffix: true })}
              </time>
            </p>
          </li>
        );
      })}
    </ol>
  );
}
