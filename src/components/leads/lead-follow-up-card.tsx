import { Phone, MessageCircle, Mail, Store, Car as CarIcon, RefreshCw, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import type { LeadFollowUp, FollowUpStatus } from "@/src/lib/types/lead";

const TYPE_ICON: Record<LeadFollowUp["type"], LucideIcon> = {
  "Phone Call": Phone,
  WhatsApp: MessageCircle,
  Email: Mail,
  "Showroom Visit": Store,
  "Test Drive": CarIcon,
  "General Follow-Up": RefreshCw,
};

const STATUS_COLOR: Record<FollowUpStatus, string> = {
  Scheduled: "#60a5fa",
  Completed: "#34d399",
  Missed: "#f87171",
  Rescheduled: "#f59e0b",
  Cancelled: "#94a3b8",
};

interface LeadFollowUpCardProps {
  followUp: LeadFollowUp;
  actions?: ReactNode;
}

export function LeadFollowUpCard({ followUp, actions }: LeadFollowUpCardProps) {
  const Icon = TYPE_ICON[followUp.type];
  const statusColor = STATUS_COLOR[followUp.status];

  return (
    <div className="surface-card flex items-start justify-between gap-3 p-3">
      <div className="flex items-start gap-3">
        <span className="bg-card-hover text-primary flex size-8 shrink-0 items-center justify-center rounded-full">
          <Icon className="size-4" aria-hidden="true" />
        </span>
        <div>
          <p className="text-body-sm text-text-primary font-medium">{followUp.type}</p>
          <p className="text-caption text-text-subtle">{new Date(followUp.scheduled_at).toLocaleString()}</p>
          {followUp.notes && <p className="text-body-sm text-text-muted mt-1">{followUp.notes}</p>}
          <span
            className="text-caption mt-1.5 inline-flex items-center rounded-full border px-2 py-0.5 text-[var(--omc-status-text)]"
            style={
              {
                "--omc-status-raw": statusColor,
                backgroundColor: `${statusColor}1A`,
                borderColor: `${statusColor}66`,
              } as React.CSSProperties
            }
          >
            {followUp.status}
          </span>
        </div>
      </div>
      {actions && <div className="flex shrink-0 gap-1">{actions}</div>}
    </div>
  );
}
