import { formatDistanceToNow } from "date-fns";
import {
  UserPlus,
  RefreshCw,
  Tag,
  StickyNote,
  UserCheck,
  Car,
  ArrowRightLeft,
  type LucideIcon,
} from "lucide-react";
import type { CustomerActivityEntry } from "@/src/lib/types/customer";

interface ActivityTimelineProps {
  entries: CustomerActivityEntry[];
  emptyLabel?: string;
}

const TYPE_ICON: Record<string, LucideIcon> = {
  created: UserPlus,
  profile_updated: RefreshCw,
  tag_added: Tag,
  tag_removed: Tag,
  note_added: StickyNote,
  staff_assigned: UserCheck,
  staff_reassigned: ArrowRightLeft,
  vehicle_relation_added: Car,
  relationship_status_changed: Car,
};

export function ActivityTimeline({
  entries,
  emptyLabel = "No activity recorded yet.",
}: ActivityTimelineProps) {
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
              {formatDistanceToNow(new Date(entry.changed_at), {
                addSuffix: true,
              })}
            </p>
          </li>
        );
      })}
    </ol>
  );
}
