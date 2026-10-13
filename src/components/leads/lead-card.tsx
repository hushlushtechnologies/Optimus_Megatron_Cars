import Link from "next/link";
import type { ReactNode } from "react";
import { AlertTriangle, Car as CarIcon, Clock, MoreVertical } from "lucide-react";
import { formatDistanceToNow, isPast } from "date-fns";
import { Card } from "@/src/components/ui/card";
import { IconButton } from "@/src/components/ui/icon-button";
import { Dropdown, DropdownTrigger, DropdownContent } from "@/src/components/ui/dropdown";
import { LeadTemperatureBadge } from "@/src/components/leads/lead-temperature-badge";
import { LeadTagPill } from "@/src/components/leads/lead-tag-pill";
import { cn } from "@/src/lib/utils/cn";
import type { LeadStage, LeadSummary } from "@/src/lib/types/lead";

interface LeadCardProps {
  lead: LeadSummary;
  className?: string;
  /** All active stages, for the Move to Stage menu. Omit to hide the menu. */
  stages?: LeadStage[];
  onMoveToStage?: (stageId: string) => void;
  /** The Kanban board passes its drag handle here. The card itself is never
   *  draggable, so its link and menu stay normal, independently-focusable controls. */
  dragHandle?: ReactNode;
}

export function LeadCard({ lead, className, stages, onMoveToStage, dragHandle }: LeadCardProps) {
  const otherStages = stages?.filter((s) => s.id !== lead.stage.id) ?? [];
  const showMenu = !!onMoveToStage && otherStages.length > 0;

  const followUpDate = lead.next_follow_up_at ? new Date(lead.next_follow_up_at) : null;
  const isOverdue = followUpDate ? isPast(followUpDate) : false;

  return (
    <Card variant="elevated" padding="sm" className={cn("flex flex-col gap-2.5", className)}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-1.5">
          {dragHandle}
          <Link href={`/admin/leads/${lead.id}`} className="hover:text-primary-text min-w-0">
            <p className="text-caption text-text-subtle truncate">{lead.lead_number}</p>
            <p className="text-text-primary truncate font-medium">{lead.customer.full_name}</p>
          </Link>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <LeadTemperatureBadge temperature={lead.temperature} />
          {showMenu && (
            <Dropdown>
              <DropdownTrigger>
                <IconButton aria-label={`Actions for ${lead.lead_number}`} variant="ghost" size="sm">
                  <MoreVertical className="size-3.5" />
                </IconButton>
              </DropdownTrigger>
              <DropdownContent align="end" className="w-48 py-1">
                <p className="text-caption text-text-subtle px-4 py-1.5">Move to Stage</p>
                {otherStages.map((stage) => (
                  <button
                    key={stage.id}
                    type="button"
                    role="menuitem"
                    onClick={() => onMoveToStage?.(stage.id)}
                    className="text-body-sm text-text-primary hover:bg-card-hover flex w-full items-center gap-2.5 px-4 py-2 text-left"
                  >
                    <span
                      aria-hidden="true"
                      className="size-2 shrink-0 rounded-full"
                      style={{ backgroundColor: stage.color_hex }}
                    />
                    {stage.name}
                  </button>
                ))}
              </DropdownContent>
            </Dropdown>
          )}
        </div>
      </div>

      {lead.vehicle ? (
        <div className="text-body-sm text-text-muted flex items-center gap-1.5">
          <CarIcon className="size-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate">{lead.vehicle.display_title}</span>
          {lead.vehicle.brand_name && (
            <span className="text-caption text-text-subtle shrink-0">· {lead.vehicle.brand_name}</span>
          )}
        </div>
      ) : (
        <p className="text-body-sm text-text-subtle">No vehicle linked yet</p>
      )}

      {lead.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {lead.tags.slice(0, 3).map((tag) => (
            <LeadTagPill key={tag.id} tag={tag} />
          ))}
          {lead.tags.length > 3 && (
            <span className="text-caption text-text-subtle">+{lead.tags.length - 3}</span>
          )}
        </div>
      )}

      <div className="border-border text-caption text-text-subtle flex items-center justify-between gap-2 border-t pt-2">
        <span className="truncate">{lead.assigned_staff_name ?? "Unassigned"}</span>
        {lead.source_name && <span className="truncate">{lead.source_name}</span>}
      </div>

      {followUpDate && (
        // Overdue vs upcoming differ in icon and wording, not just color,
        // and the color itself goes through the light-mode-safe token.
        <p
          className="text-caption flex items-center gap-1.5 text-[var(--omc-status-text)]"
          style={{ "--omc-status-raw": isOverdue ? "#f87171" : "#f59e0b" } as React.CSSProperties}
        >
          {isOverdue ? (
            <AlertTriangle className="size-3 shrink-0" aria-hidden="true" />
          ) : (
            <Clock className="size-3 shrink-0" aria-hidden="true" />
          )}
          {isOverdue ? "Follow-up overdue" : "Follow up"}{" "}
          {formatDistanceToNow(followUpDate, { addSuffix: true })}
        </p>
      )}

      <p className="text-caption text-text-subtle">
        Created {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}
      </p>
    </Card>
  );
}
