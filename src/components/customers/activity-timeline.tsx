import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  UserPlus,
  StickyNote,
  Tag,
  UserCog,
  Car,
  UserCheck,
  ArrowRightLeft,
  Repeat,
  Radio,
  ShieldCheck,
  ShieldOff,
  Mail,
  KeyRound,
  MessageCircle,
  RefreshCw,
  type LucideIcon,
} from "lucide-react";
import type { EnrichedActivityEntry } from "@/src/lib/supabase/customer-detail-queries";

interface ActivityTimelineProps {
  entries: EnrichedActivityEntry[];
  emptyLabel?: string;
}

const TYPE_ICON: Record<string, LucideIcon> = {
  created: UserPlus,
  note_added: StickyNote,
  tag_added: Tag,
  tag_removed: Tag,
  prm_changed: UserCog,
  vehicle_relation_added: Car,
  staff_assigned: UserCheck,
  staff_reassigned: ArrowRightLeft,
  relationship_status_changed: Car,
  status_changed: Repeat,
  source_changed: Radio,
  account_activated: ShieldCheck,
  account_disabled: ShieldOff,
  account_setup_sent: Mail,
  password_reset_sent: KeyRound,
  communication_logged: MessageCircle,
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
