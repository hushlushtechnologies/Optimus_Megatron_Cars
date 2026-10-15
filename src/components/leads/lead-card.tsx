import Link from "next/link";
import { memo } from "react";
import { AlertTriangle, Car as CarIcon, Clock, MoreVertical, Trophy, XCircle } from "lucide-react";
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
  /** All active stages. Only the open ones are offered for moving. */
  stages?: LeadStage[];
  onMoveToStage?: (stageId: string) => void;
  onMarkWon?: () => void;
  onMarkLost?: () => void;
}

// memo() matters on the Kanban board: while dragging, dnd-kit re-renders every
// card on every frame. With stable props this whole card is skipped, so only
// the thin sortable wrapper around it re-renders.
export const LeadCard = memo(function LeadCard({
  lead,
  className,
  stages,
  onMoveToStage,
  onMarkWon,
  onMarkLost,
}: LeadCardProps) {
  const isOpen = lead.stage.stage_type === "open";
  const openStages = stages?.filter((s) => s.stage_type === "open" && s.id !== lead.stage.id) ?? [];
  const canMove = !!onMoveToStage && openStages.length > 0;
  const canClose = isOpen && (!!onMarkWon || !!onMarkLost);
  const showMenu = canMove || canClose;

  const followUpDate = lead.next_follow_up_at ? new Date(lead.next_follow_up_at) : null;
  const isOverdue = followUpDate ? isPast(followUpDate) : false;

  return (
    <Card variant="elevated" padding="sm" className={cn("flex flex-col gap-2.5", className)}>
      <div className="flex items-start justify-between gap-2">
        <Link href={`/admin/leads/${lead.id}`} className="hover:text-primary-text min-w-0">
          <p className="text-caption text-text-subtle truncate">{lead.lead_number}</p>
          <p className="text-text-primary truncate font-medium">{lead.customer.full_name}</p>
        </Link>

        <div className="flex shrink-0 items-center gap-1">
          <LeadTemperatureBadge temperature={lead.temperature} />
          {showMenu && (
            <Dropdown>
              <DropdownTrigger>
                <IconButton aria-label={`Actions for ${lead.lead_number}`} variant="ghost" size="sm">
                  <MoreVertical className="size-3.5" />
                </IconButton>
              </DropdownTrigger>
              <DropdownContent align="end" className="w-52 py-1">
                {canMove && (
                  <>
                    <p className="text-caption text-text-subtle px-4 py-1.5">
                      {isOpen ? "Move to Stage" : "Reopen in Stage"}
                    </p>
                    {openStages.map((stage) => (
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
                  </>
                )}
                {canClose && (
                  <>
                    <div className="border-border my-1 border-t" role="separator" />
                    {onMarkWon && (
                      <button
                        type="button"
                        role="menuitem"
                        onClick={onMarkWon}
                        className="text-body-sm text-text-primary hover:bg-card-hover flex w-full items-center gap-2.5 px-4 py-2 text-left"
                      >
                        <Trophy className="text-text-muted size-4" aria-hidden="true" />
                        Mark as Won…
                      </button>
                    )}
                    {onMarkLost && (
                      <button
                        type="button"
                        role="menuitem"
                        onClick={onMarkLost}
                        className="text-body-sm text-text-primary hover:bg-card-hover flex w-full items-center gap-2.5 px-4 py-2 text-left"
                      >
                        <XCircle className="text-text-muted size-4" aria-hidden="true" />
                        Mark as Lost…
                      </button>
                    )}
                  </>
                )}
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
});
