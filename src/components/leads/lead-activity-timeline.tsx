import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  UserPlus,
  Repeat,
  UserCheck,
  ArrowRightLeft,
  StickyNote,
  Tag,
  Thermometer,
  CalendarPlus,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  CalendarClock,
  Trophy,
  MessageCircle,
  RefreshCw,
  type LucideIcon,
} from "lucide-react";
import type { EnrichedLeadActivityEntry } from "@/src/lib/supabase/lead-activity-queries";

interface LeadActivityTimelineProps {
  entries: EnrichedLeadActivityEntry[];
  emptyLabel?: string;
}

const TYPE_ICON: Record<string, LucideIcon> = {
  created: UserPlus,
  stage_changed: Repeat,
  staff_assigned: UserCheck,
  staff_reassigned: ArrowRightLeft,
  note_added: StickyNote,
  tag_added: Tag,
  tag_removed: Tag,
  temperature_changed: Thermometer,
  follow_up_created: CalendarPlus,
  follow_up_completed: CheckCircle2,
  follow_up_cancelled: XCircle,
  follow_up_missed: AlertTriangle,
  follow_up_rescheduled: CalendarClock,
  won: Trophy,
  lost: XCircle,
  communication_logged: MessageCircle,
};

export function LeadActivityTimeline({
  entries,
  emptyLabel = "No activity recorded yet.",
}: LeadActivityTimelineProps) {
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
            {entry.relatedCar && (
              <Link
                href={`/admin/inventory/${entry.relatedCar.id}`}
                className="text-caption text-primary-text hover:text-primary-hover"
              >
                {entry.relatedCar.display_title}
              </Link>
            )}
            <p className="text-caption text-text-subtle mt-0.5">
              {entry.changedByName} · {formatDistanceToNow(new Date(entry.changed_at), { addSuffix: true })}
            </p>
          </li>
        );
      })}
    </ol>
  );
}
